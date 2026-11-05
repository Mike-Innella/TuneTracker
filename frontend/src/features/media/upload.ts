'use client';

import { Upload } from 'tus-js-client';

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

  if (file.size > RESUMABLE_THRESHOLD) await putResumable(file, bucket, path, token, onProgress);
  else await putSingle(file, bucket, path, token, onProgress);

  const durationSec = opts.kind === 'AUDIO' ? await readAudioDuration(file) : null;
  const done = await completeUploadAction({ assetId, durationSec, title: file.name.replace(/\.[^.]+$/, '') });
  if (!done.ok) throw new Error(done.error);
  return done.data;
}

const SUPABASE_URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
/** Supabase recommends TUS above 6 MB, and requires exactly 6 MB chunks. */
const CHUNK = 6 * 1024 * 1024;
const RESUMABLE_THRESHOLD = CHUNK;

/** Small files: one signed PUT with progress. */
function putSingle(
  file: File,
  bucket: string,
  path: string,
  token: string,
  onProgress?: (pct: number) => void,
) {
  const url = `${SUPABASE_URL()}/storage/v1/object/upload/sign/${bucket}/${path}?token=${encodeURIComponent(token)}`;
  const body = new FormData();
  body.append('cacheControl', '3600');
  body.append('', file);
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('apikey', ANON_KEY());
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error('Upload failed. Please try again.')));
    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.send(body);
  });
}

/**
 * Large files: TUS resumable upload authorised by the same single-use signed token.
 * Interrupted chunks are retried and the upload continues from the server's offset.
 * shortcut: resumes within the page session only; persisting the ticket for resume-after-reload
 * is the upgrade if long uploads on flaky mobile networks become common.
 */
function putResumable(
  file: File,
  bucket: string,
  path: string,
  token: string,
  onProgress?: (pct: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: `${SUPABASE_URL()}/storage/v1/upload/resumable/sign`,
      headers: { apikey: ANON_KEY(), 'x-signature': token, 'x-upsert': 'false' },
      chunkSize: CHUNK,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      storeFingerprintForResuming: false,
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      },
      onProgress: (sent, total) => onProgress?.(Math.round((sent / total) * 100)),
      onSuccess: () => resolve(),
      onError: (e) => reject(new Error(`Upload failed after retries: ${e.message}`)),
    });
    upload.start();
  });
}
