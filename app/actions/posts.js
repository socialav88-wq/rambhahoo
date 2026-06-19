'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { revalidatePath, unstable_cache } from 'next/cache';
import { LOCALITIES } from '@/lib/constants';

// ─── Server-side timer util ──────────────────────────────────────────────────
function ts(label) {
  const t = Date.now();
  return {
    end: (extra = '') => {
      const ms = Date.now() - t;
      console.log(`[SERVER:posts] ✔ ${label}${extra ? ' — ' + extra : ''} (${ms}ms)`);
      return ms;
    },
    fail: (err) => {
      const ms = Date.now() - t;
      console.error(`[SERVER:posts] ✘ ${label} FAILED after ${ms}ms:`, err?.message || err);
      return ms;
    },
  };
}

function checkIsIndexable(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  const spamWords = ['qwerty', 'asdf', 'test', 'hello', 'hi', 'sample'];
  const words = text.split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(Boolean);
  if (words.length === 0) return false;
  
  // If keyboard smash is anywhere
  const hasBadWord = words.some(w => w === 'asdf' || w === 'qwerty');
  if (hasBadWord) return false;
  
  // If the post has less than 3 words and contains any spam/boilerplate word
  if (words.length < 3 && words.some(w => spamWords.includes(w))) {
    return false;
  }
  
  // If all words are spam words
  const allSpam = words.every(w => spamWords.includes(w));
  if (allSpam) return false;

  // Single word posts of any kind are not indexable
  if (words.length < 2) return false;
  
  return true;
}

