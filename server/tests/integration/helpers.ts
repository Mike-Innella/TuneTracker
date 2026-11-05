import { randomUUID } from 'node:crypto';
import { db } from '@tunetracker/data';

export async function makeProfile(name = 'artist') {
  const id = randomUUID();
  return db().profile.create({
    data: { id, username: `${name}_${id.slice(0, 8)}`, displayName: name },
  });
}
