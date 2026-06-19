'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function login(formData) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };
  
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function signup(formData) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };
  
  const supabase = await createClient();
  const username = formData.get('username');
  const display_name = formData.get('display_name') || username;

  const { error } = await supabase.auth.signUp({
    email: formData.get('email'),
    password: formData.get('password'),
    options: { data: { username, display_name } },
  });
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}



export async function logout() {
  if (!isSupabaseConfigured()) return;
  console.log('[AUTH-LOGOUT] Initiating sign out sequence');
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[AUTH-LOGOUT-ERROR] Sign out failed:', error.message);
  } else {
    console.log('[AUTH-LOGOUT-SUCCESS] User signed out successfully');
  }
  revalidatePath('/');
}

export async function getSession() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[AUTH-GETSESSION-ERROR] Failed to query session:', error.message);
    return null;
  }
  if (session) {
    console.log('[AUTH-GETSESSION] Session successfully queried. User ID:', session.user.id);
  } else {
    console.log('[AUTH-GETSESSION] No active session retrieved.');
  }
  return session;
}

