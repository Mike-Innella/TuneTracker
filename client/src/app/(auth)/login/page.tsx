import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/auth-forms';

export const metadata: Metadata = { title: 'Log in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { next, error } = await searchParams;
  return (
    <LoginForm
      next={next}
      notice={error === 'link' ? 'That link is invalid or has expired. Try again.' : undefined}
    />
  );
}
