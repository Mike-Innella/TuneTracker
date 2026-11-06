import type { Metadata } from 'next';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { blog, getCurrentProfile } from '@tunetracker/backend';
import { ArticleCard } from '@/components/blog/article-card';
import { ReportButton } from '@/components/community/post-extras';
import { SectionHeading } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { formatDate } from '@/lib/format';
import { or404 } from '@/lib/or-404';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const me = await getCurrentProfile();
  const a = await blog.getArticle(me?.id ?? null, slug).catch(() => null);
  if (!a) return { title: 'Article not found' };
  return {
    title: a.title,
    description: a.excerpt.slice(0, 160),
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: {
      type: 'article',
      publishedTime: a.publishedAt?.toISOString(),
      authors: [a.author.displayName],
      images: a.coverUrl ? [a.coverUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const me = await getCurrentProfile();
  const a = await or404(blog.getArticle(me?.id ?? null, slug));
  const related = a.status === 'PUBLISHED' ? await blog.relatedArticles(a) : [];

  return (
    <article className="mx-auto max-w-3xl">
      {a.status !== 'PUBLISHED' && (
        <p className="mb-6 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm" role="status">
          Draft — only you can see this article.
        </p>
      )}
      <header>
        <Link
          href={`/blog?category=${encodeURIComponent(a.category)}`}
          className="type-role text-muted-foreground hover:text-foreground"
        >
          {a.category}
        </Link>
        <h1 className="type-title mt-2 text-4xl break-words sm:text-5xl">{a.title}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-rule py-3 text-sm">
          <Link href={`/artists/${a.author.username}`} className="flex items-center gap-2 hover:underline">
            <UserAvatar name={a.author.displayName} url={a.author.avatarUrl} className="size-7" />
            <span className="font-medium">{a.author.displayName}</span>
          </Link>
          <span className="type-figure text-muted-foreground">
            {a.publishedAt ? formatDate(a.publishedAt) : 'Unpublished'} · {a.readingMinutes} min read
          </span>
          <span className="ml-auto flex gap-2">
            {a.isMine ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/studio/articles/${a.id}`}>
                  <Pencil aria-hidden /> Edit
                </Link>
              </Button>
            ) : (
              me && <ReportButton targetType="ARTICLE" targetId={a.id} />
            )}
          </span>
        </div>
      </header>
      {a.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- public bucket URL
        <img src={a.coverUrl} alt="" className="mt-8 aspect-[16/9] w-full rounded-md object-cover" />
      )}
      {/* bodyHtml is sanitized on the server with a strict allowlist before it is stored */}
      <div className="prose-article mt-8" dangerouslySetInnerHTML={{ __html: a.bodyHtml }} />
      {a.tags.length > 0 && (
        <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
          {a.tags.map((t) => (
            <li key={t}>
              <Link
                href={`/blog?tag=${encodeURIComponent(t)}`}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs hover:bg-muted"
              >
                #{t}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-16">
          <SectionHeading>
            <span id="related">Keep reading</span>
          </SectionHeading>
          <div
            className="grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-10 sm:grid-cols-3"
            data-testid="related-articles"
          >
            {related.map((r) => (
              <ArticleCard key={r.id} a={r} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
