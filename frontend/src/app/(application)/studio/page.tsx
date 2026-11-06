import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarClock, FolderKanban, Music4, Plus, Upload, Users } from 'lucide-react';
import { blog, collaboration, dashboard, playlists, requireProfile, tracks } from '@tunetracker/backend';
import { NewPlaylist } from '@/components/playlists/new-playlist';
import { StudioTracks } from '@/components/tracks/studio-tracks';
import { TrackList } from '@/components/tracks/track-list';
import { CountingNumber } from '@animate-ui/react/primitives/texts/counting-number';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader, SectionHeading } from '@/components/layout/page-header';
import { Invitations } from '@/components/dashboard/invitations';
import { ProgressLine } from '@/components/dashboard/progress-line';
import { ProjectArtwork } from '@/components/dashboard/project-artwork';
import { UserAvatar } from '@/components/ui/user-avatar';
import { formatDate, timeAgo } from '@/lib/format';

export const metadata: Metadata = { title: 'Studio' };

function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 5 ? 'Late session' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** Studio: your tracks, projects, invitations and activity (the former dashboard). */
export default async function StudioPage() {
  const me = await requireProfile();
  const [data, invites, mine, articles, myPlaylists, saved] = await Promise.all([
    dashboard.getDashboard(me.id),
    collaboration.myInvites(me.id),
    tracks.myTracks(me.id),
    blog.myArticles(me.id),
    playlists.myPlaylists(me.id),
    playlists.savedTracks(me.id),
  ]);
  const stats = [
    ['Active projects', data.stats.activeProjects],
    ['Tasks with due dates', data.stats.tasksDue],
    ['Collaborators', data.stats.collaborators],
    ['Published posts', data.stats.publishedPosts],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`${greeting()}, ${me.displayName.split(' ')[0]}`}
        description="Here’s where your music stands."
        actions={
          <>
            <Button asChild>
              <Link href="/studio/upload">
                <Upload aria-hidden /> Upload
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/projects?new=1">
                <Plus aria-hidden /> New project
              </Link>
            </Button>
          </>
        }
      />

      <Invitations invites={invites} />

      {/* Credits strip — one ruled line, not a row of stat cards */}
      <dl
        className="mb-10 grid grid-cols-2 gap-x-8 gap-y-4 border-y border-rule py-4 sm:grid-cols-4"
        data-testid="dashboard-stats"
      >
        {stats.map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-3">
            <dt className="type-role text-muted-foreground">{label}</dt>
            <span className="credit-leader hidden sm:block" aria-hidden />
            <dd className="text-xl">
              <CountingNumber number={value} inView className="type-figure tabular-nums" />
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="grid content-start gap-10">
          <section aria-labelledby="my-tracks">
            <SectionHeading>
              <span id="my-tracks">Your tracks</span>
            </SectionHeading>
            {mine.length === 0 ? (
              <EmptyState
                icon={Music4}
                title="Nothing uploaded yet"
                action={
                  <Button asChild>
                    <Link href="/studio/upload">Upload a track</Link>
                  </Button>
                }
              >
                Upload a track or a sample: it’s saved as a private draft until you publish it.
              </EmptyState>
            ) : (
              <StudioTracks tracks={mine} />
            )}
          </section>
          <section aria-labelledby="my-playlists">
            <SectionHeading action={<NewPlaylist />}>
              <span id="my-playlists">Playlists</span>
            </SectionHeading>
            {myPlaylists.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Collect tracks in order — yours or anyone’s — and share them.
              </p>
            ) : (
              <ul className="divide-y divide-border" data-testid="my-playlists">
                {myPlaylists.map((p) => (
                  <li key={p.id} className="flex items-baseline gap-3 py-3">
                    <Link
                      href={`/playlists/${p.id}`}
                      className="min-w-0 flex-1 truncate font-medium hover:text-electric"
                    >
                      {p.title}
                    </Link>
                    <span className="type-figure text-xs text-muted-foreground">
                      {p.trackCount} {p.trackCount === 1 ? 'track' : 'tracks'}
                      {p.visibility === 'PRIVATE' && ' · private'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="saved">
            <SectionHeading>
              <span id="saved">Saved tracks</span>
            </SectionHeading>
            {saved.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tracks you like are collected here.</p>
            ) : (
              <TrackList tracks={saved} showArtist />
            )}
          </section>
          <section aria-labelledby="my-articles">
            <SectionHeading
              action={
                <Link
                  href="/studio/articles/new"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  Write <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              }
            >
              <span id="my-articles">Your articles</span>
            </SectionHeading>
            {articles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Share what you know — a mixing trick, a gear note, the story behind a release.
              </p>
            ) : (
              <ul className="divide-y divide-border" data-testid="my-articles">
                {articles.map((a) => (
                  <li key={a.id} className="flex items-baseline gap-3 py-3">
                    <Link
                      href={`/studio/articles/${a.id}`}
                      className="min-w-0 flex-1 truncate font-medium hover:text-electric"
                    >
                      {a.title}
                    </Link>
                    <span
                      className={
                        a.status === 'DRAFT' ? 'type-role text-warning' : 'type-role text-muted-foreground'
                      }
                    >
                      {a.status === 'DRAFT' ? 'Draft' : 'Published'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="recent-projects">
            <SectionHeading
              action={
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  All projects <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              }
            >
              <span id="recent-projects">Recent projects</span>
            </SectionHeading>
            {data.recentProjects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                action={
                  <Button asChild>
                    <Link href="/projects?new=1">Start a project</Link>
                  </Button>
                }
              >
                Start one from a template — songwriting, mixing, release prep — and shape the board to your
                process.
              </EmptyState>
            ) : (
              <ol className="divide-y divide-border">
                {data.recentProjects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}/board`} className="group flex items-center gap-4 py-3.5">
                      <ProjectArtwork title={p.title} url={p.artworkUrl} className="size-12" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold group-hover:text-electric">{p.title}</p>
                        <p className="type-role mt-1 text-muted-foreground">
                          {p.status.replace('_', ' ')} ·{' '}
                          <span className="type-figure normal-case">{p.taskCount}</span> tasks
                          {p.dueDate && (
                            <>
                              {' '}
                              · due <span className="type-figure normal-case">{formatDate(p.dueDate)}</span>
                            </>
                          )}
                        </p>
                        <ProgressLine value={p.progress} label={`${p.title} progress`} className="mt-2.5" />
                      </div>
                      <span className="type-figure w-11 text-right text-sm text-muted-foreground">
                        {p.progress}%
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="upcoming">
            <SectionHeading>
              <span id="upcoming">Upcoming tasks</span>
            </SectionHeading>
            {data.upcoming.length === 0 ? (
              <EmptyState icon={CalendarClock} title="Nothing scheduled">
                Give tasks a due date on any board and they’ll line up here.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-border">
                {data.upcoming.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/projects/${t.project.id}/board?task=${t.id}`}
                      className="flex items-baseline gap-3 py-3 hover:text-electric"
                    >
                      <span className="type-figure w-14 shrink-0 text-sm text-muted-foreground">
                        {formatDate(t.dueDate)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      <span className="type-role hidden truncate text-muted-foreground sm:block">
                        {t.project.title} · {t.column.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="grid content-start gap-10">
          <section aria-labelledby="activity">
            <SectionHeading>
              <span id="activity">Recent activity</span>
            </SectionHeading>
            {data.activity.length === 0 ? (
              <EmptyState icon={Users} title="Quiet so far">
                Changes you and your collaborators make show up here.
              </EmptyState>
            ) : (
              <ul className="grid gap-3.5">
                {data.activity.map((a) => (
                  <li key={a.id} className="text-sm">
                    <span className="font-medium">{a.actor.displayName}</span>{' '}
                    <span className="text-muted-foreground">{a.summary}</span>
                    <span className="mt-0.5 block text-xs text-ink-soft">
                      <Link href={`/projects/${a.project.id}`} className="hover:text-foreground">
                        {a.project.title}
                      </Link>{' '}
                      · <span className="type-figure">{timeAgo(a.createdAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="community-updates">
            <SectionHeading
              action={
                <Link
                  href="/community"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  Feed <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              }
            >
              <span id="community-updates">Community</span>
            </SectionHeading>
            {data.community.length === 0 ? (
              <EmptyState icon={Music4} title="The feed is waiting">
                Be the first to share a demo or ask for feedback.
              </EmptyState>
            ) : (
              <ul className="grid gap-4">
                {data.community.map((p) => (
                  <li key={p.id}>
                    <Link href={`/community/${p.id}`} className="group flex gap-3">
                      <UserAvatar name={p.author.displayName} url={p.author.avatarUrl} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold group-hover:text-electric">
                          {p.title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {p.author.displayName} · <span className="type-figure">{timeAgo(p.createdAt)}</span>
                          {p.audio && ' · audio'}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
