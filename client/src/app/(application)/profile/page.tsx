import type { Metadata } from 'next';
import { profiles, requireProfile } from '@tunetracker/server';
import { PageHeader } from '@/components/layout/page-header';
import { ProfileForm } from '@/components/profile/profile-form';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const me = await requireProfile();
  const p = await profiles.getMyProfile(me.id);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Your profile" description="How other artists see you across TuneTracker." />
      <ProfileForm
        profile={{
          displayName: p.displayName,
          username: p.username,
          bio: p.bio,
          location: p.location,
          website: p.website,
          specialties: p.specialties,
          isPublic: p.isPublic,
          avatarUrl: p.avatarUrl,
          socialLinks: p.socialLinks.map((l) => ({ label: l.label, url: l.url })),
        }}
      />
    </div>
  );
}
