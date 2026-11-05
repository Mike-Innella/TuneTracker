import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { prisma } from './lib/prisma';
import { env } from './lib/env';
import { createS3AudioProxyHandler, getUploadsRootDir } from './lib/trackAudio';
import apiRouter from './routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// If you run behind a proxy (Vercel/Render/Nginx), this ensures rateLimit + secure cookies behave
app.set('trust proxy', 1);

// Security + observability
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
app.use(express.json({ limit: '150mb' }));

// CORS (strict allowlist, supports credentials)
const normalizeOrigin = (origin: string) => origin.replace(/\/+$/, '');
const allowedOrigins = new Set(
  env.clientOrigin
    .split(',')
    .map((o) => normalizeOrigin(o.trim()))
    .filter(Boolean)
);

app.use(
  '/api',
  cors((req, callback) => {
    const originHeader = req.headers.origin;
    const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
    if (!origin) {
      return callback(null, {
        origin: true,
        credentials: true,
      });
    }

    const normalized = normalizeOrigin(origin);
    const hostHeader = req.headers.host;
    const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
    const forwardedProtoHeader = req.headers['x-forwarded-proto'];
    const forwardedProto = Array.isArray(forwardedProtoHeader)
      ? forwardedProtoHeader[0]
      : forwardedProtoHeader;
    const protocol = ((forwardedProto ?? 'http').split(',')[0] ?? 'http').trim();
    let isSameServiceOrigin = false;
    if (host) {
      try {
        const originUrl = new URL(normalized);
        const [requestHostname, requestPortRaw] = host.split(':');
        const requestPort = requestPortRaw ?? (protocol === 'https' ? '443' : '80');
        const originPort =
          originUrl.port || (originUrl.protocol === 'https:' ? '443' : '80');
        isSameServiceOrigin =
          originUrl.hostname === requestHostname && originPort === requestPort;
      } catch {
        isSameServiceOrigin = false;
      }
    }

    if (allowedOrigins.has(normalized) || isSameServiceOrigin) {
      return callback(null, {
        origin: true,
        credentials: true,
      });
    }

    // CORS middleware uses "Error" path; we translate to 403 in the error handler below
    return callback(
      Object.assign(new Error('CORS_BLOCKED'), { statusCode: 403, origin })
    );
  })
);

// Rate limit (apply to API routes; adjust path as you add routers)
const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Health (no DB)
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Health (DB)
app.get('/api/health/db', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ ok: true });
  } catch (err: any) {
    return next(
      Object.assign(err, {
        statusCode: 500,
        message: err?.message ?? 'DB connection failed',
      })
    );
  }
});

// API Router
app.use('/api', apiRouter);

// Serve uploaded track audio files from local disk or S3.
if (env.storageDriver === 's3') {
  app.use('/api/uploads', createS3AudioProxyHandler());
} else {
  const uploadsRootDir = getUploadsRootDir();
  fs.mkdirSync(uploadsRootDir, { recursive: true });
  app.use('/api/uploads', express.static(uploadsRootDir));
}

// Avoid noisy browser favicon 404s when hitting backend URLs directly
app.get('/favicon.ico', (_req, res) => res.status(204).end());

const clientBuildDir = path.resolve(__dirname, '../public');
const clientIndexFile = path.join(clientBuildDir, 'index.html');

app.use(express.static(clientBuildDir));

app.get(/^\/(?!api(?:\/|$)).*/, (_req, res, next) => {
  return res.sendFile(clientIndexFile, (err) => {
    if (err) return next();
    return undefined;
  });
});

// 404 + centralized error handling
app.use(notFound);
app.use(errorHandler);

export default app;
