'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotificationAndSendPush } from '@/app/actions/pushActions';

/**
 * Creates a new advice request post, uploading optional image and options if poll is active.
 */
export async function createAdvicePost(formData) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const title = formData.get('title');
  const content = formData.get('content');
  const additionalDetails = formData.get('additional_details') || '';
  const category = formData.get('category');
  const anonymousMode = formData.get('anonymous_mode') === 'true';
  const isPoll = formData.get('is_poll') === 'true';
  const localitySlug = formData.get('locality');
  const imageUrl = formData.get('image_url') || null;

  if (!title || !content || !category) {
    return { error: 'Missing required fields' };
  }

  // Resolve localitySlug to locality_id
  let localityId = null;
  if (localitySlug) {
    const { data: loc } = await supabase
      .from('localities')
      .select('id')
      .eq('slug', localitySlug)
      .maybeSingle();
    if (loc) localityId = loc.id;
  }

  const { data, error } = await supabase
    .from('advice_posts')
    .insert({
      user_id: user.id,
      locality_id: localityId,
      category,
      title,
      content,
      additional_details: additionalDetails,
      anonymous_mode: anonymousMode,
      is_poll: isPoll,
      image_url: imageUrl
    })
    .select('slug, id')
    .single();

  if (error) {
    console.error('Failed to create advice post:', error.message);
    return { error: error.message };
  }

  // If poll is enabled, insert poll options
  if (isPoll && data) {
    const pollOptionsStr = formData.get('poll_options');
    if (pollOptionsStr) {
      try {
        const options = JSON.parse(pollOptionsStr);
        const optionsToInsert = options.map((optText, index) => ({
          advice_post_id: data.id,
          option_text: optText,
          sort_order: index
        }));
        await supabase.from('advice_poll_options').insert(optionsToInsert);
      } catch (err) {
        console.error('Failed to insert advice poll options:', err.message);
      }
    }
  }

  revalidatePath('/advice');
  return { success: true, slug: data.slug };
}

/**
 * Fetches feed data of advice questions. Supports Trending gravity ranking, categories, and localities.
 */
export async function fetchAdviceFeed(filter = 'new', category = null, localitySlug = null, page = 1, limit = 10) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient(false); // Bypasses cookies for public static cached fetches
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let localityId = null;
  if (localitySlug && localitySlug !== 'hyderabad') {
    const { data: loc } = await supabase
      .from('localities')
      .select('id')
      .eq('slug', localitySlug)
      .maybeSingle();
    if (loc) localityId = loc.id;
  }

  // Check auth user session
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();

  let data = [];
  let error = null;

  if (filter === 'trending') {
    const { data: trendingData, error: trendErr } = await supabase
      .rpc('get_trending_advice_posts_decayed', {
        p_locality_id: localityId,
        p_category: category || null,
        p_limit: limit,
        p_offset: from
      });
    data = trendingData;
    error = trendErr;
  } else if (filter === 'my_questions' && user) {
    const { data: follows } = await userClient
      .from('advice_followers')
      .select('advice_post_id')
      .eq('user_id', user.id);
    const followedIds = (follows || []).map(f => f.advice_post_id);

    let query = supabase.from('advice_posts').select('*');
    if (followedIds.length > 0) {
      query = query.or(`user_id.eq.${user.id},id.in.(${followedIds.join(',')})`);
    } else {
      query = query.eq('user_id', user.id);
    }

    if (category) query = query.eq('category', category);
    if (localityId) query = query.eq('locality_id', localityId);

    const { data: myData, error: myErr } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    data = myData;
    error = myErr;
  } else {
    let query = supabase.from('advice_posts').select('*');
    if (category) query = query.eq('category', category);
    if (localityId) query = query.eq('locality_id', localityId);
    
    const { data: newData, error: newErr } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    data = newData;
    error = newErr;
  }

  if (error || !data) {
    console.error('fetchAdviceFeed error:', error?.message);
    return [];
  }

  const authorIds = data.map(p => p.user_id);
  const locIds = data.map(p => p.locality_id).filter(Boolean);

  const [profilesRes, localitiesRes] = await Promise.all([
    supabase.from('profiles').select('id, username, display_name, avatar_url, is_admin').in('id', authorIds),
    locIds.length > 0 ? supabase.from('localities').select('id, slug, name, emoji').in('id', locIds) : Promise.resolve({ data: [] })
  ]);

  const profilesMap = {};
  (profilesRes.data || []).forEach(p => { profilesMap[p.id] = p; });

  const localitiesMap = {};
  (localitiesRes.data || []).forEach(l => { localitiesMap[l.id] = l; });

  return data.map(post => {
    let authorProfile = profilesMap[post.user_id] || null;
    
    // Anonymize profile if anonymous_mode is true
    if (post.anonymous_mode && (!user || (user.id !== post.user_id && !profilesMap[user.id]?.is_admin))) {
      authorProfile = {
        username: 'anonymous',
        display_name: 'Anonymous User ☕',
        avatar_url: ''
      };
    }

    return {
      ...post,
      profiles: authorProfile,
      localities: localitiesMap[post.locality_id] || null
    };
  });
}

