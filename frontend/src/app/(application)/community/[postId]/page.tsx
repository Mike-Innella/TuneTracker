import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { community, requireProfile } from '@tunetracker/backend';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/community/post-card';
import { CommentsSection, PostOwnerActions, ReportButton } from '@/components/community/post-extras';
import { or404 } from '@/lib/or-404';

export const metadata: Metadata = { title: 'Post' };

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const me = await requireProfile();
  const { post, comments } = await or404(community.getPost(me.id, postId));
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/community">
            <ArrowLeft aria-hidden /> Community
          </Link>
        </Button>
        <div className="flex gap-2">
          {post.isMine ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/community/${post.id}/edit`}>
                  <Pencil aria-hidden /> Edit
                </Link>
              </Button>
              <PostOwnerActions postId={post.id} />
            </>
          ) : (
            <ReportButton targetType="POST" targetId={post.id} />
          )}
        </div>
      </div>
      <PostCard post={post} full />
      <CommentsSection
        postId={post.id}
        comments={comments}
        postIsMine={post.isMine}
        feedbackRequested={post.feedbackRequested}
      />
    </div>
  );
}
