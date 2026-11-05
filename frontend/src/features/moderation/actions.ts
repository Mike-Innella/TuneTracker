'use server';

import { revalidatePath } from 'next/cache';
import { moderation, requireActor, runAction } from '@tunetracker/backend';

export async function resolveReportAction(input: { reportId: string; outcome: string; note?: string }) {
  return runAction(async () => {
    await moderation.resolveReport((await requireActor()).id, input);
    revalidatePath('/moderation');
  });
}

export async function unsuspendAction(username: string) {
  return runAction(async () => {
    await moderation.unsuspend((await requireActor()).id, username);
    revalidatePath('/moderation');
  });
}
