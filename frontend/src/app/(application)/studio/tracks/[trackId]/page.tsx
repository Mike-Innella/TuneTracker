import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireProfile, tracks } from '@tunetracker/backend';
import { PageHeader } from '@/components/layout/page-header';
import { TrackWizard } from '@/components/tracks/track-wizard';
import { or404 } from '@/lib/or-404';

export const metadata: Metadata = { title: 'Edit track' };

export default async function EditTrackPage({ params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  const me = await requireProfile();
  const t = await or404(tracks.getTrack(me.id, trackId));
  if (!t.isMine) notFound();
  return (
    <>
      <PageHeader title={`Edit “${t.title}”`} className="mx-auto max-w-2xl" />
      <TrackWizard
        initial={{
          id: t.id,
          kind: t.kind,
          status: t.status,
          visibility: t.visibility,
          title: t.title,
          description: t.description,
          genre: t.genre,
          tags: t.tags,
          credits: t.credits,
          bpm: t.bpm,
          musicalKey: t.musicalKey,
          downloadable: t.downloadable,
          usageRights: t.usageRights,
          audioUrl: t.audioUrl,
          artworkUrl: t.artworkUrl,
          durationSec: t.durationSec,
        }}
      />
    </>
  );
}
