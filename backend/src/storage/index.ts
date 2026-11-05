import 'server-only';
import { BUCKETS } from '@tunetracker/shared';
import { supabaseAdmin } from '../auth/supabase';
import { env } from '../lib/env';

/**
 * The server may reach Supabase on an internal host (Docker); URLs handed to the
 * browser must use the public origin.
 */
function toPublicOrigin(url: string) {
  const internal = env.supabaseInternalUrl();
  const publicUrl = env.supabaseUrl();
  return internal === publicUrl ? url : url.replace(internal, publicUrl);
}

export async function createUploadTicket(bucket: string, path: string) {
  const { data, error } = await supabaseAdmin().storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) throw new Error(`createSignedUploadUrl failed: ${error?.message}`);
  return { path: data.path, token: data.token };
}

export async function objectInfo(bucket: string, path: string) {
  const { data, error } = await supabaseAdmin().storage.from(bucket).info(path);
  if (error || !data) return null;
  return { size: data.size ?? 0, contentType: data.contentType ?? '' };
}

export async function removeObjects(bucket: string, paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await supabaseAdmin().storage.from(bucket).remove(paths);
  if (error) throw new Error(`storage remove failed: ${error.message}`);
}

/** Short-lived read URL for a private object. */
export async function signedReadUrl(path: string, expiresIn = 60 * 60) {
  const { data, error } = await supabaseAdmin().storage.from(BUCKETS.media).createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  return toPublicOrigin(data.signedUrl);
}

export async function signedReadUrls(paths: string[], expiresIn = 60 * 60) {
  if (paths.length === 0) return new Map<string, string>();
  const { data } = await supabaseAdmin().storage.from(BUCKETS.media).createSignedUrls(paths, expiresIn);
  const out = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) out.set(row.path, toPublicOrigin(row.signedUrl));
  }
  return out;
}

/** Short-lived URL that downloads a private object under a friendly filename. */
export async function signedDownloadUrl(path: string, filename: string, expiresIn = 300) {
  const { data, error } = await supabaseAdmin()
    .storage.from(BUCKETS.media)
    .createSignedUrl(path, expiresIn, { download: filename });
  if (error || !data) return null;
  return toPublicOrigin(data.signedUrl);
}

/** Public bucket URL; deterministic, so no network call. */
export function publicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${env.supabaseUrl()}/storage/v1/object/public/${BUCKETS.public}/${path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}
