'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleCircle(targetUserId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: 'Not authenticated' };
  if (user.id === targetUserId) return { error: 'Cannot add yourself to circle' };

  // Check if currently following
  const { data: existing } = await supabase
    .from('followers')
    .select('*')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .single();

  if (existing) {
    // Remove from circle
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);
      
    if (error) return { error: error.message };
    revalidatePath('/profile');
    return { success: true, action: 'removed' };
  } else {
    // Add to circle
    const { error } = await supabase
      .from('followers')
      .insert({
        follower_id: user.id,
        following_id: targetUserId
      });
      
    if (error) return { error: error.message };
    revalidatePath('/profile');
    return { success: true, action: 'added' };
  }
}

export async function checkInCircle(targetUserId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('followers')
    .select('created_at')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .single();

  return !!data;
}
