import { NextResponse, type NextRequest } from 'next/server';
import { requestOrigin, supabaseServer } from '@tunetracker/backend';

/** Ends the session and explains why (used for suspended accounts). */
export async function GET(request: NextRequest) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  const origin = requestOrigin(request.headers, request.nextUrl.origin);
  const reason = request.nextUrl.searchParams.get('reason') === 'suspended' ? '?error=suspended' : '';
  return NextResponse.redirect(new URL(`/login${reason}`, origin));
}
