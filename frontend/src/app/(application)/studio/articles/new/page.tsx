import type { Metadata } from 'next';
import { requireProfile } from '@tunetracker/backend';
import { ArticleEditor } from '@/components/blog/article-editor';
import { PageHeader } from '@/components/layout/page-header';

export const metadata: Metadata = { title: 'New article' };

export default async function NewArticlePage() {
  await requireProfile();
  return (
    <>
      <PageHeader title="New article" className="mx-auto max-w-3xl" />
      <ArticleEditor />
    </>
  );
}
