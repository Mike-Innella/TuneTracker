import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@tunetracker/shared';
import { env } from '../lib/env';

/** Per-request client bound to the caller's auth cookies (acts as the user). */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(env.supabaseInternalUrl(), env.supabaseAnonKey(), {
    cookieOptions: { name: AUTH_COOKIE_NAME },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Components can't set cookies; the proxy refreshes them instead.
        }
      },
    },
  });
}

let admin: ReturnType<typeof createClient> | undefined;
/** Service-role client. Bypasses RLS — only for storage signing and verification. */
export function supabaseAdmin() {
  admin ??= createClient(env.supabaseInternalUrl(), env.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
