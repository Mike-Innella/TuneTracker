export const dynamic = 'force-dynamic';

/** Liveness probe for Docker/CI; deliberately touches no external service. */
export function GET() {
  return Response.json({ ok: true, service: 'tunetracker', time: new Date().toISOString() });
}
