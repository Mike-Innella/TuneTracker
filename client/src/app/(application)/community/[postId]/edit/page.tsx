import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { community, projects, requireProfile } from '@tunetracker/server';
import { PageHeader } from '@/components/layout/page-header';
import { PostComposer } from '@/components/community/post-composer';
import { or404 } from '@/lib/or-404';

export const metadata: Metadata = { title: 'Edit post' };

export default async function EditPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const me = await requireProfile();
  const { post } = await or404(community.getPost(me.id, postId));
  if (!post.isMine || !post.ownerRefs) notFound();
  const raw = post.ownerRefs;
  const mine = await projects.listProjects(me.id);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit post" />
      <PostComposer
        projects={mine.map((p) => ({ id: p.id, title: p.title, visibility: p.visibility }))}
        initial={{
          ...post,
          projectId: raw.projectId,
          audio: post.audio,
          image: raw.imageId ? { id: raw.imageId, url: post.imageUrl } : null,
        }}
      />
    </div>
  );
}
