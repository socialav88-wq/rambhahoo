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

  const projectId = SUPABASE_URL.split('.')[0].replace('https://', '');
  const cookieName = `sb-${projectId}-auth-token`;

  const customCookies = {
    getAll() {
      // 1. Read actual cookies
      const parsed = {};
      if (typeof document !== 'undefined') {
        document.cookie.split(';').forEach(cookie => {
          const parts = cookie.split('=');
          const name = parts[0].trim();
          if (!name) return;
          const val = parts.slice(1).join('=');
          parsed[name] = val;
        });
      }

      // Check if we have the session cookies
      const cookieKeys = Object.keys(parsed);
      const hasSessionCookies = cookieKeys.some(key => key.startsWith(cookieName));

      if (hasSessionCookies) {
        return cookieKeys.map(name => ({ name, value: parsed[name] }));
      }

      // 2. Fall back to localStorage if cookies are empty
      if (typeof window !== 'undefined') {
        const storedSession = window.localStorage.getItem(cookieName);
        if (storedSession) {
          console.log('[AUTH-PERSISTENCE] Restoring session from localStorage to cookies...');
          // Chunk the stored session
          const chunks = [];
          let remaining = storedSession;
          let index = 0;
          while (remaining.length > 0) {
            chunks.push({
              name: `${cookieName}.${index}`,
              value: remaining.substring(0, 3000), // safe chunk size
            });
            remaining = remaining.substring(3000);
            index += 1;
          }

          // Write back to cookies immediately so Next.js requests send it
          chunks.forEach(chunk => {
            const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
            document.cookie = `${chunk.name}=${chunk.value}; path=/; expires=${expires}; SameSite=Lax; Secure`;
          });

          // Return these chunks as if they were in document.cookie
          return chunks;
        }
      }

      return cookieKeys.map(name => ({ name, value: parsed[name] }));
    },

    setAll(cookiesToSet) {
      if (typeof document === 'undefined') return;

      // 1. Set the cookies in document.cookie
      cookiesToSet.forEach(({ name, value, options }) => {
        let cookieStr = `${name}=${value}`;
        if (options) {
          if (options.path) cookieStr += `; path=${options.path}`;
          if (options.domain) cookieStr += `; domain=${options.domain}`;
          if (options.maxAge) {
            cookieStr += `; max-age=${options.maxAge}`;
          } else if (options.expires) {
            cookieStr += `; expires=${options.expires.toUTCString()}`;
          }
          if (options.secure) cookieStr += '; Secure';
          if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
        }
        document.cookie = cookieStr;
      });

      // 2. Synchronize to localStorage
      const parsed = {};
      document.cookie.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        const name = parts[0].trim();
        if (!name) return;
        const val = parts.slice(1).join('=');
        parsed[name] = val;
      });

      // Combine chunks
      let combined = '';
      let index = 0;
      while (true) {
        const chunkVal = parsed[`${cookieName}.${index}`];
        if (!chunkVal) break;
        combined += chunkVal;
        index += 1;
      }

      if (combined) {
        window.localStorage.setItem(cookieName, combined);
        console.log('[AUTH-PERSISTENCE] Saved session chunks to localStorage.');
      } else {
        // Check if cookies are explicitly deleted
        const isDelete = cookiesToSet.some(c => c.name.startsWith(cookieName) && (!c.value || c.options?.maxAge === 0));
        if (isDelete) {
          window.localStorage.removeItem(cookieName);
          console.log('[AUTH-PERSISTENCE] Cleared session from localStorage.');
        }
      }
    }
  };

  supabaseClient = createBrowserClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: customCookies
  });
  return supabaseClient;
}
