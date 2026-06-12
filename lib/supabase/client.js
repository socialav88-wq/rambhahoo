import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () =>
  Boolean(SUPABASE_URL && SUPABASE_KEY);

let supabaseClient = null;

export function createClient() {
  if (!isSupabaseConfigured()) {
    // Return a no-op mock when env vars are missing
    const noop = () => Promise.resolve({ data: null, error: null });
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: noop,
        signUp: noop,
        signOut: noop,
        signInWithOAuth: () => Promise.resolve({ data: { url: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        exchangeCodeForSession: noop,
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: noop,
            maybeSingle: noop,
          }),
          in: () => Promise.resolve({ data: [], error: null }),
        }),
        insert: () => ({ select: () => ({ single: noop }) }),
        delete: () => ({ eq: () => noop() }),
        update: () => ({ eq: () => noop() }),
      }),
      storage: {
        from: () => ({
          upload: noop,
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
    };
  }

  if (supabaseClient) return supabaseClient;

  supabaseClient = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return supabaseClient;
}
