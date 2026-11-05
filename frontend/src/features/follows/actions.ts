'use server';

import { revalidatePath } from 'next/cache';
import { follows, requireActor, runAction } from '@tunetracker/backend';

export async function setFollowAction(username: string, follow: boolean) {
  return runAction(async () => {
    const me = await requireActor();
    const r = follow ? await follows.follow(me.id, username) : await follows.unfollow(me.id, username);
    revalidatePath(`/artists/${username}`);
    return r;
  });
}