/**
 * Fetches a single advice post by its slug, parsing anonymous flags and poll parameters.
 */
export async function fetchAdvicePostBySlug(slug) {
  if (!isSupabaseConfigured()) return null;
  
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();

  const supabase = await createClient(false);
  const { data: post, error } = await supabase
    .from('advice_posts')
    .select('*, localities:locality_id (id, name, slug, emoji)')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !post) return null;

  const { data: author } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, is_admin')
    .eq('id', post.user_id)
    .single();

  let authorProfile = author;
  if (post.anonymous_mode && (!user || (user.id !== post.user_id && !author?.is_admin))) {
    authorProfile = {
      username: 'anonymous',
      display_name: 'Anonymous User ☕',
      avatar_url: ''
    };
  }
  post.profiles = authorProfile;

  let pollOptions = [];
  let userVotedOptionId = null;
  if (post.is_poll) {
    const { data: opts } = await supabase
      .from('advice_poll_options')
      .select('*')
      .eq('advice_post_id', post.id)
      .order('sort_order', { ascending: true });
    pollOptions = opts || [];

    if (user) {
      const { data: vote } = await userClient
        .from('advice_poll_votes')
        .select('poll_option_id')
        .eq('advice_post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (vote) userVotedOptionId = vote.poll_option_id;
    }
  }

  const { data: updates } = await supabase
    .from('advice_updates')
    .select('*')
    .eq('advice_post_id', post.id)
    .order('created_at', { ascending: true });

  const { data: rxData } = await supabase
    .from('advice_post_reactions')
    .select('emoji')
    .eq('advice_post_id', post.id);
  
  const reactionsSummary = { '🙏': 0, '☕': 0, '❤️': 0, '👏': 0, '🌟': 0 };
  (rxData || []).forEach(r => {
    if (reactionsSummary[r.emoji] !== undefined) {
      reactionsSummary[r.emoji]++;
    }
  });

  let userReactions = [];
  if (user) {
    const { data: userRx } = await userClient
      .from('advice_post_reactions')
      .select('emoji')
      .eq('advice_post_id', post.id)
      .eq('user_id', user.id);
    userReactions = (userRx || []).map(r => r.emoji);
  }

  let isFollowing = false;
  if (user) {
    const { data: follow } = await userClient
      .from('advice_followers')
      .select('advice_post_id')
      .eq('advice_post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle();
    isFollowing = !!follow;
  }

  return {
    ...post,
    poll_options: pollOptions,
    user_voted_option_id: userVotedOptionId,
    updates: updates || [],
    reactions_summary: reactionsSummary,
    user_reactions: userReactions,
    is_following: isFollowing
  };
}

/**
 * Creates a new advice reply, raising alerts for post owner and followers.
 */
export async function addAdviceReply(postId, content) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  if (!content.trim()) return { error: 'Content is empty' };

  const { data: reply, error } = await supabase
    .from('advice_replies')
    .insert({
      advice_post_id: postId,
      user_id: user.id,
      content: content.trim()
    })
    .select('*, profiles:user_id (username, display_name, avatar_url)')
    .single();

  if (error) return { error: error.message };

  const { data: post } = await supabase
    .from('advice_posts')
    .select('user_id, slug')
    .eq('id', postId)
    .single();

  if (post) {
    if (post.user_id !== user.id) {
      await createNotificationAndSendPush({
        userId: post.user_id,
        actorId: user.id,
        type: 'ADVICE_REPLY',
        referenceId: postId
      });
    }

    const { data: followers } = await supabase
      .from('advice_followers')
      .select('user_id')
      .eq('advice_post_id', postId);

    if (followers && followers.length > 0) {
      for (const follower of followers) {
        if (follower.user_id !== user.id && follower.user_id !== post.user_id) {
          await createNotificationAndSendPush({
            userId: follower.user_id,
            actorId: user.id,
            type: 'ADVICE_FOLLOWER_NEW_REPLY',
            referenceId: postId
          });
        }
      }
    }
  }

  revalidatePath(`/advice/post/${post?.slug}`);
  return { success: true, reply };
}

