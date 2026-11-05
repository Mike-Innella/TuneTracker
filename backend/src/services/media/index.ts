import { randomUUID } from 'node:crypto';
import { db } from '@tunetracker/data';
import {
  AUDIO_MIME_TYPES,
  BUCKETS,
  FILE_MIME_TYPES,
  IMAGE_MIME_TYPES,
  UPLOAD_LIMITS,
  completeUploadSchema,
  requestUploadSchema,
  type RequestUploadInput,
} from '@tunetracker/shared';
import { authorizeProject, authorizeTask } from '../../authorization/projects';
import { AppError, notFound, parse } from '../../lib/errors';
import { rateLimit } from '../../lib/rate-limit';
import { createUploadTicket, objectInfo, publicUrl, removeObjects, signedReadUrl } from '../../storage';

const RULES = {
  AUDIO: { types: AUDIO_MIME_TYPES as readonly string[], max: UPLOAD_LIMITS.audioBytes },
  IMAGE: { types: IMAGE_MIME_TYPES as readonly string[], max: UPLOAD_LIMITS.imageBytes },
  FILE: { types: FILE_MIME_TYPES as readonly string[], max: UPLOAD_LIMITS.fileBytes },
} as const;

/** Pure validation so the rules are unit-testable without storage. */
export function checkUpload(
  kind: keyof typeof RULES,
  mimeType: string,
  sizeBytes: number,
  visibility: string,
) {
  const rule = RULES[kind];
  if (!rule.types.includes(mimeType))
    throw new AppError(400, `Unsupported file type: ${mimeType || 'unknown'}`);
  if (sizeBytes > rule.max) {
    throw new AppError(413, `File is too large (max ${Math.round(rule.max / 1024 / 1024)} MB)`);
  }
  if (visibility === 'public' && kind !== 'IMAGE') {
    throw new AppError(400, 'Only images can be stored publicly');
  }
}

const EXT = /\.([a-z0-9]{1,8})$/i;

/**
 * Step 1 of the direct-to-storage upload: validate, check quota, reserve a row and
 * return a single-use signed upload token. File bytes never pass through Vercel.
 */
export async function requestUpload(actorId: string, input: RequestUploadInput) {
  const data = parse(requestUploadSchema, input);
  checkUpload(data.kind, data.mimeType, data.sizeBytes, data.visibility);
  await rateLimit(`upload:${actorId}`, 60, 3600);
  if (data.taskId) await authorizeTask(data.taskId, actorId, 'edit');
  if (data.projectId) await authorizeProject(data.projectId, actorId, 'edit');

  const used = await db().mediaAsset.aggregate({ where: { ownerId: actorId }, _sum: { sizeBytes: true } });
  if ((used._sum.sizeBytes ?? 0) + data.sizeBytes > UPLOAD_LIMITS.quotaBytes) {
    throw new AppError(413, 'Storage quota reached. Delete some uploads first.');
  }

  const bucket = data.visibility === 'public' ? BUCKETS.public : BUCKETS.media;
  const ext = data.fileName.match(EXT)?.[1]?.toLowerCase() ?? 'bin';
  // first path segment is the owner — storage keys can never collide across users
  const path = `${actorId}/${randomUUID()}.${ext}`;
  const asset = await db().mediaAsset.create({
    data: {
      ownerId: actorId,
      kind: data.kind,
      bucket,
      path,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      title: data.fileName.slice(0, 200),
      projectId: data.projectId ?? null,
      taskId: data.taskId ?? null,
    },
  });
  const ticket = await createUploadTicket(bucket, path);
  return { assetId: asset.id, bucket, path: ticket.path, token: ticket.token };
}

/** Step 2: confirm the object really landed in storage with the declared size/type. */
export async function completeUpload(
  actorId: string,
  input: { assetId: string; durationSec?: number | null; title?: string | null },
) {
  const data = parse(completeUploadSchema, input);
  const asset = await db().mediaAsset.findUnique({ where: { id: data.assetId } });
  if (!asset || asset.ownerId !== actorId) throw notFound('Upload not found');
  const info = await objectInfo(asset.bucket, asset.path);
  if (!info) throw new AppError(400, 'Upload did not reach storage. Please retry.');
  const rule = RULES[asset.kind];
  if (info.size > rule.max || (info.contentType && !rule.types.includes(info.contentType.split(';')[0]!))) {
    await removeObjects(asset.bucket, [asset.path]);
    await db().mediaAsset.delete({ where: { id: asset.id } });
    throw new AppError(400, 'Uploaded file failed verification');
  }
  const verified = await db().mediaAsset.update({
    where: { id: asset.id },
    data: {
      verifiedAt: new Date(),
      sizeBytes: info.size || asset.sizeBytes,
      durationSec: data.durationSec ?? null,
      ...(data.title ? { title: data.title } : {}),
    },
  });
  return { ...verified, url: await mediaUrl(verified) };
}

export async function mediaUrl(asset: { bucket: string; path: string }) {
  return asset.bucket === BUCKETS.public ? publicUrl(asset.path) : signedReadUrl(asset.path);
}

/** Owner deletes their upload; storage object first so a DB row never points at nothing. */
export async function deleteMedia(actorId: string, assetId: string) {
  const asset = await db().mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset) throw notFound('Upload not found');
  if (asset.ownerId !== actorId) {
    // project editors may remove attachments from tasks they can edit
    if (!asset.taskId) throw notFound('Upload not found');
    await authorizeTask(asset.taskId, actorId, 'edit');
  }
  await removeObjects(asset.bucket, [asset.path]);
  await db().mediaAsset.delete({ where: { id: assetId } });
}

export async function listMyAudio(actorId: string) {
  return db().mediaAsset.findMany({
    where: { ownerId: actorId, kind: 'AUDIO', verifiedAt: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
