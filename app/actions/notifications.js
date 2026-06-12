'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function fetchNotifications() {
  if (!isSupabaseConfigured()) return [];
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:actor_id (username, display_name, avatar_url),
      post:post_id (title, slug)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('fetchNotifications error:', error.message);
    return [];
  }
  return data || [];
}

export async function markAsRead(notificationId) {
  if (!isSupabaseConfigured()) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);
    
  revalidatePath('/notifications');
}