// ===== FETCH FEEDS =====
export async function fetchFeeds(filter = 'new', localitySlug = null, lat = null, lng = null, radiusMeters = 5000, page = 1, limit = 10, category = null) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();

  // Get user and locality in parallel
  const [userRes, localityRes] = await Promise.all([
    supabase.auth.getUser(),
    localitySlug && localitySlug !== 'hyderabad'
      ? supabase.from('localities').select('id').eq('slug', localitySlug).single()
      : Promise.resolve({ data: null })
  ]);
  const user = userRes.data?.user;
  const locality = localityRes.data;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  if (filter === 'hot' || filter === 'trending' || category === 'trending') {
    let localityId = null;
    if (locality) {
      localityId = locality.id;
    }
    const { data: rawTrending, error: trendErr } = await supabase
      .rpc('get_trending_posts_decayed', {
        p_locality_id: localityId,
        p_limit: limit,
        p_offset: from
      });
      
    if (!trendErr && rawTrending && rawTrending.length > 0) {
      const postIds = rawTrending.map(p => p.id);
      const [pollOptionsRes, eventsRes, reactionsRes, pollVotesRes, userReactionsRes] = await Promise.all([
        supabase.from('poll_options').select('*').in('post_id', postIds),
        supabase.from('events').select('*').in('post_id', postIds),
        supabase.from('reactions').select('post_id, emoji').in('post_id', postIds),
        user ? supabase.from('poll_votes').select('post_id, poll_option_id').eq('user_id', user.id).in('post_id', postIds) : Promise.resolve({ data: [] }),
        user ? supabase.from('reactions').select('post_id, emoji').eq('user_id', user.id).in('post_id', postIds) : Promise.resolve({ data: [] })
      ]);
      
      const pollOptionsMap = {};
      (pollOptionsRes.data || []).forEach(opt => {
        if (!pollOptionsMap[opt.post_id]) pollOptionsMap[opt.post_id] = [];
        pollOptionsMap[opt.post_id].push(opt);
      });
      
      const eventsMap = {};
      (eventsRes.data || []).forEach(ev => { eventsMap[ev.post_id] = ev; });
      
      const reactionsMap = {};
      (reactionsRes.data || []).forEach(rx => {
        if (!reactionsMap[rx.post_id]) reactionsMap[rx.post_id] = {};
        reactionsMap[rx.post_id][rx.emoji] = (reactionsMap[rx.post_id][rx.emoji] || 0) + 1;
      });
      
      const userVotesMap = {};
      (pollVotesRes.data || []).forEach(v => { userVotesMap[v.post_id] = v.poll_option_id; });
      
      const userReactionsMap = {};
      (userReactionsRes.data || []).forEach(r => {
        if (!userReactionsMap[r.post_id]) userReactionsMap[r.post_id] = [];
        userReactionsMap[r.post_id].push(r.emoji);
      });
      
      const authorIds = rawTrending.map(p => p.user_id);
      const localityIds = rawTrending.map(p => p.locality_id).filter(Boolean);
      
      const [profilesRes, localitiesRes] = await Promise.all([
        supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', authorIds),
        localityIds.length > 0 ? supabase.from('localities').select('id, slug, name, emoji').in('id', localityIds) : Promise.resolve({ data: [] })
      ]);
      
      const profilesMap = {};
      (profilesRes.data || []).forEach(p => { profilesMap[p.id] = p; });
      
      const localitiesMap = {};
      (localitiesRes.data || []).forEach(l => { localitiesMap[l.id] = l; });
      
      return rawTrending.map(post => {
        const pollOpts = pollOptionsMap[post.id] || [];
        pollOpts.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        
        return {
          ...post,
          post_type: post.post_type === 'meme' ? 'image' : post.post_type,
          profiles: profilesMap[post.user_id] || null,
          localities: localitiesMap[post.locality_id] || null,
          poll_options: pollOpts,
          events: eventsMap[post.id] ? [eventsMap[post.id]] : [],
          reactions_summary: reactionsMap[post.id] || {},
          user_voted_option_id: userVotesMap[post.id] || null,
          user_reactions: userReactionsMap[post.id] || []
        };
      });
    }
  }

  if (lat && lng && filter === 'nearby') {
    // 1. Fetch posts from RPC with pagination range
    const { data: rawNearby, error: nearbyErr } = await supabase
      .rpc('get_nearby_posts', {
        user_lat: parseFloat(lat),
        user_lon: parseFloat(lng),
        radius_meters: radiusMeters
      })
      .range(from, to);

    if (nearbyErr || !rawNearby || rawNearby.length === 0) {
      if (nearbyErr) console.error('get_nearby_posts err:', nearbyErr.message);
      return [];
    }

    let filteredNearby = rawNearby || [];
    if (category) {
      if (category === 'event') {
        filteredNearby = filteredNearby.filter(p => p.post_type === 'event');
      } else if (category === 'trending') {
        filteredNearby = filteredNearby.filter(p => p.is_trending === true);
      } else {
        filteredNearby = filteredNearby.filter(p => p.category === category);
      }
    }

    const postIds = filteredNearby.map(p => p.id);
    if (postIds.length === 0) return [];

    // 2. Fetch all relations in parallel
    const [pollOptionsRes, eventsRes, reactionsRes, pollVotesRes, userReactionsRes] = await Promise.all([
      supabase.from('poll_options').select('*').in('post_id', postIds),
      supabase.from('events').select('*').in('post_id', postIds),
      supabase.from('reactions').select('post_id, emoji').in('post_id', postIds),
      user ? supabase.from('poll_votes').select('post_id, poll_option_id').eq('user_id', user.id).in('post_id', postIds) : Promise.resolve({ data: [] }),
      user ? supabase.from('reactions').select('post_id, emoji').eq('user_id', user.id).in('post_id', postIds) : Promise.resolve({ data: [] })
    ]);

    // Index mappings for O(1) lookups
    const pollOptionsMap = {};
    (pollOptionsRes.data || []).forEach(opt => {
      if (!pollOptionsMap[opt.post_id]) pollOptionsMap[opt.post_id] = [];
      pollOptionsMap[opt.post_id].push(opt);
    });

    const eventsMap = {};
    (eventsRes.data || []).forEach(ev => {
      eventsMap[ev.post_id] = ev;
    });

    const reactionsMap = {};
    (reactionsRes.data || []).forEach(rx => {
      if (!reactionsMap[rx.post_id]) reactionsMap[rx.post_id] = {};
      reactionsMap[rx.post_id][rx.emoji] = (reactionsMap[rx.post_id][rx.emoji] || 0) + 1;
    });

    const userVotesMap = {};
    (pollVotesRes.data || []).forEach(v => {
      userVotesMap[v.post_id] = v.poll_option_id;
    });

    const userReactionsMap = {};
    (userReactionsRes.data || []).forEach(r => {
      if (!userReactionsMap[r.post_id]) userReactionsMap[r.post_id] = [];
      userReactionsMap[r.post_id].push(r.emoji);
    });

    // 3. Map to match the expected format
    return filteredNearby.map(post => {
      const pollOpts = pollOptionsMap[post.id] || [];
      pollOpts.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      return {
        ...post,
        post_type: post.post_type === 'meme' ? 'image' : post.post_type,
        profiles: typeof post.profiles === 'string' ? JSON.parse(post.profiles) : post.profiles,
        localities: typeof post.localities === 'string' ? JSON.parse(post.localities) : post.localities,
        poll_options: pollOpts,
        events: eventsMap[post.id] ? [eventsMap[post.id]] : [],
        reactions_summary: reactionsMap[post.id] || {},
        user_voted_option_id: userVotesMap[post.id] || null,
        user_reactions: userReactionsMap[post.id] || []
      };
    });
  } else {
    // Standard feed query: single nested select strategy
    const selectStr = `
      *,
      profiles:user_id (username, display_name, avatar_url),
      localities:locality_id (slug, name, emoji),
      poll_options (id, option_text, vote_count, sort_order),
      events (event_date, location_name, rsvp_count),
      reactions (emoji)
      ${user ? `, user_reactions:reactions(emoji), user_votes:poll_votes(poll_option_id)` : ''}
    `;

    let query = supabase.from('posts').select(selectStr);
    if (locality) {
      query = query.eq('locality_id', locality.id);
    }
    if (category) {
      if (category === 'event') {
        query = query.eq('post_type', 'event');
      } else if (category === 'trending') {
        query = query.eq('is_trending', true);
      } else {
        query = query.eq('category', category);
      }
    }

    if (user) {
      query = query
        .eq('user_reactions.user_id', user.id)
        .eq('user_votes.user_id', user.id);
    }

    switch (filter) {
      case 'hot':       query = query.order('reaction_count', { ascending: false }); break;
      case 'top':       query = query.order('view_count',     { ascending: false }); break;
      case 'discussed': query = query.order('comment_count',  { ascending: false }); break;
      default:          query = query.order('created_at', { ascending: false });
    }

    query = query.range(from, to);

    const { data, error } = await query;
    if (error) {
      console.error('fetchFeeds standard:', error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return data.map(post => {
      const summary = {};
      (post.reactions || []).forEach(r => {
        summary[r.emoji] = (summary[r.emoji] || 0) + 1;
      });

      const userVotedOptionId = post.user_votes?.[0]?.poll_option_id || null;
      const userReactionsArr = (post.user_reactions || []).map(r => r.emoji);

      return {
        ...post,
        post_type: post.post_type === 'meme' ? 'image' : post.post_type,
        reactions_summary: summary,
        user_voted_option_id: userVotedOptionId,
        user_reactions: userReactionsArr
      };
    });
  }
}

// ===== FETCH SINGLE POST =====
export async function fetchPostBySlug(slug) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const selectStr = `
    *,
    profiles:user_id (username, display_name, avatar_url),
    localities:locality_id (slug, name, emoji),
    poll_options (id, option_text, vote_count, sort_order),
    events (event_date, location_name, rsvp_count),
    reactions (emoji)
    ${user ? `, user_reactions:reactions(emoji), user_votes:poll_votes(poll_option_id)` : ''}
  `;

  let query = supabase.from('posts').select(selectStr);
  if (user) {
    query = query
      .eq('user_reactions.user_id', user.id)
      .eq('user_votes.user_id', user.id);
  }

  const { data, error } = await query.eq('slug', slug).single();
  if (error || !data) return null;

  const summary = {};
  (data.reactions || []).forEach(r => { summary[r.emoji] = (summary[r.emoji] || 0) + 1; });

  const userVotedOptionId = data.user_votes?.[0]?.poll_option_id || null;
  const userReactionsArr = (data.user_reactions || []).map(r => r.emoji);

  return {
    ...data,
    post_type: data.post_type === 'meme' ? 'image' : data.post_type,
    reactions_summary: summary,
    user_voted_option_id: userVotedOptionId,
    user_reactions: userReactionsArr
  };
}

