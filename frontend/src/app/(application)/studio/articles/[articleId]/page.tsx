import type { Metadata } from 'next';
import { blog, requireProfile } from '@tunetracker/backend';
import { ArticleEditor } from '@/components/blog/article-editor';
import { PageHeader } from '@/components/layout/page-header';
import { or404 } from '@/lib/or-404';

export const metadata: Metadata = { title: 'Edit article' };

export default async function EditArticlePage({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  const me = await requireProfile();
  const a = await or404(blog.getOwnArticle(me.id, articleId));
  return (
    <>
      <PageHeader title="Edit article" className="mx-auto max-w-3xl" />
      <ArticleEditor
        initial={{
          id: a.id,
          slug: a.slug,
          title: a.title,
          excerpt: a.ownExcerpt,
          bodyHtml: a.bodyHtml,
          category: a.category,
          tags: a.tags,
          status: a.status,
          coverId: a.coverId,
          coverUrl: a.coverUrl,
        }}
      />
    </>
  );
}
