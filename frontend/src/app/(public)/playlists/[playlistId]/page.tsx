import type { Metadata } from 'next';
import Link from 'next/link';
import { ListMusic } from 'lucide-react';
import { getCurrentProfile, playlists } from '@tunetracker/backend';
import { EmptyState } from '@/components/layout/page-header';
import { PlaylistSettings } from '@/components/playlists/playlist-settings';
import { PlaylistView } from '@/components/playlists/playlist-view';
import { ProjectArtwork } from '@/components/dashboard/project-artwork';
import { formatDuration } from '@/lib/format';
import { or404 } from '@/lib/or-404';

type Params = { params: Promise<{ playlistId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { playlistId } = await params;
  const me = await getCurrentProfile();
  const p = await playlists.getPlaylist(me?.id ?? null, playlistId).catch(() => null);
  return p ? { title: `${p.title} — playlist by ${p.owner.displayName}` } : { title: 'Playlist not found' };
}

export default async function PlaylistPage({ params }: Params) {
  const { playlistId } = await params;
  const me = await getCurrentProfile();
  const p = await or404(playlists.getPlaylist(me?.id ?? null, playlistId));
  const total = p.tracks.reduce((s, t) => s + (t.durationSec ?? 0), 0);
  return (
    <div className="mx-auto max-w-4xl">
      <header className="relative mb-8 grid gap-6 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-end">
        <div className="neon-bloom -top-16 -left-16 size-72" aria-hidden />
        <ProjectArtwork
          title={p.title}
          url={p.tracks[0]?.artworkUrl}
          className="relative aspect-square size-auto w-full max-w-48 text-5xl"
        />
        <div className="relative min-w-0">
          <p className="type-role text-muted-foreground">
            {p.visibility === 'PRIVATE' ? 'Private playlist' : 'Playlist'}
          </p>
          <h1 className="type-title mt-1 text-4xl break-words sm:text-5xl">{p.title}</h1>
          {p.description && <p className="mt-3 text-muted-foreground">{p.description}</p>}
          <p className="mt-3 text-sm">
            <Link href={`/artists/${p.owner.username}`} className="font-medium hover:underline">
              {p.owner.displayName}
            </Link>
            <span className="type-figure text-muted-foreground">
              {' '}
              · {p.tracks.length} {p.tracks.length === 1 ? 'track' : 'tracks'} · {formatDuration(total)}
            </span>
          </p>
          {p.isMine && (
            <PlaylistSettings
              id={p.id}
              title={p.title}
              description={p.description}
              visibility={p.visibility}
            />
          )}
        </div>
      </header>
      {p.tracks.length === 0 ? (
        <EmptyState icon={ListMusic} title="No tracks yet">
          {p.isMine ? 'Add tracks from any track page with “Add to playlist”.' : 'Check back soon.'}
        </EmptyState>
      ) : (
        <PlaylistView id={p.id} tracks={p.tracks} isMine={p.isMine} />
      )}
    </div>
  );
}
