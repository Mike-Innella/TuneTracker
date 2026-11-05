'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  type ActionResult,
} from '@tunetracker/shared';
import { profiles, rateLimit, runAction, supabaseServer, AppError } from '@tunetracker/backend';
import { safeNext } from '@/lib/safe-next';

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

async function clientIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

export async function signUp(_: unknown, form: FormData): Promise<ActionResult<{ email: string }>> {
  return runAction(async () => {
    const data = signUpSchema.parse(Object.fromEntries(form));
    await rateLimit(`signup:${await clientIp()}`, 10, 3600);
    if (!(await profiles.isUsernameAvailable(data.username))) {
      throw new AppError(409, 'That username is taken');
    }
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${siteUrl()}/auth/confirm`,
        data: { username: data.username, display_name: data.displayName },
      },
    });
    if (error) throw new AppError(400, error.message);
    return { email: data.email };
  });
}

export async function signIn(_: unknown, form: FormData): Promise<ActionResult> {
  const result = await runAction(async () => {
    const data = signInSchema.parse(Object.fromEntries(form));
    await rateLimit(`signin:${await clientIp()}`, 30, 600);
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      throw new AppError(
        400,
        error.code === 'email_not_confirmed'
          ? 'Confirm your email first — check your inbox for the link.'
          : error.code === 'user_banned'
            ? 'This account has been suspended by a moderator. Contact support if you think this is a mistake.'
            : 'Email or password is incorrect.',
      );
    }
    return undefined;
  });
  if (result.ok) redirect(safeNext(form.get('next')));
  return result;
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect('/');
}

/** Always reports success so the form cannot be used to discover registered emails. */
export async function forgotPassword(_: unknown, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const { email } = forgotPasswordSchema.parse(Object.fromEntries(form));
    await rateLimit(`reset:${await clientIp()}`, 5, 3600);
    const supabase = await supabaseServer();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/reset-password` });
    return undefined;
  });
}

export async function resetPassword(_: unknown, form: FormData): Promise<ActionResult> {
  const result = await runAction(async () => {
    const { password } = resetPasswordSchema.parse(Object.fromEntries(form));
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new AppError(401, 'Your reset link has expired. Request a new one.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new AppError(400, error.message);
    return undefined;
  });
  if (result.ok) redirect('/studio'); // Studio lists pending project invitations
  return result;
}
