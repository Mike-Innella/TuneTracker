import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@tunetracker/shared';
import { env } from '../lib/env';

const PROTECTED = ['/dashboard', '/projects', '/profile', '/settings', '/artists', '/showcase', '/community'];

/**
 * Runs in the Next.js proxy: refreshes the Supabase session cookie and bounces
 * anonymous visitors away from app routes. Real authorization still happens in services.
 */
export async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.supabaseInternalUrl(), env.supabaseAnonKey(), {
    cookieOptions: { name: AUTH_COOKIE_NAME },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!user && PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  if (user && (path === '/login' || path === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return response;
}
