'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

// ===== FETCH FEEDS =====
export async function fetchFeeds(filter = 'new', localitySlug = null, lat = null, lng = null, radiusMeters = 5000) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();

  let query;
  
  if (lat && lng && filter === 'nearby') {
    // Call RPC for PostGIS distance query
    query = supabase.rpc('get_nearby_posts', {
      user_lat: parseFloat(lat),
      user_lon: parseFloat(lng),
      radius_meters: radiusMeters
    });
  } else {
    query = supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url),
        localities:locality_id (slug, name, emoji),
        poll_options (id, option_text, vote_count, sort_order)
      `);

    if (localitySlug && localitySlug !== 'hyderabad') {
      const { data: loc } = await supabase
        .from('localities')
        .select('id')
        .eq('slug', localitySlug)
        .single();
      if (loc) query = query.eq('locality_id', loc.id);
    }
  }

  switch (filter) {
    case 'hot':       query = query.order('reaction_count', { ascending: false }); break;
    case 'top':       query = query.order('view_count',     { ascending: false }); break;
    case 'discussed': query = query.order('comment_count',  { ascending: false }); break;
    case 'nearby':    if (!lat || !lng) query = query.order('created_at', { ascending: false }); break; // fallback
    default:          if (filter !== 'nearby') query = query.order('created_at', { ascending: false });
  }

  // Ensure we don't try to limit/order on an RPC if it already handles it, but PostgREST allows chaining on RPCs that return tables.
  query = query.limit(20);
  const { data, error } = await query;
  if (error) { console.error('fetchFeeds:', error.message); return []; }
  if (!data || data.length === 0) return [];

  const postIds = data.map(p => p.id);
  const { data: reactions } = await supabase
    .from('reactions')
    .select('post_id, emoji')
    .in('post_id', postIds);

  const summaryMap = {};
  (reactions || []).forEach(r => {
    if (!summaryMap[r.post_id]) summaryMap[r.post_id] = {};
    summaryMap[r.post_id][r.emoji] = (summaryMap[r.post_id][r.emoji] || 0) + 1;
  });

  let userVotesMap = {};
  const { data: { user } } = await supabase.auth.getUser();
  if (user && postIds.length > 0) {
    const { data: pollVotes } = await supabase
      .from('poll_votes')
      .select('post_id, poll_option_id')
      .eq('user_id', user.id)
      .in('post_id', postIds);
      
    (pollVotes || []).forEach(v => {
      userVotesMap[v.post_id] = v.poll_option_id;
    });
  }

  return data.map(post => ({ 
    ...post, 
    reactions_summary: summaryMap[post.id] || {},
    user_voted_option_id: userVotesMap[post.id] || null
  }));
}

// ===== FETCH SINGLE POST =====
export async function fetchPostBySlug(slug) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (username, display_name, avatar_url),
      localities:locality_id (slug, name, emoji),
      poll_options (id, option_text, vote_count, sort_order)
    `)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  const { data: reactions } = await supabase
    .from('reactions')
    .select('emoji')
    .eq('post_id', data.id);

  const summary = {};
  (reactions || []).forEach(r => { summary[r.emoji] = (summary[r.emoji] || 0) + 1; });

  let userVotedOptionId = null;
  const { data: { user } } = await supabase.auth.getUser();
  if (user && data.post_type === 'poll') {
    const { data: vote } = await supabase
      .from('poll_votes')
      .select('poll_option_id')
      .eq('user_id', user.id)
      .eq('post_id', data.id)
      .single();
    if (vote) userVotedOptionId = vote.poll_option_id;
  }

  return { ...data, reactions_summary: summary, user_voted_option_id: userVotedOptionId };
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

  console.log('[SERVER:posts] FormData received:', {
    title,
    post_type,
    localitySlug: localitySlug || 'none',
    tags: tagsStr || 'none',
    has_image_url: !!image_url,
    has_poll_options: !!poll_options_raw,
    content_length: content.length,
  });

  if (!title) {
    tParse.fail('title is empty');
    return { error: 'Title is required.' };
  }

  const validTypes = ['discussion', 'image', 'poll'];
  if (!validTypes.includes(post_type)) {
    tParse.fail(`invalid post_type: ${post_type}`);
    return { error: `Invalid post type "${post_type}". Must be discussion, image, or poll.` };
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
    ? tagsStr.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  let location = null;
  if (location_lat && location_lng) {
    location = `POINT(${location_lng} ${location_lat})`; // PostGIS WKT format (Longitude Latitude)
  }

  const postPayload = {
    user_id:     user.id,
    title,
    content,
    post_type,
    image_url,
    locality_id,
    location,
    tags,
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

  // ── Step 9: Revalidate & return ───────────────────────────────────────────
  const tRevalidate = ts('revalidatePath');
  revalidatePath('/');
  revalidatePath(`/post/${newPost.slug}`);
  tRevalidate.end('/ and /post/[slug]');

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

// ===== SEARCH =====
export async function searchPosts(query) {
  if (!isSupabaseConfigured()) return { posts: [], users: [], localities: [] };
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles:user_id (username, display_name, avatar_url), localities:locality_id (slug, name, emoji)')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{"${query}"}`)
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: users } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(10);

  const { data: localities } = await supabase
    .from('localities')
    .select('*')
    .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
    .limit(10);

  return { posts: posts || [], users: users || [], localities: localities || [] };
}

// ===== TRENDING =====
export async function fetchTrendingTags() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
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
}

export async function fetchActivePolls() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
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
}

export async function fetchHotDiscussions() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('title, slug, comment_count')
    .eq('post_type', 'discussion')
    .order('comment_count', { ascending: false })
    .limit(4);
  if (error || !data) return [];
  return data.map(d => ({ title: d.title, slug: d.slug, comments: d.comment_count }));
}

// ===== DELETE POST =====
export async function deletePost(postId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);
    
    if (error) return { error: error.message };
    
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to delete post' };
  }
}
