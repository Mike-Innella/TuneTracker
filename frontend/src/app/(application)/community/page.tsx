import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Music4, PenLine } from 'lucide-react';
import { community, requireProfile } from '@tunetracker/backend';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/layout/page-header';
import { PostCard, POST_TYPE_LABEL } from '@/components/community/post-card';
import { TabLinks } from '@/components/ui/tab-links';

export const metadata: Metadata = { title: 'Community' };

const FILTERS = [['', 'Everything'], ...Object.entries(POST_TYPE_LABEL)] as const;

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; type?: string }>;
}) {
  const me = await requireProfile();
  const { cursor, type } = await searchParams;
  const validType = type && type in POST_TYPE_LABEL ? type : undefined;
  const { posts, nextCursor } = await community.getFeed(me.id, { cursor, limit: 10, type: validType });
  const qs = (extra: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ type: validType, ...extra })) if (v) sp.set(k, v);
    return sp.size ? `?${sp}` : '';
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Community"
        description="Progress, samples, demos and finished tracks from other artists. Listen, react, give feedback."
        actions={
          <Button asChild>
            <Link href="/community/new">
              <PenLine aria-hidden /> New post
            </Link>
          </Button>
        }
      />
      <TabLinks
        label="Post type"
        className="-mx-4 mb-6 px-4"
        items={FILTERS.map(([key, label]) => ({
          href: `/community${key ? `?type=${key}` : ''}`,
          label,
          active: (validType ?? '') === key,
        }))}
      />

      {posts.length === 0 ? (
        <EmptyState
          icon={Music4}
          title={cursor ? 'You’ve reached the beginning' : 'No posts here yet'}
          action={
            <Button asChild variant="outline">
              <Link href="/community/new">Share something</Link>
            </Button>
          }
        >
          Share a work-in-progress, a sample pack or a finished mix and ask for feedback.
        </EmptyState>
      ) : (
        <div className="grid gap-6" data-testid="feed">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        {cursor ? (
          <Button asChild variant="ghost">
            <Link href={`/community${qs({})}`}>Back to newest</Link>
          </Button>
        ) : (
          <span />
        )}
        {nextCursor && (
          <Button asChild variant="outline">
            <Link href={`/community${qs({ cursor: nextCursor })}`}>
              Older posts <ArrowRight aria-hidden />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
