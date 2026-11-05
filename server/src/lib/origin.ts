/**
 * Public origin of a request. Behind Vercel/Docker/proxies `nextUrl.origin` can be the
 * bind address (e.g. http://0.0.0.0:3000), so prefer the forwarded host/proto headers.
 */
export function requestOrigin(headers: Headers, fallback: string): string {
  const host = headers.get('x-forwarded-host')?.split(',')[0]?.trim() || headers.get('host');
  if (!host || !/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return fallback;
  const proto =
    headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || new URL(fallback).protocol.replace(':', '');
  return `${proto === 'https' ? 'https' : 'http'}://${host}`;
}
