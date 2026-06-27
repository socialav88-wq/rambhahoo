'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleReaction(postId, commentId, emoji) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Query existing reaction for this user and target (post or comment)
  let query = supabase.from('reactions').select('id, emoji').eq('user_id', user.id);
  if (postId)    query = query.eq('post_id', postId);
  if (commentId) query = query.eq('comment_id', commentId);

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    if (existing.emoji === emoji) {
      // Toggle off: Delete reaction if same emoji is clicked
      const { error } = await supabase.from('reactions').delete().eq('id', existing.id);
      if (error) return { error: error.message };
      return { success: true, action: 'removed' };
    } else {
      // Change reaction: Delete old one and insert new one to bypass lack of UPDATE RLS policy
      const { error: delErr } = await supabase.from('reactions').delete().eq('id', existing.id);
      if (delErr) return { error: delErr.message };

      const { error: insErr } = await supabase.from('reactions').insert({
        user_id: user.id,
        post_id:    postId    || null,
        comment_id: commentId || null,
        emoji,
      });
      if (insErr) return { error: insErr.message };

      // Trigger notification for reaction change
      await triggerReactionNotification(supabase, user.id, postId, commentId, emoji);
      return { success: true, action: 'added', prevEmoji: existing.emoji };
    }
  } else {
    // New reaction: Insert record
    const { error } = await supabase.from('reactions').insert({
      user_id: user.id,
      post_id:    postId    || null,
      comment_id: commentId || null,
      emoji,
    });
    if (error) return { error: error.message };

    // Trigger notification
    await triggerReactionNotification(supabase, user.id, postId, commentId, emoji);
    return { success: true, action: 'added' };
  }
}

// Helper to trigger reaction notifications safely
async function triggerReactionNotification(supabase, actorId, postId, commentId, emoji) {
  try {
    const { createNotificationAndSendPush } = await import('@/app/actions/pushActions');

    if (postId) {
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).maybeSingle();
      if (post && post.user_id !== actorId) {
        if (emoji === '👍') {
          await createNotificationAndSendPush({
            userId: post.user_id,
            actorId,
            type: 'POST_LIKE',
            referenceId: postId
          });
        } else {
          await createNotificationAndSendPush({
            userId: post.user_id,
            actorId,
            type: 'POST_REACTION',
            referenceId: postId,
            content: emoji
          });
        }
      }
    } else if (commentId) {
      const { data: comment } = await supabase
        .from('comments')
        .select('user_id, post_id')
        .eq('id', commentId)
        .maybeSingle();

      if (comment && comment.user_id !== actorId) {
        await createNotificationAndSendPush({
          userId: comment.user_id,
          actorId,
          type: 'COMMENT_REACTION',
          referenceId: comment.post_id, // post_id for redirect reference
          content: emoji
        });
      }
    }
  } catch (err) {
    console.error('[TRIGGER-REACTION-NOTIFICATION-ERROR]', err);
  }
}

export async function addComment(postId, content, parentId = null) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: user.id, content, parent_id: parentId || null })
    .select('*, profiles:user_id (username, display_name, avatar_url)')
    .single();

  if (error) return { error: error.message };

  // Generate Notification
  if (postId) {
    const { createNotificationAndSendPush, parseMentionsAndNotify } = await import('@/app/actions/pushActions');

    if (parentId) {
      // It's a reply to a comment - notify the parent comment author
      const { data: parentComment } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', parentId)
        .maybeSingle();

      if (parentComment && parentComment.user_id !== user.id) {
        await createNotificationAndSendPush({
          userId: parentComment.user_id,
          actorId: user.id,
          type: 'COMMENT_REPLY',
          referenceId: postId
        });
      }
    } else {
      // It's a root comment - notify the post owner
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).maybeSingle();
      if (post && post.user_id !== user.id) {
        await createNotificationAndSendPush({
          userId: post.user_id,
          actorId: user.id,
          type: 'POST_COMMENT',
          referenceId: postId
        });
      }
    }

    // Parse mentions inside comments
    await parseMentionsAndNotify({
      content,
      referenceId: postId,
      actorId: user.id,
      isPost: false
    });
  }

  revalidatePath('/');
  return { success: true, comment: data };
}

export async function votePoll(postId, optionId) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('poll_votes').insert({
    user_id: user.id, post_id: postId, poll_option_id: optionId,
  });

  if (error) {
    if (error.code === '23505') return { error: 'Already voted on this poll' };
    return { error: error.message };
  }

  // Generate Notification
  const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).maybeSingle();
  if (post && post.user_id !== user.id) {
    const { createNotificationAndSendPush } = await import('@/app/actions/pushActions');
    await createNotificationAndSendPush({
      userId: post.user_id,
      actorId: user.id,
      type: 'POLL_VOTE',
      referenceId: postId
    });
  }

  revalidatePath('/');
  return { success: true };
}

export async function getUserReactions(postId) {
  if (!isSupabaseConfigured()) return [];
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('reactions').select('emoji').eq('user_id', user.id).eq('post_id', postId);
  return (data || []).map(r => r.emoji);
}

// ===== DELETE COMMENT =====
export async function deleteComment(commentId, postId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    // Fetch comment owner and associated post owner with unambiguous relation name
    const { data: comment, error: fetchErr } = await supabase
      .from('comments')
      .select('user_id, posts!comments_post_id_fkey!inner (user_id)')
      .eq('id', commentId)
      .maybeSingle();

    if (fetchErr) return { error: fetchErr.message };
    if (!comment) return { error: 'Comment not found' };

    const isCommentAuthor = comment.user_id === user.id;
    const isPostAuthor = comment.posts?.user_id === user.id;

    if (!isCommentAuthor && !isPostAuthor) {
      return { error: 'You do not have permission to delete this comment' };
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    
    if (error) return { error: error.message };
    
    revalidatePath(`/post/${postId}`);
    return { success: true };
  } catch (err) {
    console.error('[DELETE-COMMENT-ERROR]', err);
    return { error: 'Failed to delete comment' };
  }
}

// ===== SAVE POST =====
export async function toggleSavePost(postId) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { data: existing } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle();

    if (existing) {
      await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', postId);
      return { success: true, action: 'unsaved' };
    } else {
      await supabase.from('saved_posts').insert({ user_id: user.id, post_id: postId });
      return { success: true, action: 'saved' };
    }
  } catch (err) {
    return { error: 'Failed to save post' };
  }
}

// ===== REPORT POST =====
export async function reportPost(postId, reason = 'Inappropriate content') {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // We allow anonymous reports or just require auth? Let's require auth.
  if (!user) return { error: 'Not authenticated' };

  try {
    const { error } = await supabase
      .from('reports')
      .insert({ reporter_id: user.id, post_id: postId, reason });
      
    if (error) return { error: error.message };

    // Generate Admin Notifications
    const { data: admins } = await supabase.from('profiles').select('id').eq('is_admin', true);
    if (admins && admins.length > 0) {
      const { createNotificationAndSendPush } = await import('@/app/actions/pushActions');
      for (const admin of admins) {
        await createNotificationAndSendPush({
          userId: admin.id,
          actorId: user.id,
          type: 'POST_REPORT',
          referenceId: postId,
          content: reason
        });
      }
    }

    return { success: true };
  } catch (err) {
    return { error: 'Failed to report post' };
  }
}
