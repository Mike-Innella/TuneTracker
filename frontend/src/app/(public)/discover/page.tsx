import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { GENRES } from '@tunetracker/shared';
import { getCurrentProfile, profiles, tracks } from '@tunetracker/backend';
import { EmptyState, PageHeader, SectionHeading } from '@/components/layout/page-header';
import { TrackGrid } from '@/components/tracks/track-grid';
import { Button } from '@/components/ui/button';
import { TabLinks } from '@/components/ui/tab-links';
import { UserAvatar } from '@/components/ui/user-avatar';

export const metadata: Metadata = {
  title: 'Discover',
  description: 'New tracks and samples from independent artists on TuneTracker.',
};

type Search = { q?: string; type?: string; genre?: string; sort?: string; cursor?: string };
const field =
  'h-10 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring';

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 80) || undefined;
  const kind = sp.type === 'samples' ? 'SAMPLE' : sp.type === 'tracks' ? 'TRACK' : undefined;
  const genre = (GENRES as readonly string[]).includes(sp.genre ?? '')
    ? (sp.genre as (typeof GENRES)[number])
    : undefined;
  const sort = sp.sort === 'trending' ? 'trending' : 'recent';
  const me = await getCurrentProfile();
  const [result, artists] = await Promise.all([
    tracks.listTracks(me?.id ?? null, { q, kind, genre, sort, cursor: sp.cursor || null, limit: 24 }),
    q && !sp.cursor ? profiles.searchArtists(q) : Promise.resolve([]),
  ]);

  // every state is a URL: shareable, back-button friendly, works without JavaScript
  const href = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    const next = { q, type: sp.type, genre, sort: sort === 'recent' ? undefined : sort, ...patch };
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/discover?${s}` : '/discover';
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={q ? `Results for “${q}”` : 'Discover'}
        description={q ? undefined : 'Fresh tracks and reusable samples from artists on TuneTracker.'}
      />

      <form action="/discover" role="search" className="mb-6 flex flex-wrap items-end gap-3" id="search">
        {sp.type && <input type="hidden" name="type" value={sp.type} />}
        <label className="grid min-w-0 flex-1 basis-56 gap-1.5">
          <span className="type-role text-muted-foreground">Search</span>
          <input type="search" name="q" defaultValue={q} placeholder="Title or artist" className={field} />
        </label>
        <label className="grid gap-1.5">
          <span className="type-role text-muted-foreground">Genre</span>
          <select name="genre" defaultValue={genre ?? ''} className={field}>
            <option value="">All genres</option>
            {GENRES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="type-role text-muted-foreground">Sort</span>
          <select name="sort" defaultValue={sort} className={field}>
            <option value="recent">Newest</option>
            <option value="trending">Trending (30 days)</option>
          </select>
        </label>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

      <TabLinks
        label="Type"
        className="mb-8"
        items={[
          { href: href({ type: undefined, cursor: undefined }), label: 'All', active: !sp.type },
          {
            href: href({ type: 'tracks', cursor: undefined }),
            label: 'Tracks',
            active: sp.type === 'tracks',
          },
          {
            href: href({ type: 'samples', cursor: undefined }),
            label: 'Samples',
            active: sp.type === 'samples',
          },
        ]}
      />

      {artists.length > 0 && (
        <section aria-labelledby="artists" className="mb-10">
          <SectionHeading>
            <span id="artists">Artists</span>
          </SectionHeading>
          <ul className="flex flex-wrap gap-3" data-testid="artist-results">
            {artists.map((a) => (
              <li key={a.username}>
                <Link
                  href={`/artists/${a.username}`}
                  className="flex items-center gap-2.5 rounded-full border border-border py-1.5 pr-4 pl-1.5 hover:bg-muted"
                >
                  <UserAvatar name={a.displayName} url={a.avatarUrl} className="size-8" />
                  <span className="text-sm font-medium">{a.displayName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.tracks.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={sp.cursor ? 'That’s everything' : 'Nothing matches yet'}
          action={
            <Button asChild variant="outline">
              <Link href="/discover">Clear filters</Link>
            </Button>
          }
        >
          {sp.cursor ? 'You’ve reached the end of the list.' : 'Try another genre or search term.'}
        </EmptyState>
      ) : (
        <TrackGrid tracks={result.tracks} />
      )}

      {(result.nextCursor || sp.cursor) && (
        <nav aria-label="Pagination" className="mt-10 flex justify-center gap-3">
          {sp.cursor && (
            <Button asChild variant="ghost">
              <Link href={href({ cursor: undefined })}>Back to newest</Link>
            </Button>
          )}
          {result.nextCursor && (
            <Button asChild variant="outline">
              <Link href={href({ cursor: result.nextCursor })} rel="next">
                More
              </Link>
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
