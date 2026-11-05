import type { Metadata } from 'next';
import Link from 'next/link';
import { community, projects, requireProfile } from '@tunetracker/server';
import { EmptyState, SectionHeading } from '@/components/layout/page-header';
import { PostCard } from '@/components/community/post-card';
import { ProjectArtwork } from '@/components/dashboard/project-artwork';
import { UserAvatar } from '@/components/ui/user-avatar';
import { or404 } from '@/lib/or-404';
import { Music4 } from 'lucide-react';

export const metadata: Metadata = { title: 'Project showcase' };

/** Public face of a project: title, description, artwork and the posts its owner published. */
export default async function ShowcasePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const me = await requireProfile();
  const project = await or404(projects.getPublicProject(projectId, me.id));
  const { posts } = await community.getFeed(me.id, { projectId, limit: 20 });
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end">
        <ProjectArtwork title={project.title} url={project.artworkUrl} className="size-32 text-2xl" />
        <div className="min-w-0">
          <h1 className="type-title text-4xl break-words">{project.title}</h1>
          <Link
            href={`/artists/${project.owner.username}`}
            className="mt-3 inline-flex items-center gap-2 text-sm hover:underline"
          >
            <UserAvatar name={project.owner.displayName} url={project.owner.avatarUrl} className="size-6" />
            {project.owner.displayName}
          </Link>
          {project.description && (
            <p className="mt-3 max-w-prose text-muted-foreground">{project.description}</p>
          )}
        </div>
      </header>
      <SectionHeading>Shared from this project</SectionHeading>
      {posts.length === 0 ? (
        <EmptyState icon={Music4} title="Nothing shared yet" />
      ) : (
        <div className="grid gap-6">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
