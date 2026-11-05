import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import type { RequestHandler } from 'express';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';

const UPLOADS_ROUTE_BASE = '/api/uploads';
const TRACK_UPLOAD_SUBDIR = 'tracks';
const SUPPORTED_AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/vnd.wave',
]);
const MIME_TO_EXTENSION: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
  'audio/vnd.wave': 'wav',
};
const RAW_BINARY_MIME_TYPE = 'application/octet-stream';
const S3_STORAGE_KEY_PREFIX = normalizeS3KeyPrefix(env.awsS3KeyPrefix);

let s3Client: S3Client | null = null;

function getS3Client() {
  if (s3Client) return s3Client;
  s3Client = new S3Client({
    region: env.awsRegion,
    ...(env.awsS3Endpoint ? { endpoint: env.awsS3Endpoint } : {}),
    forcePathStyle: env.awsS3ForcePathStyle,
  });
  return s3Client;
}

export function getUploadsRootDir() {
  return env.uploadsRootDir;
}

function getTrackUploadsDir() {
  return path.join(getUploadsRootDir(), TRACK_UPLOAD_SUBDIR);
}

function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? (parts[parts.length - 1] ?? '') : '';
}

function normalizeS3KeyPrefix(prefix?: string) {
  const cleaned = (prefix ?? '').trim().replace(/^\/+|\/+$/g, '');
  return cleaned ? `${cleaned}/` : '';
}

function getStorageKey(extension: string) {
  return `${S3_STORAGE_KEY_PREFIX}${TRACK_UPLOAD_SUBDIR}/${randomUUID()}.${extension}`;
}

function isSupportedExtension(ext: string) {
  return ext === 'mp3' || ext === 'wav';
}

function parseAudioDataUrl(audioDataUrl: string) {
  const match = audioDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw Object.assign(new Error('Invalid audio payload format'), { statusCode: 400 });
  }

  const mimeTypeRaw = match[1];
  const base64Data = match[2];
  if (!mimeTypeRaw || !base64Data) {
    throw Object.assign(new Error('Invalid audio payload format'), { statusCode: 400 });
  }
  const mimeType = mimeTypeRaw.toLowerCase();

  if (!SUPPORTED_AUDIO_MIME_TYPES.has(mimeType)) {
    throw Object.assign(new Error('Unsupported audio type. Only MP3 and WAV are allowed.'), {
      statusCode: 400,
    });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch (_err) {
    throw Object.assign(new Error('Invalid base64 audio payload'), { statusCode: 400 });
  }

  if (!buffer.byteLength) {
    throw Object.assign(new Error('Audio file is empty'), { statusCode: 400 });
  }

  return { mimeType, buffer };
}

function resolveAudioExtension(fileName: string, mimeType?: string) {
  const trimmedFileName = fileName.trim();

  if (!trimmedFileName) {
    throw Object.assign(new Error('Audio file name is required'), { statusCode: 400 });
  }

  const extFromName = getFileExtension(trimmedFileName);
  const normalizedMimeType = mimeType?.toLowerCase();

  if (
    normalizedMimeType &&
    normalizedMimeType !== RAW_BINARY_MIME_TYPE &&
    !SUPPORTED_AUDIO_MIME_TYPES.has(normalizedMimeType)
  ) {
    throw Object.assign(new Error('Unsupported audio type. Only MP3 and WAV are allowed.'), {
      statusCode: 400,
    });
  }

  const extFromMime = normalizedMimeType ? MIME_TO_EXTENSION[normalizedMimeType] : undefined;
  const extension = isSupportedExtension(extFromName) ? extFromName : (extFromMime ?? '');

  if (!isSupportedExtension(extension)) {
    throw Object.assign(new Error('Unsupported audio file extension'), { statusCode: 400 });
  }

  return extension;
}

export async function saveTrackAudioBuffer(params: {
  fileName: string;
  buffer: Buffer;
  mimeType?: string;
}) {
  const { fileName, buffer, mimeType } = params;

  if (!buffer.byteLength) {
    throw Object.assign(new Error('Audio file is empty'), { statusCode: 400 });
  }

  const extension = resolveAudioExtension(fileName, mimeType);
  const storageKey = getStorageKey(extension);

  if (env.storageDriver === 's3') {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: env.awsS3Bucket,
        Key: storageKey,
        Body: buffer,
        ...(mimeType ? { ContentType: mimeType } : {}),
      })
    );
    return storageKey;
  }

  const absolutePath = path.join(getUploadsRootDir(), storageKey);

  await fs.mkdir(getTrackUploadsDir(), { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  return storageKey;
}

export async function saveTrackAudioFile(params: { fileName: string; audioDataUrl: string }) {
  const { fileName, audioDataUrl } = params;
  const { mimeType, buffer } = parseAudioDataUrl(audioDataUrl.trim());
  return saveTrackAudioBuffer({ fileName, buffer, mimeType });
}

function toUploadRoutePath(storageKey: string) {
  return storageKey
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function fromUploadRoutePath(uploadPath: string) {
  return uploadPath
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment))
    .join('/');
}

export function resolveTrackAudioUrl(storageKey?: string | null) {
  if (!storageKey?.trim()) return null;
  if (env.storageDriver === 's3' && env.awsS3PublicBaseUrl) {
    const normalizedBase = env.awsS3PublicBaseUrl.replace(/\/+$/, '');
    return `${normalizedBase}/${toUploadRoutePath(storageKey)}`;
  }
  return `${UPLOADS_ROUTE_BASE}/${toUploadRoutePath(storageKey)}`;
}

export function withTrackAudioUrl<T extends { s3ObjectKey?: string | null }>(track: T) {
  return {
    ...track,
    audioUrl: resolveTrackAudioUrl(track.s3ObjectKey),
  };
}

export async function deleteTrackAudioFile(storageKey?: string | null) {
  if (!storageKey?.trim()) return;

  if (env.storageDriver === 's3') {
    try {
      await getS3Client().send(
        new DeleteObjectCommand({
          Bucket: env.awsS3Bucket,
          Key: storageKey,
        })
      );
    } catch (_err) {
      // Ignore remote delete issues to avoid failing track deletes.
    }
    return;
  }

  const uploadsRoot = getUploadsRootDir();
  const absolutePath = path.resolve(uploadsRoot, storageKey);

  if (!absolutePath.startsWith(uploadsRoot)) {
    return;
  }

  try {
    await fs.unlink(absolutePath);
  } catch (_err) {
    // Ignore missing/locked files to avoid failing track deletes.
  }
}

export function createS3AudioProxyHandler(): RequestHandler {
  return async (req, res, next) => {
    try {
      const storageKey = fromUploadRoutePath(req.path);
      if (!storageKey) {
        return res.status(404).json({ ok: false, error: 'Audio file not found' });
      }

      const signedUrl = await getSignedUrl(
        getS3Client(),
        new GetObjectCommand({
          Bucket: env.awsS3Bucket,
          Key: storageKey,
        }),
        { expiresIn: env.awsS3SignedUrlTtlSeconds }
      );

      return res.redirect(302, signedUrl);
    } catch (err) {
      return next(err);
    }
  };
}
