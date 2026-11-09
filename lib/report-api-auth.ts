import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export type WebsiteRole = 'admin' | 'inspector' | 'worker' | 'viewer' | 'reviewer';

const knownRoles = new Set<WebsiteRole>(['admin', 'inspector', 'worker', 'viewer', 'reviewer']);

/** Verify the caller's JWT with Supabase Auth before allowing service-role access. */
export async function authorizeReportRequest(
  request: NextRequest,
  allowedRoles: readonly WebsiteRole[],
): Promise<{ userId: string; role: WebsiteRole } | NextResponse> {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return NextResponse.json({ success: false, error: 'Sign in to continue.' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.error('Report API auth is not configured: Supabase URL or publishable key is missing.');
    return NextResponse.json({ success: false, error: 'Authentication is temporarily unavailable.' }, { status: 500 });
  }

  const authClient = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await authClient.auth.getUser(match[1]);
  if (error || !data.user) return NextResponse.json({ success: false, error: 'Your session is invalid or expired.' }, { status: 401 });

  const role = data.user.app_metadata.role;
  if (typeof role !== 'string' || !knownRoles.has(role as WebsiteRole)) {
    return NextResponse.json({ success: false, error: 'Your account is not authorized for report management.' }, { status: 403 });
  }
  if (!allowedRoles.includes(role as WebsiteRole)) {
    return NextResponse.json({ success: false, error: 'You do not have permission to perform this action.' }, { status: 403 });
  }

  return { userId: data.user.id, role: role as WebsiteRole };
}

export function isAuthorizationResponse(
  result: { userId: string; role: WebsiteRole } | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}
