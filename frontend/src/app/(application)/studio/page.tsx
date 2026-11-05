import type { Metadata } from 'next';
import Link from 'next/link';
import { Music4, Upload } from 'lucide-react';
import { requireProfile, tracks } from '@tunetracker/backend';
import { EmptyState, PageHeader } from '@/components/layout/page-header';
import { TrackList } from '@/components/tracks/track-list';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Studio' };

export default async function StudioPage() {
  const me = await requireProfile();
  const mine = await tracks.myTracks(me.id);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Studio"
        description="Your tracks and samples, drafts included."
        actions={
          <Button asChild>
            <Link href="/studio/upload">
              <Upload aria-hidden /> Upload
            </Link>
          </Button>
        }
      />
      {mine.length === 0 ? (
        <EmptyState icon={Music4} title="Nothing uploaded yet">
          Upload a track or a sample: it’s saved as a private draft until you publish it.
        </EmptyState>
      ) : (
        <TrackList tracks={mine} />
      )}
    </div>
  );
}
