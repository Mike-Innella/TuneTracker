'use server';

import { revalidatePath } from 'next/cache';
import { notifications, requireActor, runAction } from '@tunetracker/backend';

export async function markNotificationsRead() {
  return runAction(async () => {
    const me = await requireActor();
    await notifications.markAllRead(me.id);
    revalidatePath('/', 'layout');
  });
}
