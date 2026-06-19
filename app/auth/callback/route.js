import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  console.log('[AUTH-CALLBACK] Callback route loaded. Full URL:', request.url);

  // Check if GoTrue returned an error directly in query parameters
  const errorMsg = searchParams.get('error_description') || searchParams.get('error');
  if (errorMsg) {
    console.error('[AUTH-CALLBACK-ERROR] Google/GoTrue returned an auth error in query parameters:', errorMsg);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  if (code) {
    console.log('[AUTH-CALLBACK] Found auth code. Exchanging for a session...');
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      console.log('[AUTH-CALLBACK-SUCCESS] Code exchanged successfully. User session created. Redirecting to:', next);
      if (data?.user) {
        console.log('[AUTH-CALLBACK-USER] Authenticated User ID:', data.user.id);
        console.log('[AUTH-CALLBACK-SESSION] Session details:', {
          has_access_token: !!data.session?.access_token,
          has_refresh_token: !!data.session?.refresh_token,
          expires_in: data.session?.expires_in,
          user_email: data.user.email,
        });

        // Verify active session via getSession
        const { data: { session: verifiedSession } } = await supabase.auth.getSession();
        console.log('[AUTH-CALLBACK-VERIFICATION] supabase.auth.getSession() status:', {
          is_active: !!verifiedSession,
          user_id: verifiedSession?.user?.id || null,
        });
      }
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('[AUTH-CALLBACK-ERROR] Code exchange failed:', error.message);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  console.warn('[AUTH-CALLBACK-WARNING] Callback triggered without auth code or error queries.');
  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
