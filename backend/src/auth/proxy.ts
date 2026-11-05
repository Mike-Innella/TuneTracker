import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@tunetracker/shared';
import { env } from '../lib/env';
import { requestOrigin } from '../lib/origin';

const PROTECTED = [
  '/moderation',
  '/dashboard',
  '/projects',
  '/profile',
  '/settings',
  '/studio',
  '/showcase',
  '/community',
];

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
    const url = new URL('/login', requestOrigin(request.headers, request.nextUrl.origin));
    url.searchParams.set('next', path);
    return withCookies(NextResponse.redirect(url), response);
  }
  // signed-in visitors skip the landing page and the auth forms
  if (user && (path === '/' || path === '/login' || path === '/signup')) {
    return withCookies(
      NextResponse.redirect(new URL('/home', requestOrigin(request.headers, request.nextUrl.origin))),
      response,
    );
  }
  return response;
}

/** Redirects must carry any refreshed session cookies, or the refresh is lost. */
function withCookies(redirect: NextResponse, from: NextResponse) {
  for (const c of from.cookies.getAll()) redirect.cookies.set(c);
  return redirect;
}
