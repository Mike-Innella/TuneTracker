'use client';

import type { RequestUploadInput } from '@tunetracker/shared';
import { completeUploadAction, requestUploadAction } from './actions';

export type UploadedAsset = {
  id: string;
  path: string;
  bucket: string;
  url: string | null;
  title: string | null;
  durationSec: number | null;
  mimeType: string;
};

/** Reads duration in the browser; unsupported codecs simply yield null. */
export function readAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';
    const done = (v: number | null) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    audio.onloadedmetadata = () =>
      done(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null);
    audio.onerror = () => done(null);
    audio.src = url;
  });
}

/**
 * Direct browser → Supabase Storage upload:
 * 1. server validates + reserves a signed upload token, 2. XHR PUT (for progress),
 * 3. server verifies the stored object and persists metadata.
 */
export async function uploadFile(
  file: File,
  opts: Omit<RequestUploadInput, 'fileName' | 'mimeType' | 'sizeBytes'>,
  onProgress?: (pct: number) => void,
): Promise<UploadedAsset> {
  const ticket = await requestUploadAction({
    ...opts,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  });
  if (!ticket.ok) throw new Error(ticket.error);
  const { bucket, path, token, assetId } = ticket.data;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const url = `${base}/storage/v1/object/upload/sign/${bucket}/${path}?token=${encodeURIComponent(token)}`;
  const body = new FormData();
  body.append('cacheControl', '3600');
  body.append('', file);
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error('Upload failed. Please try again.')));
    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.send(body);
  });

  const durationSec = opts.kind === 'AUDIO' ? await readAudioDuration(file) : null;
  const done = await completeUploadAction({ assetId, durationSec, title: file.name.replace(/\.[^.]+$/, '') });
  if (!done.ok) throw new Error(done.error);
  return done.data;
}
