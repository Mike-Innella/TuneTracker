import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { db, type Profile } from '@tunetracker/data';
import { supabaseServer } from './supabase';
import { AppError } from '../lib/errors';
import { attachEmailInvites } from '../services/collaboration';

/** Verified identity: getUser() round-trips to Supabase Auth, never trusts the cookie alone. */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

/** Creates the application profile the first time a verified user arrives. */
export async function ensureProfile(user: User): Promise<Profile> {
  const email = user.email?.toLowerCase() ?? null;
  const existing = await db().profile.findUnique({ where: { id: user.id } });
  if (existing) {
    if (email && existing.email !== email) {
      // keeps email invites matchable after an address change (or for profiles made before this column)
      const updated = await db().profile.update({ where: { id: user.id }, data: { email } });
      await attachEmailInvites(user.id, email);
      return updated;
    }
    return existing;
  }
  const meta = user.user_metadata ?? {};
  const base =
    String(meta.username ?? user.email?.split('@')[0] ?? 'artist')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 24) || 'artist';
  const taken = await db().profile.findUnique({ where: { username: base } });
  const username = taken ? `${base}_${user.id.slice(0, 5)}` : base;
  const profile = await db().profile.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      username,
      email,
      displayName: String(meta.display_name ?? meta.username ?? username).slice(0, 60),
    },
  });
  if (email) await attachEmailInvites(profile.id, email);
  return profile;
}

/** The signed-in profile, or null. Suspended accounts are treated as signed out everywhere. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getAuthUser();
  if (!user) return null;
  const profile = await ensureProfile(user);
  return profile.suspendedAt ? null : profile;
});

/** For pages: redirect anonymous visitors to login. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    // signed in but suspended: end the session first, or the proxy would bounce /login back here
    redirect((await getAuthUser()) ? '/auth/signout?reason=suspended' : '/login');
  }
  return profile;
}

/** For actions/route handlers: throw a 401 instead of redirecting. */
export async function requireActor(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw (await getAuthUser())
      ? new AppError(403, 'This account is suspended')
      : new AppError(401, 'Please sign in first');
  }
  return profile;
}
