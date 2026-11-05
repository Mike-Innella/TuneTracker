import type { Metadata } from 'next';
import { requireProfile } from '@tunetracker/backend';
import { PageHeader } from '@/components/layout/page-header';
import { TrackWizard } from '@/components/tracks/track-wizard';

export const metadata: Metadata = { title: 'Upload' };

export default async function UploadPage() {
  await requireProfile();
  return (
    <>
      <PageHeader title="Upload" className="mx-auto max-w-2xl" />
      <TrackWizard />
    </>
  );
}
