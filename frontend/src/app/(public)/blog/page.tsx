import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper, PenLine } from 'lucide-react';
import { BLOG_CATEGORIES } from '@tunetracker/shared';
import { blog, getCurrentProfile } from '@tunetracker/backend';
import { ArticleCard } from '@/components/blog/article-card';
import { EmptyState, PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { TabLinks } from '@/components/ui/tab-links';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Production notes, gear, the business of music and artist stories from the TuneTracker community.',
};

type Search = { q?: string; category?: string; tag?: string; cursor?: string };

export default async function BlogPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 80) || undefined;
  const category = (BLOG_CATEGORIES as readonly string[]).includes(sp.category ?? '')
    ? (sp.category as (typeof BLOG_CATEGORIES)[number])
    : undefined;
  const tag = sp.tag?.trim().slice(0, 30) || undefined;
  const me = await getCurrentProfile();
  const { articles, nextCursor } = await blog.listArticles(me?.id ?? null, {
    q,
    category,
    tag,
    cursor: sp.cursor || null,
  });
  const href = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, category, tag, ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/blog?${s}` : '/blog';
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={tag ? `#${tag}` : q ? `Articles about “${q}”` : 'Blog'}
        description={
          !q && !tag ? 'Production notes, gear, the business of music and artist stories.' : undefined
        }
        actions={
          <Button asChild variant="outline">
            <Link href={me ? '/studio/articles/new' : '/login?next=/studio/articles/new'}>
              <PenLine aria-hidden /> Write
            </Link>
          </Button>
        }
      />
      <form action="/blog" role="search" className="mb-6 flex max-w-xl gap-2">
        {category && <input type="hidden" name="category" value={category} />}
        <label htmlFor="blog-q" className="sr-only">
          Search articles
        </label>
        <input
          id="blog-q"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search articles"
          className="h-10 min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      <TabLinks
        label="Category"
        className="mb-8"
        items={[
          { href: href({ category: undefined, cursor: undefined }), label: 'All', active: !category },
          ...BLOG_CATEGORIES.map((c) => ({
            href: href({ category: c, cursor: undefined }),
            label: c,
            active: category === c,
          })),
        ]}
      />
      {articles.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={sp.cursor ? 'That’s everything' : 'No articles here yet'}
          action={
            <Button asChild variant="outline">
              <Link href="/blog">All articles</Link>
            </Button>
          }
        >
          {sp.cursor ? 'You’ve reached the end.' : 'Try another category or search, or write the first one.'}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.id} a={a} />
          ))}
        </div>
      )}
      {(nextCursor || sp.cursor) && (
        <nav aria-label="Pagination" className="mt-10 flex justify-center gap-3">
          {sp.cursor && (
            <Button asChild variant="ghost">
              <Link href={href({ cursor: undefined })}>Back to newest</Link>
            </Button>
          )}
          {nextCursor && (
            <Button asChild variant="outline">
              <Link href={href({ cursor: nextCursor })} rel="next">
                More articles
              </Link>
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
