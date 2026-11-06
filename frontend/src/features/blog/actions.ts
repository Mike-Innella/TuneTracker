'use server';

import { revalidatePath } from 'next/cache';
import { blog, requireActor, runAction, type ArticleInput } from '@tunetracker/backend';

export async function saveArticleAction(id: string | null, input: ArticleInput) {
  return runAction(async () => {
    const me = await requireActor();
    const a = id ? await blog.updateArticle(me.id, id, input) : await blog.createArticle(me.id, input);
    revalidatePath(`/blog/${a.slug}`);
    return { id: a.id, slug: a.slug };
  });
}

export async function setArticlePublishedAction(id: string, publish: boolean) {
  return runAction(async () => {
    const me = await requireActor();
    const a = publish ? await blog.publishArticle(me.id, id) : await blog.unpublishArticle(me.id, id);
    revalidatePath('/blog');
    revalidatePath(`/blog/${a.slug}`);
    return { slug: a.slug };
  });
}

export async function deleteArticleAction(id: string) {
  return runAction(async () => {
    const me = await requireActor();
    await blog.deleteArticle(me.id, id);
    revalidatePath('/blog');
    revalidatePath('/studio');
  });
}
