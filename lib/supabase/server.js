import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () =>
  Boolean(SUPABASE_URL && SUPABASE_KEY);

export async function createClient() {
  // Return a no-op mock client when env vars are not configured (build time, preview etc.)
  if (!isSupabaseConfigured()) {
    const noop = () => Promise.resolve({ data: null, error: null });
    const noopChain = new Proxy({}, {
      get: (_, prop) => {
        if (prop === 'then') return undefined; // not a promise
        return () => noopChain;
      }
    });
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: noop,
        signUp: noop,
        signOut: noop,
        signInWithOAuth: () => Promise.resolve({ data: { url: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: noop,
            limit: () => ({ data: [], error: null }),
          }),
          in: () => ({ data: [], error: null }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
          ilike: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
          or: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
        insert: () => ({
          select: () => ({ single: noop }),
        }),
        update: () => ({ eq: () => noop() }),
        delete: () => ({ eq: () => noop() }),
        upsert: noop,
      }),
      storage: {
        from: () => ({
          upload: noop,
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
    };
  }

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { ...options, maxAge: 60 * 60 * 24 * 365 })
          );
        } catch {
          // Called from a Server Component - safe to ignore
        }
      },
    },
  });
}
