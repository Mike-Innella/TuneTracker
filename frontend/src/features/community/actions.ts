'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { PostInput } from '@tunetracker/shared';
import { community, requireActor, runAction } from '@tunetracker/backend';

export async function createPostAction(input: PostInput) {
  const r = await runAction(async () => community.createPost((await requireActor()).id, input));
  if (r.ok) {
    revalidatePath('/community');
    redirect(`/community/${r.data.id}`);
  }
  return r;
}

export async function updatePostAction(postId: string, input: PostInput) {
  const r = await runAction(async () => community.updatePost((await requireActor()).id, postId, input));
  if (r.ok) redirect(`/community/${postId}`);
  return r;
}

export async function deletePostAction(postId: string) {
  const r = await runAction(async () => community.deletePost((await requireActor()).id, postId));
  if (r.ok) redirect('/community');
  return r;
}

export async function addCommentAction(postId: string, body: string, parentId?: string) {
  return runAction(async () => {
    await community.addComment((await requireActor()).id, postId, body, parentId);
    revalidatePath(`/community/${postId}`);
  });
}

export async function deleteCommentAction(postId: string, commentId: string) {
  return runAction(async () => {
    await community.deleteComment((await requireActor()).id, commentId);
    revalidatePath(`/community/${postId}`);
  });
}

export async function toggleReactionAction(postId: string, type: string) {
  return runAction(async () => community.toggleReaction((await requireActor()).id, postId, type));
}

export async function reportAction(input: { targetType: string; targetId: string; reason: string }) {
  return runAction(async () => {
    await community.report((await requireActor()).id, input);
  });
}
