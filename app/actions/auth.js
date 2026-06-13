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

export async function loginWithGoogle() {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };
  
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  return { url: data.url };
}

export async function loginWithGoogleToken(idToken) {
  if (!isSupabaseConfigured()) return { error: 'Backend not configured yet.' };
  
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function logout() {
  if (!isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/');
}

export async function getSession() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