/**
 * Casts a vote inside an advice poll.
 */
export async function voteAdvicePoll(postId, optionId) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('advice_poll_votes')
    .insert({
      user_id: user.id,
      advice_post_id: postId,
      poll_option_id: optionId
    });

  if (error) {
    if (error.code === '23505') return { error: 'Already voted on this poll' };
    return { error: error.message };
  }

  const { data: post } = await supabase.from('advice_posts').select('slug').eq('id', postId).single();
  if (post?.slug) revalidatePath(`/advice/post/${post.slug}`);
  
  return { success: true };
}

/**
 * Toggles a support reaction on an advice post.
 */
export async function toggleAdviceReaction(postId, emoji) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('advice_post_reactions')
    .select('id')
    .eq('advice_post_id', postId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle();

  const { data: post } = await supabase.from('advice_posts').select('slug').eq('id', postId).single();

  if (existing) {
    await supabase.from('advice_post_reactions').delete().eq('id', existing.id);
    if (post?.slug) revalidatePath(`/advice/post/${post.slug}`);
    return { success: true, action: 'removed' };
  } else {
    const { error } = await supabase
      .from('advice_post_reactions')
      .insert({
        advice_post_id: postId,
        user_id: user.id,
        emoji
      });
    if (error) return { error: error.message };
    
    if (post?.slug) revalidatePath(`/advice/post/${post.slug}`);
    return { success: true, action: 'added' };
  }
}

/**
 * Votes/rates an advice reply as helpful or very helpful.
 */
export async function rateAdviceReply(replyId, rating) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: reply } = await supabase
    .from('advice_replies')
    .select('user_id, advice_post_id')
    .eq('id', replyId)
    .single();

  if (!reply) return { error: 'Reply not found' };
  if (reply.user_id === user.id) return { error: 'Cannot rate your own advice reply' };

  const { data: existing } = await supabase
    .from('advice_reply_ratings')
    .select('rating')
    .eq('reply_id', replyId)
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: post } = await supabase.from('advice_posts').select('slug').eq('id', reply.advice_post_id).single();

  if (existing && existing.rating === rating) {
    await supabase.from('advice_reply_ratings').delete().eq('reply_id', replyId).eq('user_id', user.id);
    if (post?.slug) revalidatePath(`/advice/post/${post.slug}`);
    return { success: true, action: 'removed' };
  } else {
    const { error } = await supabase
      .from('advice_reply_ratings')
      .upsert({
        reply_id: replyId,
        user_id: user.id,
        rating
      });

    if (error) return { error: error.message };

    await createNotificationAndSendPush({
      userId: reply.user_id,
      actorId: user.id,
      type: 'ADVICE_REPLY_HELPFUL',
      referenceId: replyId,
      content: rating
    });

    if (post?.slug) revalidatePath(`/advice/post/${post.slug}`);
    return { success: true, action: 'added' };
  }
}

/**
 * Selects a reply as the "Best Advice", pinning it to the top.
 */
