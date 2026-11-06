import type { Metadata } from 'next';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { USAGE_RIGHTS } from '@tunetracker/shared';
import { getCurrentProfile, playlists, tracks } from '@tunetracker/backend';
import { AddToPlaylist } from '@/components/playlists/add-to-playlist';
import { AudioPlayer } from '@/components/audio/audio-player';
import { SectionHeading } from '@/components/layout/page-header';
import { DownloadButton, LikeButton } from '@/components/tracks/track-actions';
import { Button } from '@/components/ui/button';
import { ProjectArtwork } from '@/components/dashboard/project-artwork';
import { UserAvatar } from '@/components/ui/user-avatar';
import { formatDate, formatDuration } from '@/lib/format';
import { or404 } from '@/lib/or-404';

type Params = { params: Promise<{ trackId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { trackId } = await params;
  const me = await getCurrentProfile();
  const t = await tracks.getTrack(me?.id ?? null, trackId).catch(() => null);
  if (!t) return { title: 'Track not found' };
  return {
    title: `${t.title} — ${t.owner.displayName}`,
    description:
      t.description?.slice(0, 160) ?? `Listen to ${t.title} by ${t.owner.displayName} on TuneTracker.`,
    openGraph: { type: 'music.song', images: t.artworkUrl ? [t.artworkUrl] : undefined },
  };
}

export default async function TrackPage({ params }: Params) {
  const { trackId } = await params;
  const me = await getCurrentProfile();
  const t = await or404(tracks.getTrack(me?.id ?? null, trackId));
  const mine = me ? await playlists.myPlaylists(me.id, t.id) : null;
  const details = [
    ['Type', t.kind === 'SAMPLE' ? 'Sample' : 'Track'],
    ['Genre', t.genre],
    ['Length', t.durationSec ? formatDuration(t.durationSec) : null],
    ['Tempo', t.bpm ? `${t.bpm} BPM` : null],
    ['Key', t.musicalKey],
    ['Released', t.publishedAt ? formatDate(t.publishedAt) : null],
    ['Plays', t.playCount.toLocaleString()],
  ].filter((d): d is [string, string] => !!d[1]);

  return (
    <article className="mx-auto max-w-4xl">
      {t.status !== 'PUBLISHED' || t.visibility !== 'PUBLIC' ? (
        <p className="mb-6 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm" role="status">
          {t.status !== 'PUBLISHED'
            ? 'Draft — only you can see this track.'
            : 'Private — only you can see this track.'}
        </p>
      ) : null}
      <header className="relative grid gap-6 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-end">
        <div className="neon-bloom -top-16 -left-16 size-72" aria-hidden />
        <ProjectArtwork
          title={t.title}
          url={t.artworkUrl}
          className="relative aspect-square size-auto w-full max-w-56 text-5xl shadow-(--shadow-sheet)"
        />
        <div className="relative min-w-0">
          <p className="type-role text-muted-foreground">{t.kind === 'SAMPLE' ? 'Sample' : 'Track'}</p>
          <h1 className="type-title mt-1 text-4xl break-words sm:text-5xl">{t.title}</h1>
          <Link
            href={`/artists/${t.owner.username}`}
            className="mt-3 inline-flex items-center gap-2 hover:underline"
          >
            <UserAvatar name={t.owner.displayName} url={t.owner.avatarUrl} className="size-7" />
            <span className="font-medium">{t.owner.displayName}</span>
          </Link>
          <div className="mt-5 flex flex-wrap gap-2">
            <LikeButton trackId={t.id} liked={t.likedByMe} count={t.likeCount} signedIn={!!me} />
            <AddToPlaylist trackId={t.id} trackTitle={t.title} playlists={mine} />
            {t.downloadable && <DownloadButton trackId={t.id} />}
            {t.isMine && (
              <Button asChild variant="ghost">
                <Link href={`/studio/tracks/${t.id}`}>
                  <Pencil aria-hidden /> Edit
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <AudioPlayer
        className="mt-8"
        id={t.id}
        trackId={t.id}
        src={t.audioUrl}
        title={t.title}
        artist={t.owner.displayName}
        artworkUrl={t.artworkUrl}
        durationSec={t.durationSec}
      />

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="notes">
          <SectionHeading>
            <span id="notes">Liner notes</span>
          </SectionHeading>
          {t.description ? (
            <p className="leading-relaxed whitespace-pre-wrap">{t.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No notes for this one.</p>
          )}
          {t.tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
              {t.tags.map((tag) => (
                <li key={tag} className="rounded-full border border-border px-2.5 py-0.5 text-xs">
                  #{tag}
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className="grid content-start gap-8">
          <section aria-labelledby="details">
            <SectionHeading>
              <span id="details">Details</span>
            </SectionHeading>
            <dl className="grid gap-2 text-sm">
              {details.map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-2">
                  <dt className="type-role text-muted-foreground">{k}</dt>
                  <span className="credit-leader" aria-hidden />
                  <dd className="type-figure">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          {t.credits.length > 0 && (
            <section aria-labelledby="credits">
              <SectionHeading>
                <span id="credits">Credits</span>
              </SectionHeading>
              <dl className="grid gap-2 text-sm">
                {t.credits.map((c, i) => (
                  <div key={i} className="flex items-baseline gap-2">
                    <dt className="type-role text-muted-foreground">{c.role}</dt>
                    <span className="credit-leader" aria-hidden />
                    <dd>{c.name}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {t.kind === 'SAMPLE' && (
            <section aria-labelledby="rights">
              <SectionHeading>
                <span id="rights">Usage rights</span>
              </SectionHeading>
              {t.usageRights ? (
                <>
                  <p className="font-medium">{USAGE_RIGHTS[t.usageRights].label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{USAGE_RIGHTS[t.usageRights].summary}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The creator hasn’t set usage rights. Listen only.
                </p>
              )}
            </section>
          )}
        </aside>
      </div>
    </article>
  );
}
