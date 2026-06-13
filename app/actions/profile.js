'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const displayName = formData.get('displayName');
  const bio = formData.get('bio');
  const username = formData.get('username');
  const avatarUrlString = formData.get('avatarUrl');

  let avatarUrl = avatarUrlString || undefined;

  // Update profiles table
  const updates = {
    updated_at: new Date().toISOString(),
  };

  if (displayName !== null) updates.display_name = displayName;
  if (bio !== null) updates.bio = bio;
  if (username !== null && username.trim() !== '') updates.username = username.trim().toLowerCase();
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    console.error('Profile update error:', error);
    if (error.code === '23505') return { error: 'Username is already taken. Please choose another one.' };
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  
  return { success: true };
}

// ===== JOIN LOCALITY =====
export async function joinLocality(localitySlug) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    // Resolve slug to id
    const { data: loc, error: locErr } = await supabase
      .from('localities')
      .select('id')
      .eq('slug', localitySlug)
      .single();

    if (locErr || !loc) return { error: 'Locality not found in database' };

    const localityId = loc.id;

    const { error } = await supabase
      .from('profiles')
      .update({ locality_id: localityId })
      .eq('id', user.id);
    
    if (error) return { error: error.message };
    
    // Optionally increment member_count in localities table if it exists
    try {
      await supabase.rpc('increment_locality_member_count', { loc_id: localityId });
    } catch (e) {}

    revalidatePath('/');
    return { success: true, localityId };
  } catch (err) {
    return { error: 'Failed to join locality' };
  }
}

export async function fetchUserProfile(username) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();
    
  if (error || !data) return null;
  
  // Fetch stats (posts count, comments count, total reactions received)
  const { count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', data.id);
    
  const { count: commentsCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', data.id);
    
  const { data: reactionsData } = await supabase
    .from('posts')
    .select('reaction_count')
    .eq('user_id', data.id);
    
  const totalKarma = (reactionsData || []).reduce((acc, curr) => acc + (curr.reaction_count || 0), 0) + ((postsCount || 0) * 5) + ((commentsCount || 0) * 2);
  
  return {
    ...data,
    posts_count: postsCount || 0,
    comments_count: commentsCount || 0,
    karma: totalKarma
  };
}

export async function fetchUserPosts(userId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles:user_id (username, display_name, avatar_url), localities:locality_id (slug, name, emoji)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) return [];
  return data || [];
}

export async function fetchTopUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url')
    .not('username', 'is', null)
    .order('created_at', { ascending: true })
    .limit(5);
    
  if (error) return [];
  return data || [];
}
