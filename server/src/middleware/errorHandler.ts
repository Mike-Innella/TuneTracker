import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err?.statusCode || err?.status || 500;

  if (err?.type === 'entity.too.large' || status === 413) {
    return res.status(413).json({
      ok: false,
      error: 'Uploaded audio file is too large. Max file size is 80MB.',
    });
  }

  // special case for your custom CORS error
  if (err?.message === 'CORS_BLOCKED') {
    return res.status(status).json({
      ok: false,
      error: 'CORS blocked',
      origin: err?.origin,
    });
  }

  const message =
    status >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err?.message || 'Internal Server Error';

  return res.status(status).json({
    ok: false,
    error: message,
    ...(err?.details ? { details: err.details } : {}),
  });
}
