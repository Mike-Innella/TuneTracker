import path from 'path';

function readEnv(name: string) {
  return process.env[name]?.trim() ?? '';
}

function readBoolean(name: string, fallback: boolean) {
  const value = readEnv(name).toLowerCase();
  if (!value) return fallback;
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function readNumber(name: string, fallback: number) {
  const value = Number(readEnv(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const storageDriver = (readEnv('STORAGE_DRIVER') || 'local').toLowerCase();
if (storageDriver !== 'local' && storageDriver !== 's3') {
  throw new Error('STORAGE_DRIVER must be either "local" or "s3"');
}

const awsRegion = readEnv('AWS_REGION');
const awsS3Bucket = readEnv('AWS_S3_BUCKET');
const awsS3Endpoint = readEnv('AWS_S3_ENDPOINT');
const awsS3PublicBaseUrl = readEnv('AWS_S3_PUBLIC_BASE_URL');
const awsS3KeyPrefix = readEnv('AWS_S3_KEY_PREFIX');
const awsS3SignedUrlTtlSeconds = readNumber('AWS_S3_SIGNED_URL_TTL_SECONDS', 300);
const awsS3ForcePathStyle = readBoolean('AWS_S3_FORCE_PATH_STYLE', false);

if (storageDriver === 's3') {
  if (!awsRegion) {
    throw new Error('AWS_REGION is required when STORAGE_DRIVER=s3');
  }
  if (!awsS3Bucket) {
    throw new Error('AWS_S3_BUCKET is required when STORAGE_DRIVER=s3');
  }
}

export const env = {
  port: readNumber('PORT', 4000),
  clientOrigin: readEnv('CLIENT_ORIGIN') || 'http://localhost:5173',
  sessionCookieSecure: readBoolean('SESSION_COOKIE_SECURE', process.env.NODE_ENV === 'production'),
  uploadsRootDir: readEnv('UPLOADS_DIR') || path.resolve(__dirname, '../../uploads'),
  storageDriver,
  awsRegion,
  awsS3Bucket,
  awsS3Endpoint,
  awsS3PublicBaseUrl,
  awsS3KeyPrefix,
  awsS3SignedUrlTtlSeconds,
  awsS3ForcePathStyle,
};
