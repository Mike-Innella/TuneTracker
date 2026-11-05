import type { NextRequest } from 'next/server';
import { refreshSession } from '@tunetracker/backend/proxy';

export function proxy(request: NextRequest) {
  return refreshSession(request);
}

export const config = {
  // Skip static assets, images and the health check.
  matcher: [
    '/((?!_next/static|_next/image|branding|favicon.ico|icon|apple-icon|opengraph-image|api/health|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)',
  ],
};
