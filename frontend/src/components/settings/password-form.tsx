'use client';

import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { changePasswordAction } from '@/features/profile/actions';

export function PasswordForm() {
  const [pending, start] = useTransition();
  return (
    <form
      className="grid max-w-sm gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formEl = e.currentTarget;
        const f = new FormData(formEl);
        const password = String(f.get('password') ?? '');
        if (password !== f.get('confirm')) return void toast.error('Passwords don’t match');
        start(async () => {
          const r = await changePasswordAction(password);
          if (r.ok) {
            formEl.reset();
            toast.success('Password changed');
          } else toast.error(r.fieldErrors?.password?.[0] ?? r.error);
        });
      }}
    >
      <Field id="new-pw" label="New password" hint="At least 8 characters">
        {(p) => (
          <Input {...p} name="password" type="password" autoComplete="new-password" minLength={8} required />
        )}
      </Field>
      <Field id="confirm-pw" label="Confirm new password">
        {(p) => (
          <Input {...p} name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        )}
      </Field>
      <div>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />} Change password
        </Button>
      </div>
    </form>
  );
}