export async function markBestAdvice(postId, replyId) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: post } = await supabase
    .from('advice_posts')
    .select('user_id, slug')
    .eq('id', postId)
    .single();

  if (!post) return { error: 'Post not found' };
  if (post.user_id !== user.id) return { error: 'Unauthorized to mark best advice' };

  const { error: resetErr } = await supabase
    .from('advice_replies')
    .update({ is_best_advice: false })
    .eq('advice_post_id', postId);

  if (resetErr) return { error: resetErr.message };

  if (replyId) {
    const { error: setErr } = await supabase
      .from('advice_replies')
      .update({ is_best_advice: true })
      .eq('id', replyId);

    if (setErr) return { error: setErr.message };

    const { data: reply } = await supabase
      .from('advice_replies')
      .select('user_id')
      .eq('id', replyId)
      .single();

    if (reply) {
      if (reply.user_id !== user.id) {
        await createNotificationAndSendPush({
          userId: reply.user_id,
          actorId: user.id,
          type: 'ADVICE_BEST_SELECTION',
          referenceId: replyId
        });
      }

      const { data: followers } = await supabase
        .from('advice_followers')
        .select('user_id')
        .eq('advice_post_id', postId);

      if (followers && followers.length > 0) {
        for (const follower of followers) {
          if (follower.user_id !== user.id && follower.user_id !== reply.user_id) {
            await createNotificationAndSendPush({
              userId: follower.user_id,
              actorId: user.id,
              type: 'ADVICE_FOLLOWER_BEST',
              referenceId: postId
            });
          }
        }
      }
    }
  }

  revalidatePath(`/advice/post/${post.slug}`);
  return { success: true };
}

/**
 * Subscribes or unsubscribes to an advice thread.
 */
export async function toggleFollowAdvice(postId) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('advice_followers')
    .select('advice_post_id')
    .eq('advice_post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: post } = await supabase
    .from('advice_posts')
    .select('user_id, slug')
    .eq('id', postId)
    .single();

  if (existing) {
    await supabase.from('advice_followers').delete().eq('advice_post_id', postId).eq('user_id', user.id);
    if (post?.slug) revalidatePath(`/advice/post/${post.slug}`);
    return { success: true, action: 'unfollowed' };
  } else {
    const { error } = await supabase
      .from('advice_followers')
      .insert({
        advice_post_id: postId,
        user_id: user.id
      });
    if (error) return { error: error.message };

    if (post && post.user_id !== user.id) {
      await createNotificationAndSendPush({
        userId: post.user_id,
        actorId: user.id,
        type: 'ADVICE_POST_FOLLOW',
        referenceId: postId
      });
    }

    if (post?.slug) revalidatePath(`/advice/post/${post.slug}`);
    return { success: true, action: 'followed' };
  }
}

/**
 * Creates a author updates row to update status.
 */
export async function addAdviceUpdate(postId, content) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  if (!content.trim()) return { error: 'Content is empty' };

  const { data: post } = await supabase
    .from('advice_posts')
    .select('user_id, slug')
    .eq('id', postId)
    .single();

  if (!post) return { error: 'Post not found' };
  if (post.user_id !== user.id) return { error: 'Unauthorized to post updates' };

  const { data: update, error } = await supabase
    .from('advice_updates')
    .insert({
      advice_post_id: postId,
      content: content.trim()
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const { data: followers } = await supabase
    .from('advice_followers')
    .select('user_id')
    .eq('advice_post_id', postId);

  if (followers && followers.length > 0) {
    for (const follower of followers) {
      if (follower.user_id !== user.id) {
        await createNotificationAndSendPush({
          userId: follower.user_id,
          actorId: user.id,
          type: 'ADVICE_FOLLOWER_UPDATE',
          referenceId: postId
        });
      }
    }
  }

  revalidatePath(`/advice/post/${post.slug}`);
  return { success: true, update };
}

/**
 * Fetches all replies for an advice post.
 */
export async function fetchAdviceReplies(postId) {
  if (!isSupabaseConfigured()) return [];

  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();

  const supabase = await createClient(false);
  const { data: replies, error } = await supabase
    .from('advice_replies')
    .select(`
      *,
      profiles:user_id (id, username, display_name, avatar_url)
    `)
    .eq('advice_post_id', postId)
    .order('created_at', { ascending: true });

  if (error || !replies) return [];

  let userRatingsMap = {};
  if (user && replies.length > 0) {
    const replyIds = replies.map(r => r.id);
    const { data: ratings } = await userClient
      .from('advice_reply_ratings')
      .select('reply_id, rating')
      .in('reply_id', replyIds)
      .eq('user_id', user.id);

    (ratings || []).forEach(rt => {
      userRatingsMap[rt.reply_id] = rt.rating;
    });
  }

  return replies.map(reply => ({
    ...reply,
    user_rating: userRatingsMap[reply.id] || null
  }));
}
