import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host');
  
  // Force canonical domain: www.rambhahoo.com
  if (host && host === 'rambhahoo.com') {
    url.hostname = 'www.rambhahoo.com';
    url.protocol = 'https:'; // Force HTTPS in production
    return NextResponse.redirect(url, 301);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
