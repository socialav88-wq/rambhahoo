'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleReaction(postId, commentId, emoji) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  let query = supabase.from('reactions').select('id, emoji').eq('user_id', user.id).eq('emoji', emoji);
  if (postId)    query = query.eq('post_id', postId);
  if (commentId) query = query.eq('comment_id', commentId);

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id);
    return { success: true, action: 'removed' };
  } else {
    const { error } = await supabase.from('reactions').insert({
      user_id: user.id,
      post_id:    postId    || null,
      comment_id: commentId || null,
      emoji,
    });
    if (error) return { error: error.message };

    // Generate Notification
    if (postId) {
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
      if (post && post.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: 'like',
          reference_id: postId
        });
      }
    }

    return { success: true, action: 'added' };
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
    const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
    if (post && post.user_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: post.user_id,
        actor_id: user.id,
        type: 'comment',
        reference_id: postId
      });
    }
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
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);
    
    if (error) return { error: error.message };
    
    revalidatePath(`/post/${postId}`);
    return { success: true };
  } catch (err) {
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
    return { success: true };
  } catch (err) {
    return { error: 'Failed to report post' };
  }
}
