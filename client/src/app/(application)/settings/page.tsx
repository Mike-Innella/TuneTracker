import type { Metadata } from 'next';
import { getAuthUser, requireProfile } from '@tunetracker/server';
import { Button } from '@/components/ui/button';
import { PageHeader, SectionHeading } from '@/components/layout/page-header';
import { AppearanceSettings } from '@/components/settings/appearance';
import { PasswordForm } from '@/components/settings/password-form';
import { signOut } from '@/features/auth/actions';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const me = await requireProfile();
  const user = await getAuthUser();
  return (
    <div className="mx-auto grid max-w-3xl gap-12">
      <PageHeader title="Settings" className="mb-0" />
      <section aria-labelledby="appearance">
        <SectionHeading>
          <span id="appearance">Appearance</span>
        </SectionHeading>
        <AppearanceSettings saved={me.theme} />
      </section>
      <section aria-labelledby="account">
        <SectionHeading>
          <span id="account">Account</span>
        </SectionHeading>
        <dl className="mb-6 grid gap-2 text-sm">
          <div className="flex items-baseline gap-3">
            <dt className="type-role text-muted-foreground">Email</dt>
            <span className="credit-leader" aria-hidden />
            <dd>{user?.email}</dd>
          </div>
          <div className="flex items-baseline gap-3">
            <dt className="type-role text-muted-foreground">Username</dt>
            <span className="credit-leader" aria-hidden />
            <dd>@{me.username}</dd>
          </div>
        </dl>
        <PasswordForm />
      </section>
      <section aria-labelledby="session">
        <SectionHeading>
          <span id="session">Session</span>
        </SectionHeading>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Log out of this device
          </Button>
        </form>
      </section>
    </div>
  );
}
