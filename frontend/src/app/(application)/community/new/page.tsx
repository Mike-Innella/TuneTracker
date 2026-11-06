import type { Metadata } from 'next';
import { projects, requireProfile, tracks } from '@tunetracker/backend';
import { PageHeader } from '@/components/layout/page-header';
import { PostComposer } from '@/components/community/post-composer';

export const metadata: Metadata = { title: 'New post' };

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const me = await requireProfile();
  const { projectId } = await searchParams;
  const [mine, myTracks] = await Promise.all([projects.listProjects(me.id), tracks.myTracks(me.id)]);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Share with the community"
        description="Everything in this form becomes public. Nothing else from your projects does."
      />
      <PostComposer
        projects={mine.map((p) => ({ id: p.id, title: p.title, visibility: p.visibility }))}
        tracks={myTracks.filter((t) => t.status === 'PUBLISHED').map((t) => ({ id: t.id, title: t.title }))}
        defaultProjectId={mine.some((p) => p.id === projectId) ? projectId : undefined}
      />
    </div>
  );
}