// ===== CREATE POST =====
export async function createPost(formData) {
  const tFlow = ts('total-createPost-flow');

  console.log('\n════════════════════════════════════════');
  console.log('[SERVER:posts] ══ createPost START ══');
  console.log('════════════════════════════════════════');

  // ── Step 1: Config check ──────────────────────────────────────────────────
  const tConfig = ts('config-check');
  if (!isSupabaseConfigured()) {
    tConfig.fail('NEXT_PUBLIC_SUPABASE_URL or ANON_KEY missing');
    console.error('[SERVER:posts] ENV VARS PRESENT?', {
      url:  !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      key:  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
    return { error: 'Backend not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' };
  }
  tConfig.end('env vars OK');

  // ── Step 2: Init Supabase client ──────────────────────────────────────────
  const tClient = ts('supabase-client-init');
  let supabase;
  try {
    supabase = await createClient();
    if (!supabase) throw new Error('createClient() returned null');
    tClient.end('client OK');
  } catch (err) {
    tClient.fail(err);
    return { error: `Failed to init Supabase server client: ${err.message}` };
  }

  // ── Step 3: Auth check ────────────────────────────────────────────────────
  const tAuth = ts('auth-getUser');
  let user;
  try {
    const { data, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;
    user = data?.user;
    tAuth.end(`user=${user?.id ?? 'null'} email=${user?.email ?? 'none'}`);
  } catch (err) {
    tAuth.fail(err);
    return { error: `Auth error: ${err.message}` };
  }

  if (!user) {
    console.error('[SERVER:posts] ✘ auth.getUser() returned no user — session missing or expired');
    return { error: 'Not authenticated. Please log in again.' };
  }

  // ── Step 4: Parse form data ───────────────────────────────────────────────
  const tParse = ts('parse-formdata');
  const title        = formData.get('title')?.trim();
  const content      = formData.get('content') || '';
  const post_type    = formData.get('post_type') || 'discussion';
  const localitySlug = formData.get('locality');
  const tagsStr      = formData.get('tags') || '';
  const image_url    = formData.get('image_url') || null;
  const poll_options_raw = formData.get('poll_options');
  const location_lat = formData.get('location_lat');
  const location_lng = formData.get('location_lng');
  const event_date   = formData.get('event_date');
  const location_name = formData.get('location_name');
  const category     = formData.get('category')?.trim() || 'discussion';

  console.log('[SERVER:posts] FormData received:', {
    title,
    post_type,
    localitySlug: localitySlug || 'none',
    tags: tagsStr || 'none',
    has_image_url: !!image_url,
    has_poll_options: !!poll_options_raw,
    has_event_date: !!event_date,
    content_length: content.length,
  });

  if (!title) {
    tParse.fail('title is empty');
    return { error: 'Title is required.' };
  }

  const validTypes = ['discussion', 'image', 'poll', 'event'];
  if (!validTypes.includes(post_type)) {
    tParse.fail(`invalid post_type: ${post_type}`);
    return { error: `Invalid post type "${post_type}". Must be discussion, image, poll, or event.` };
  }
  tParse.end(`title="${title}" type=${post_type}`);

  // ── Step 5: Resolve locality ──────────────────────────────────────────────
  let locality_id = null;
  if (localitySlug) {
    const tLocality = ts('resolve-locality');
    try {
      const { data: loc, error: locErr } = await supabase
        .from('localities')
        .select('id')
        .eq('slug', localitySlug)
        .single();
      if (locErr) throw locErr;
      if (loc) {
        locality_id = loc.id;
        tLocality.end(`slug=${localitySlug} → id=${locality_id}`);
      } else {
        tLocality.fail(`no row found for slug="${localitySlug}"`);
      }
    } catch (err) {
      console.warn(`[SERVER:posts] Could not resolve locality "${localitySlug}":`, err.message);
    }
  }

  // ── Step 6: Build insert payload ─────────────────────────────────────────
  const tags = tagsStr
    ? tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    : [];

  let location = null;
  if (location_lat && location_lng) {
    location = `POINT(${location_lng} ${location_lat})`; // PostGIS WKT format (Longitude Latitude)
  }

  const dbPostType = post_type === 'image' ? 'meme' : post_type;

  const allowedCategories = ['discussion', 'question', 'recommendation', 'news', 'confession', 'opinion', 'battle', 'meme'];
  const finalCategory = allowedCategories.includes(category) ? category : 'discussion';
  const is_indexable = checkIsIndexable(title, content);

  const postPayload = {
    user_id:     user.id,
    title,
    content,
    post_type:   dbPostType,
    image_url,
    locality_id,
    location,
    tags,
    category:    finalCategory,
    is_indexable,
  };

  console.log('[SERVER:posts] INSERT payload:', JSON.stringify(postPayload, null, 2));

  // ── Step 7: DB insert ─────────────────────────────────────────────────────
  const tInsert = ts('db-insert-posts');
  const { data: newPost, error: insertErr } = await supabase
    .from('posts')
    .insert(postPayload)
    .select()
    .single();

  if (insertErr) {
    tInsert.fail(insertErr);
    console.error('[SERVER:posts] INSERT error details:', JSON.stringify(insertErr, null, 2));
    console.error('[SERVER:posts] Error code:', insertErr.code);
    console.error('[SERVER:posts] Error hint:', insertErr.hint);
    console.error('[SERVER:posts] Error details:', insertErr.details);

    if (insertErr.message?.includes('tags')) {
      return { error: `Schema error on "tags" column. Run: NOTIFY pgrst, 'reload schema'; in Supabase SQL editor. Raw: ${insertErr.message}` };
    }
    if (insertErr.code === '42501') {
      return { error: `RLS policy blocked insert. Check: public.posts INSERT policy for authenticated users. Raw: ${insertErr.message}` };
    }
    if (insertErr.code === '23502') {
      return { error: `Missing required column. Check NOT NULL constraints. Raw: ${insertErr.message}` };
    }
    return { error: `Database error (${insertErr.code}): ${insertErr.message}` };
  }
  tInsert.end(`id=${newPost.id} slug=${newPost.slug}`);
  console.log('[SERVER:posts] ✅ Post created:', { id: newPost.id, slug: newPost.slug, post_type });

  // ── Step 8: Poll options insert ───────────────────────────────────────────
  if (post_type === 'poll' && poll_options_raw) {
    const tPoll = ts('db-insert-poll_options');
    try {
      const options = JSON.parse(poll_options_raw);
      const inserts = options
        .filter(o => o?.trim())
        .map((o, i) => ({ post_id: newPost.id, option_text: o.trim(), sort_order: i }));

      console.log(`[SERVER:posts] Inserting ${inserts.length} poll options:`, inserts);

      if (inserts.length >= 2) {
        const { error: pollErr } = await supabase.from('poll_options').insert(inserts);
        if (pollErr) {
          tPoll.fail(pollErr);
          console.error('[SERVER:posts] poll_options insert error:', JSON.stringify(pollErr));
          // Don't fail the whole request — post was created
        } else {
          tPoll.end(`${inserts.length} options inserted`);
        }
      }
    } catch (parseErr) {
      console.error('[SERVER:posts] Failed to parse poll_options JSON:', parseErr.message);
    }
  }

  // ── Step 8.5: Event insert ───────────────────────────────────────────────
  if (post_type === 'event' && event_date) {
    const tEvent = ts('db-insert-event');
    const { error: eventErr } = await supabase.from('events').insert({
      post_id: newPost.id,
      event_date,
      location_name
    });
    if (eventErr) {
      tEvent.fail(eventErr);
      console.error('[SERVER:posts] event insert error:', eventErr);
    } else {
      tEvent.end('Event details inserted');
    }
  }

  // ── Step 9: Revalidate & return ───────────────────────────────────────────
  const tRevalidate = ts('revalidatePath');
  revalidatePath('/');
  revalidatePath(`/post/${newPost.slug}`);
  tRevalidate.end('/ and /post/[slug]');

  // Parse mentions inside posts
  try {
    const { parseMentionsAndNotify } = await import('@/app/actions/pushActions');
    await parseMentionsAndNotify({
      content,
      referenceId: newPost.id,
      actorId: user.id,
      isPost: true
    });
  } catch (mErr) {
    console.error('[SERVER:posts] Mentions parsing error:', mErr.message);
  }

  const totalMs = tFlow.end(`slug=${newPost.slug}`);
  console.log(`[SERVER:posts] ══ createPost END — total ${totalMs}ms ══\n`);

  return { success: true, slug: newPost.slug };
}

// ===== FETCH COMMENTS =====
export async function fetchComments(postId) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles:user_id (username, display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data || [];
}

// ===== SUGGESTIONS =====
export async function getSearchSuggestions(query) {
  if (!isSupabaseConfigured() || !query || query.trim().length < 2) {
    return { users: [], localities: [], businesses: [], tags: [] };
  }
  
  const supabase = await createClient();
  const cleanQuery = query.trim();
  const searchPattern = `%${cleanQuery}%`;
  const lowerTag = cleanQuery.toLowerCase();

  const [usersRes, localitiesRes, businessesRes, postsTagsRes] = await Promise.all([
    supabase.from('profiles').select('username, display_name, avatar_url').or(`username.ilike.${searchPattern},display_name.ilike.${searchPattern}`).limit(5),
    supabase.from('localities').select('name, slug, emoji').or(`name.ilike.${searchPattern},slug.ilike.${searchPattern}`).limit(5),
    supabase.from('businesses').select('name, slug, category').or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`).limit(5),
    supabase.from('posts').select('tags').or(`tags.cs.{"${lowerTag}"}`).limit(20)
  ]);

  const matchedTags = new Set();
  (postsTagsRes.data || []).forEach(p => {
    (p.tags || []).forEach(t => {
      if (t.toLowerCase().includes(lowerTag)) {
        matchedTags.add(t);
      }
    });
  });

  return {
    users: usersRes.data || [],
    localities: localitiesRes.data || [],
    businesses: businessesRes.data || [],
    tags: Array.from(matchedTags).slice(0, 5)
  };
}

// ===== SEARCH =====
export async function searchPosts(query) {
  if (!isSupabaseConfigured()) return { posts: [], users: [], localities: [], businesses: [], tags: [] };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let cleanQuery = (query || '').trim();
  if (cleanQuery.startsWith('#')) {
    cleanQuery = cleanQuery.substring(1);
  }
  const searchPattern = `%${cleanQuery}%`;
  const lowerTag = cleanQuery.toLowerCase();

  const selectStr = `
    *,
    profiles:user_id (username, display_name, avatar_url),
    localities:locality_id (slug, name, emoji),
    poll_options (id, option_text, vote_count, sort_order),
    events (event_date, location_name, rsvp_count),
    reactions (emoji)
    ${user ? `, user_reactions:reactions(emoji), user_votes:poll_votes(poll_option_id)` : ''}
  `;

  let postsQuery = supabase
    .from('posts')
    .select(selectStr)
    .or(`title.ilike.${searchPattern},content.ilike.${searchPattern},category.ilike.${searchPattern},tags.cs.{"${lowerTag}"}`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (user) {
    postsQuery = postsQuery
      .eq('user_reactions.user_id', user.id)
      .eq('user_votes.user_id', user.id);
  }

  const [postsRes, usersRes, localitiesRes, businessesRes, postsTagsRes] = await Promise.all([
    postsQuery,
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio')
      .or(`username.ilike.${searchPattern},display_name.ilike.${searchPattern}`)
      .limit(10),
    supabase
      .from('localities')
      .select('*')
      .or(`name.ilike.${searchPattern},slug.ilike.${searchPattern}`)
      .limit(10),
    supabase
      .from('businesses')
      .select('*, localities:locality_id (name, slug, emoji)')
      .or(`name.ilike.${searchPattern},description.ilike.${searchPattern},category.ilike.${searchPattern},tags.cs.{"${lowerTag}"}`)
      .limit(10),
    supabase
      .from('posts')
      .select('tags')
      .or(`tags.cs.{"${lowerTag}"}`)
      .limit(50)
  ]);

  const rawPosts = postsRes.data || [];
  const mappedPosts = rawPosts.map(post => {
    const summary = {};
    (post.reactions || []).forEach(r => { summary[r.emoji] = (summary[r.emoji] || 0) + 1; });
    const userVotedOptionId = post.user_votes?.[0]?.poll_option_id || null;
    const userReactionsArr = (post.user_reactions || []).map(r => r.emoji);
    return {
      ...post,
      post_type: post.post_type === 'meme' ? 'image' : post.post_type,
      reactions_summary: summary,
      user_voted_option_id: userVotedOptionId,
      user_reactions: userReactionsArr
    };
  });

  const matchedTagsMap = {};
  (postsTagsRes.data || []).forEach(p => {
    (p.tags || []).forEach(t => {
      if (t.toLowerCase().includes(lowerTag)) {
        matchedTagsMap[t] = (matchedTagsMap[t] || 0) + 1;
      }
    });
  });
  const sortedTags = Object.entries(matchedTagsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  return {
    posts: mappedPosts,
    users: usersRes.data || [],
    localities: localitiesRes.data || [],
    businesses: businessesRes.data || [],
    tags: sortedTags
  };
}

// ===== TRENDING =====
export const fetchTrendingTags = unstable_cache(
  async () => {
    if (!isSupabaseConfigured()) return [];
    const supabase = await createClient(false);
    const { data, error } = await supabase
      .from('posts')
      .select('tags, reaction_count, comment_count, view_count')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !data) return [];

    const tagCounts = {};
    data.forEach(post => {
      const w = 1 + (post.reaction_count || 0) + (post.comment_count || 0) * 2 + (post.view_count || 0) * 0.1;
      (post.tags || []).forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + w; });
    });

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count], i) => ({ tag, count: Math.round(count), trend: i < 3 ? 'up' : 'stable', label: 'Trending' }));
  },
  ['trending-tags'],
  { revalidate: 120, tags: ['trending-tags'] }
);

export const fetchActiveLocalities = unstable_cache(
  async () => {
    if (!isSupabaseConfigured()) return [];
    const supabase = await createClient(false);
    const { data, error } = await supabase
      .from('posts')
      .select('locality_id, reaction_count, comment_count, localities:locality_id (name, slug, emoji)')
      .not('locality_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) return [];

    const locCounts = {};
    const locMap = {};
    data.forEach(post => {
      if (!post.localities) return;
      const locId = post.locality_id;
      const w = 1 + (post.reaction_count || 0) + (post.comment_count || 0) * 2;
      locCounts[locId] = (locCounts[locId] || 0) + w;
      if (!locMap[locId]) locMap[locId] = Array.isArray(post.localities) ? post.localities[0] : post.localities;
    });

    return Object.entries(locCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([locId, count]) => locMap[locId]);
  },
  ['active-localities'],
  { revalidate: 300, tags: ['active-localities'] }
);

export const fetchActivePolls = unstable_cache(
  async () => {
    if (!isSupabaseConfigured()) return [];
    const supabase = await createClient(false);
    const { data, error } = await supabase
      .from('posts')
      .select('title, slug, reaction_count, comment_count, poll_options (vote_count)')
      .eq('post_type', 'poll')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error || !data) return [];

    return data.map(poll => ({
      question: poll.title,
      slug:     poll.slug,
      votes:    (poll.poll_options || []).reduce((s, o) => s + (o.vote_count || 0), 0),
    })).sort((a, b) => b.votes - a.votes).slice(0, 3);
  },
  ['active-polls'],
  { revalidate: 180, tags: ['active-polls'] }
);

export const fetchHotDiscussions = unstable_cache(
  async () => {
    if (!isSupabaseConfigured()) return [];
    const supabase = await createClient(false);
    const { data, error } = await supabase
      .from('posts')
      .select('title, slug, comment_count')
      .eq('post_type', 'discussion')
      .order('comment_count', { ascending: false })
      .limit(4);
    if (error || !data) return [];
    return data.map(d => ({ title: d.title, slug: d.slug, comments: d.comment_count }));
  },
  ['hot-discussions'],
  { revalidate: 180, tags: ['hot-discussions'] }
);

// ===== DELETE POST =====
export async function deletePost(postId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    // 1. Fetch post to verify ownership and check for image
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('post_type, image_url, user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) return { error: 'Post not found' };
    if (post.user_id !== user.id) return { error: 'Unauthorized to delete this post' };

    // 2. Cleanup Storage if image post
    if ((post.post_type === 'image' || post.post_type === 'meme') && post.image_url) {
      try {
        const bucket = post.image_url.includes('/tapri-images/') ? 'tapri-images' : 'RAMBHAHOO';
        const urlParts = post.image_url.split(`/${bucket}/`);
        if (urlParts.length === 2) {
          await supabase.storage.from(bucket).remove([urlParts[1]]);
        }
      } catch (e) { console.error('Storage cleanup failed', e); }
    }

    // 3. Manually cascade delete to prevent foreign key constraint errors
    
    // Delete reactions (likes) and saved posts
    await supabase.from('reactions').delete().eq('post_id', postId);
    await supabase.from('saved_posts').delete().eq('post_id', postId);
    await supabase.from('reports').delete().eq('post_id', postId);
    await supabase.from('notifications').delete().eq('reference_id', postId);
    
    // Delete poll options & votes
    await supabase.from('poll_votes').delete().eq('post_id', postId);
    await supabase.from('poll_options').delete().eq('post_id', postId);
    
    // Delete events & rsvps
    await supabase.from('event_rsvps').delete().eq('post_id', postId);
    await supabase.from('events').delete().eq('post_id', postId);

    // Delete comments (and their reactions)
    const { data: comments } = await supabase.from('comments').select('id').eq('post_id', postId);
    if (comments && comments.length > 0) {
      const commentIds = comments.map(c => c.id);
      await supabase.from('reactions').delete().in('comment_id', commentIds);
      await supabase.from('comments').delete().eq('post_id', postId);
    }

    // 4. Finally, delete the post itself
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);
    
    if (deleteError) return { error: deleteError.message };
    
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('Delete post error:', err);
    return { error: 'Failed to delete post cleanly' };
  }
}

// ===== BUSINESS QUERY ACTIONS =====
export async function fetchBusinessBySlug(slug) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('businesses')
    .select('*, localities:locality_id (name, slug, emoji)')
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return data;
}

export async function fetchBusinessRelatedPosts(businessName, tags) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  
  const tagList = (tags || []).map(t => `"${t.toLowerCase()}"`).join(',');
  
  let query = supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (username, display_name, avatar_url),
      localities:locality_id (slug, name, emoji),
      poll_options (id, option_text, vote_count, sort_order),
      events (event_date, location_name, rsvp_count),
      reactions (emoji)
    `)
    .order('created_at', { ascending: false })
    .limit(10);
     
  if (tags && tags.length > 0) {
    query = query.or(`tags.cs.{${tagList}},title.ilike.%${businessName}%,content.ilike.%${businessName}%`);
  } else {
    query = query.or(`title.ilike.%${businessName}%,content.ilike.%${businessName}%`);
  }
  
  const { data, error } = await query;
  if (error || !data) return [];
  
  return data.map(post => {
    const summary = {};
    (post.reactions || []).forEach(r => { summary[r.emoji] = (summary[r.emoji] || 0) + 1; });
    return {
      ...post,
      post_type: post.post_type === 'meme' ? 'image' : post.post_type,
      reactions_summary: summary,
      user_reactions: [],
      user_voted_option_id: null
    };
  });
}
