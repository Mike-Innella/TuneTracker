import Link from 'next/link';
import type { PublicArticle } from '@tunetracker/backend';
import { ProjectArtwork } from '@/components/dashboard/project-artwork';
import { formatDate } from '@/lib/format';

/** A list entry: cover or house sleeve, category, title, summary and a credit line. */
export function ArticleCard({ a }: { a: PublicArticle }) {
  return (
    <article className="group grid min-w-0 gap-3" data-testid="article-card">
      <Link href={`/blog/${a.slug}`} tabIndex={-1} aria-hidden>
        <ProjectArtwork
          title={a.title}
          url={a.coverUrl}
          className="aspect-[16/9] size-auto w-full text-4xl"
        />
      </Link>
      <p className="type-role text-muted-foreground">{a.category}</p>
      <h2 className="type-title -mt-1 text-xl leading-tight">
        <Link href={`/blog/${a.slug}`} className="hover:underline">
          {a.title}
        </Link>
      </h2>
      <p className="line-clamp-3 text-sm text-muted-foreground">{a.excerpt}</p>
      <p className="flex items-baseline gap-2 text-xs text-muted-foreground">
        <span className="truncate">{a.author.displayName}</span>
        <span className="credit-leader" aria-hidden />
        <span className="type-figure shrink-0">
          {a.publishedAt ? formatDate(a.publishedAt) : 'Draft'} · {a.readingMinutes} min
        </span>
      </p>
    </article>
  );
}
