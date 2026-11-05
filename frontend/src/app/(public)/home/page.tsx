import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Music4 } from 'lucide-react';
import { community, getCurrentProfile, tracks } from '@tunetracker/backend';
import { EmptyState, SectionHeading } from '@/components/layout/page-header';
import { PostCard } from '@/components/community/post-card';
import { TrackGrid } from '@/components/tracks/track-grid';
import { TrackList } from '@/components/tracks/track-list';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Home' };

function More({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      {children} <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

/** Music first: what's new, what's being played, who you follow, then the conversation. */
export default async function HomePage() {
  const me = await getCurrentProfile();
  const viewer = me?.id ?? null;
  const [fresh, trending, following, samples, feed] = await Promise.all([
    tracks.listTracks(viewer, { kind: 'TRACK', limit: 8 }),
    tracks.listTracks(viewer, { sort: 'trending', limit: 6 }),
    me ? tracks.listTracks(viewer, { limit: 8 }, { followedBy: me.id }) : null,
    tracks.listTracks(viewer, { kind: 'SAMPLE', limit: 4 }),
    me ? community.getFeed(viewer, { limit: 3 }) : null,
  ]);
  const empty = fresh.tracks.length === 0 && samples.tracks.length === 0;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12">
      <header className="relative">
        <div className="neon-bloom -top-24 -left-16 size-80" aria-hidden />
        <h1 className="type-title relative text-4xl sm:text-5xl">
          {me ? `Welcome back, ${me.displayName.split(' ')[0]}` : 'New music, made in the open'}
        </h1>
        <p className="relative mt-3 max-w-xl text-muted-foreground">
          {me
            ? 'Fresh releases, what people are playing, and the artists you follow.'
            : 'Listen free — no account needed. Sign up to follow artists, share your own tracks and work on projects together.'}
        </p>
        {!me && (
          <div className="relative mt-5 flex gap-2">
            <Button asChild>
              <Link href="/signup">Create a free account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/discover">Browse music</Link>
            </Button>
          </div>
        )}
      </header>

      {empty ? (
        <EmptyState
          icon={Music4}
          title="The first tracks are on their way"
          action={
            <Button asChild>
              <Link href={me ? '/studio/upload' : '/signup'}>
                {me ? 'Upload a track' : 'Join and upload'}
              </Link>
            </Button>
          }
        >
          Nothing has been published yet. Be the first.
        </EmptyState>
      ) : (
        <>
          {following && following.tracks.length > 0 && (
            <section aria-labelledby="following">
              <SectionHeading>
                <span id="following">From artists you follow</span>
              </SectionHeading>
              <TrackGrid tracks={following.tracks} />
            </section>
          )}
          <section aria-labelledby="new">
            <SectionHeading action={<More href="/discover?type=tracks">All new tracks</More>}>
              <span id="new">New releases</span>
            </SectionHeading>
            <TrackGrid tracks={fresh.tracks} />
          </section>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <section aria-labelledby="trending">
              <SectionHeading action={<More href="/discover?sort=trending">More trending</More>}>
                <span id="trending">Trending</span>
              </SectionHeading>
              {trending.tracks.length > 0 ? (
                <TrackList tracks={trending.tracks} showArtist />
              ) : (
                <p className="text-sm text-muted-foreground">Nothing has been played in the last 30 days.</p>
              )}
            </section>
            <section aria-labelledby="samples">
              <SectionHeading action={<More href="/discover?type=samples">All samples</More>}>
                <span id="samples">Fresh samples</span>
              </SectionHeading>
              {samples.tracks.length > 0 ? (
                <TrackGrid tracks={samples.tracks} className="sm:grid-cols-2 lg:grid-cols-2" />
              ) : (
                <p className="text-sm text-muted-foreground">No samples yet.</p>
              )}
            </section>
          </div>
        </>
      )}

      {feed && feed.posts.length > 0 && (
        <section aria-labelledby="community">
          <SectionHeading action={<More href="/community">Community feed</More>}>
            <span id="community">From the community</span>
          </SectionHeading>
          <div className="grid gap-6 lg:grid-cols-3">
            {feed.posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
