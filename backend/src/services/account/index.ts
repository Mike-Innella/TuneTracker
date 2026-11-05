import { db } from '@tunetracker/data';
import { deleteAccountSchema } from '@tunetracker/shared';
import { supabaseAdmin } from '../../auth/supabase';
import { AppError, parse } from '../../lib/errors';
import { removeObjects } from '../../storage';

/**
 * Permanently deletes an account: the user's stored files, every row they own (owned projects,
 * posts, comments, reactions, follows, uploads — via cascades) and finally the Auth user.
 * Typing the username is the confirmation; the UI explains what goes.
 */
export async function deleteAccount(actorId: string, input: { confirmUsername: string }) {
  const { confirmUsername } = parse(deleteAccountSchema, input);
  const profile = await db().profile.findUniqueOrThrow({ where: { id: actorId } });
  if (confirmUsername !== profile.username) throw new AppError(400, 'Type your username exactly to confirm');

  const media = await db().mediaAsset.findMany({
    where: { ownerId: actorId },
    select: { bucket: true, path: true },
  });
  // also files other people uploaded to projects this user owns (they go with the project)
  const projectMedia = await db().mediaAsset.findMany({
    where: { OR: [{ project: { ownerId: actorId } }, { task: { project: { ownerId: actorId } } }] },
    select: { id: true, bucket: true, path: true },
  });
  const objects: { bucket: string; path: string }[] = [...media, ...projectMedia];
  if (profile.avatarPath) objects.push({ bucket: 'public-media', path: profile.avatarPath });
  for (const bucket of new Set(objects.map((o) => o.bucket))) {
    const paths = [...new Set(objects.filter((o) => o.bucket === bucket).map((o) => o.path))];
    for (let i = 0; i < paths.length; i += 100) await removeObjects(bucket, paths.slice(i, i + 100));
  }
  await db().$transaction([
    // their rows would otherwise survive with projectId = NULL, pointing at removed objects
    db().mediaAsset.deleteMany({ where: { id: { in: projectMedia.map((m) => m.id) } } }),
    db().profile.delete({ where: { id: actorId } }),
  ]);
  const { error } = await supabaseAdmin().auth.admin.deleteUser(actorId);
  if (error)
    throw new AppError(400, `Your data was deleted but the login could not be removed: ${error.message}`);
}
