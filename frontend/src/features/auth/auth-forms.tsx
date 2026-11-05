'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { MailCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { forgotPassword, resetPassword, signIn, signUp } from './actions';

function Heading({ title, sub }: { title: string; sub: React.ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="type-title text-4xl">{title}</h1>
      <p className="mt-3 text-muted-foreground">{sub}</p>
    </header>
  );
}

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(signIn, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <>
      <Heading
        title="Welcome back"
        sub={
          <>
            New here?{' '}
            <Link href="/signup" className="font-medium text-foreground underline">
              Create an account
            </Link>
          </>
        }
      />
      <form action={action} className="grid gap-5" noValidate>
        {notice && <FormMessage>{notice}</FormMessage>}
        {state && !state.ok && <FormMessage>{state.error}</FormMessage>}
        <input type="hidden" name="next" value={next ?? ''} />
        <Field id="email" label="Email" error={fe?.email}>
          {(p) => <Input {...p} name="email" type="email" autoComplete="email" required />}
        </Field>
        <Field id="password" label="Password" error={fe?.password}>
          {(p) => <Input {...p} name="password" type="password" autoComplete="current-password" required />}
        </Field>
        <div className="-mt-2 text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>
        <SubmitButton size="lg" pendingLabel="Signing in…">
          Log in
        </SubmitButton>
      </form>
    </>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(signUp, null);
  if (state?.ok) {
    return (
      <div className="sheet p-6" role="status">
        <MailCheck className="mb-4 size-8 text-electric" aria-hidden />
        <h1 className="type-title text-3xl">Check your inbox</h1>
        <p className="mt-3 text-muted-foreground">
          We sent a confirmation link to{' '}
          <span className="font-medium text-foreground">{state.data.email}</span>. Open it to activate your
          account and land on Home.
        </p>
      </div>
    );
  }
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <>
      <Heading
        title="Start your first project"
        sub={
          <>
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-foreground underline">
              Log in
            </Link>
          </>
        }
      />
      <form action={action} className="grid gap-5" noValidate>
        {state && !state.ok && <FormMessage>{state.error}</FormMessage>}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="displayName" label="Artist name" error={fe?.displayName}>
            {(p) => <Input {...p} name="displayName" autoComplete="nickname" required maxLength={60} />}
          </Field>
          <Field id="username" label="Username" error={fe?.username} hint="Letters, numbers, _">
            {(p) => (
              <Input {...p} name="username" autoComplete="username" required minLength={3} maxLength={30} />
            )}
          </Field>
        </div>
        <Field id="email" label="Email" error={fe?.email}>
          {(p) => <Input {...p} name="email" type="email" autoComplete="email" required />}
        </Field>
        <Field id="password" label="Password" error={fe?.password} hint="At least 8 characters">
          {(p) => (
            <Input
              {...p}
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          )}
        </Field>
        <SubmitButton size="lg" pendingLabel="Creating account…">
          Create account
        </SubmitButton>
        <p className="text-xs text-muted-foreground">
          We&apos;ll email you a link to confirm your address before you can sign in.
        </p>
      </form>
    </>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPassword, null);
  return (
    <>
      <Heading title="Reset your password" sub="Enter your email and we'll send you a reset link." />
      {state?.ok ? (
        <FormMessage tone="success">
          If an account exists for that email, a reset link is on its way.
        </FormMessage>
      ) : (
        <form action={action} className="grid gap-5" noValidate>
          {state && !state.ok && <FormMessage>{state.error}</FormMessage>}
          <Field id="email" label="Email" error={state && !state.ok ? state.fieldErrors?.email : undefined}>
            {(p) => <Input {...p} name="email" type="email" autoComplete="email" required />}
          </Field>
          <SubmitButton size="lg" pendingLabel="Sending…">
            Send reset link
          </SubmitButton>
        </form>
      )}
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-muted-foreground underline hover:text-foreground">
          Back to log in
        </Link>
      </p>
    </>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPassword, null);
  return (
    <>
      <Heading title="Choose a new password" sub="You're signed in from your reset link." />
      <form action={action} className="grid gap-5" noValidate>
        {state && !state.ok && <FormMessage>{state.error}</FormMessage>}
        <Field
          id="password"
          label="New password"
          error={state && !state.ok ? state.fieldErrors?.password : undefined}
        >
          {(p) => (
            <Input
              {...p}
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          )}
        </Field>
        <SubmitButton size="lg" pendingLabel="Saving…">
          Save password
        </SubmitButton>
      </form>
    </>
  );
}
