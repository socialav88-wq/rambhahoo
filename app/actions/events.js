'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleRsvp(postId, status = 'going') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Check if RSVP exists
  const { data: existing } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    if (existing.status === status) {
      // Toggle off (delete)
      const { error } = await supabase
        .from('event_rsvps')
        .delete()
        .eq('id', existing.id);
      if (error) return { error: error.message };
    } else {
      // Update status
      const { error } = await supabase
        .from('event_rsvps')
        .update({ status })
        .eq('id', existing.id);
      if (error) return { error: error.message };
    }
  } else {
    // Insert new
    const { error } = await supabase
      .from('event_rsvps')
      .insert({
        post_id: postId,
        user_id: user.id,
        status
      });
    if (error) return { error: error.message };
    
    // Create notification for event creator
    const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
    if (post && post.user_id !== user.id && status === 'going') {
      await supabase.from('notifications').insert({
        user_id: post.user_id,
        actor_id: user.id,
        type: 'rsvp',
        reference_id: postId
      });
    }
  }

  revalidatePath('/');
  return { success: true };
}

export async function getRsvpStatus(postId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('event_rsvps')
    .select('status')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  return data?.status || null;
}
