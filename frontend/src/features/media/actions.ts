'use server';

import type { RequestUploadInput } from '@tunetracker/shared';
import { media, requireActor, runAction } from '@tunetracker/backend';

export async function requestUploadAction(input: RequestUploadInput) {
  return runAction(async () => media.requestUpload((await requireActor()).id, input));
}

export async function completeUploadAction(input: {
  assetId: string;
  durationSec?: number | null;
  title?: string | null;
}) {
  return runAction(async () => {
    const asset = await media.completeUpload((await requireActor()).id, input);
    return {
      id: asset.id,
      path: asset.path,
      bucket: asset.bucket,
      url: asset.url,
      title: asset.title,
      durationSec: asset.durationSec,
      mimeType: asset.mimeType,
    };
  });
}

export async function deleteMediaAction(assetId: string) {
  return runAction(async () => media.deleteMedia((await requireActor()).id, assetId));
}
