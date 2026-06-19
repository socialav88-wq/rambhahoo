import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function updateSession(request) {
  // If Supabase is not configured, just pass through
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[AUTH-MIDDLEWARE-WARNING] Supabase environment variables missing. Bypassing middleware.');
    return NextResponse.next({ request });
  }

  const requestPath = request.nextUrl.pathname;
  console.log(`[AUTH-MIDDLEWARE] Intercepted request path: ${requestPath}`);

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        console.log('[AUTH-MIDDLEWARE] Setting session cookies on request/response headers');
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('[AUTH-MIDDLEWARE-WARNING] Session verification / refresh getUser returned error:', error.message);
  } else if (user) {
    console.log('[AUTH-MIDDLEWARE] Session verified. Authenticated User ID:', user.id);
  } else {
    console.log('[AUTH-MIDDLEWARE] No authenticated user detected in cookies.');
  }

  // Protect routes that require auth
  const protectedPaths = ['/create', '/settings'];
  const isProtected = protectedPaths.some(path =>
    requestPath.startsWith(path)
  );

  if (isProtected && !user) {
    console.warn(`[AUTH-MIDDLEWARE-PROTECTION] Unauthenticated request to protected path: ${requestPath}. Redirecting to /login`);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', requestPath);
    
    const redirectResponse = NextResponse.redirect(url);
    // Copy cookies from supabaseResponse (which carries the refreshed/updated session cookies)
    supabaseResponse.cookies.getAll().forEach(({ name, value, options }) => {
      redirectResponse.cookies.set(name, value, options);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
