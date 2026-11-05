import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Globe, MapPin, Music4, Pencil } from 'lucide-react';
import { getCurrentProfile, profiles, tracks } from '@tunetracker/backend';
import { TrackList } from '@/components/tracks/track-list';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { EmptyState, SectionHeading } from '@/components/layout/page-header';
import { PostCard } from '@/components/community/post-card';
import { ReportButton } from '@/components/community/post-extras';
import { ProjectArtwork } from '@/components/dashboard/project-artwork';
import { or404 } from '@/lib/or-404';
import { FollowStats } from '@/components/profile/follow-stats';
import { formatDate } from '@/lib/format';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function ArtistPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const me = await getCurrentProfile();
  const { profile, posts, projects, isMe, stats } = await or404(
    profiles.getArtist(me?.id ?? null, decodeURIComponent(username)),
  );
  const catalogue = await tracks.artistTracks(me?.id ?? null, profile.id);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="relative mb-10 flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="neon-bloom -top-16 -left-16 size-72" aria-hidden />
        <UserAvatar
          name={profile.displayName}
          url={profile.avatarUrl}
          className="relative size-28 text-2xl sm:size-32"
        />
        <div className="relative min-w-0 flex-1">
          <h1 className="type-title text-4xl break-words sm:text-5xl">{profile.displayName}</h1>
          <p className="mt-2 text-muted-foreground">
            @{profile.username}
            {!profile.isPublic && (
              <span className="type-role ml-3 text-warning">private profile — only you can see this</span>
            )}
          </p>
          <div className="mt-4">
            <FollowStats
              username={profile.username}
              followers={stats.followers}
              following={stats.following}
              isFollowing={stats.isFollowing}
              canFollow={!!me && !isMe}
            />
          </div>
          {profile.specialties.length > 0 && (
            <p className="type-role mt-3 text-foreground">{profile.specialties.join(' · ')}</p>
          )}
        </div>
        <div className="relative flex gap-2">
          {isMe ? (
            <Button asChild variant="outline">
              <Link href="/profile">
                <Pencil aria-hidden /> Edit profile
              </Link>
            </Button>
          ) : (
            me && <ReportButton targetType="PROFILE" targetId={profile.id} />
          )}
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <aside className="grid content-start gap-8">
          <section aria-labelledby="about">
            <SectionHeading>
              <span id="about">Liner notes</span>
            </SectionHeading>
            {profile.bio ? (
              <p className="leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No bio yet.</p>
            )}
            <dl className="mt-5 grid gap-2 text-sm">
              {profile.location && (
                <div className="flex items-center gap-2">
                  <dt>
                    <MapPin className="size-4 text-ink-soft" aria-label="Location" />
                  </dt>
                  <dd>{profile.location}</dd>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-2">
                  <dt>
                    <Globe className="size-4 text-ink-soft" aria-label="Website" />
                  </dt>
                  <dd>
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-electric hover:underline"
                    >
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  </dd>
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <dt className="type-role text-muted-foreground">Member since</dt>
                <span className="credit-leader" aria-hidden />
                <dd className="type-figure">
                  {formatDate(profile.createdAt, { month: 'short', year: 'numeric' })}
                </dd>
              </div>
            </dl>
          </section>

          {profile.socialLinks.length > 0 && (
            <section aria-labelledby="links">
              <SectionHeading>
                <span id="links">Listen elsewhere</span>
              </SectionHeading>
              <ul className="grid gap-2">
                {profile.socialLinks.map((l) => (
                  <li key={l.id} className="flex items-baseline gap-3">
                    <span className="type-role text-muted-foreground">{l.label}</span>
                    <span className="credit-leader" aria-hidden />
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1 text-sm text-electric hover:underline"
                    >
                      Open <ExternalLink className="size-3" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="pub-projects">
            <SectionHeading>
              <span id="pub-projects">Public projects</span>
            </SectionHeading>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No public projects.</p>
            ) : (
              <ul className="grid gap-3">
                {projects.map((p) => (
                  <li key={p.id} className="flex gap-3">
                    <ProjectArtwork title={p.title} url={p.artworkUrl} className="size-12" />
                    <div className="min-w-0">
                      <Link
                        href={`/showcase/${p.id}`}
                        className="block truncate font-semibold hover:text-electric"
                      >
                        {p.title}
                      </Link>
                      {p.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <div className="grid content-start gap-10">
          <section aria-labelledby="tracks">
            <SectionHeading>
              <span id="tracks">Tracks</span>
            </SectionHeading>
            {catalogue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published tracks yet.</p>
            ) : (
              <TrackList tracks={catalogue} />
            )}
          </section>
          <section aria-labelledby="posts">
            <SectionHeading>
              <span id="posts">Published posts</span>
            </SectionHeading>
            {posts.length === 0 ? (
              <EmptyState icon={Music4} title="Nothing published yet">
                {isMe ? 'Share a demo or a finished track from the community page.' : 'Check back soon.'}
              </EmptyState>
            ) : (
              <div className="grid gap-6">
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
