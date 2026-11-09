import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { authorizeReportRequest, isAuthorizationResponse } from '@/lib/report-api-auth';
import type { Crack } from '@/lib/types';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };
type CrackStatus = Crack['status'];
const statuses: CrackStatus[] = ['new', 'assigned', 'in-progress', 'resolved'];

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const authorization = await authorizeReportRequest(request, ['admin', 'inspector']);
  if (isAuthorizationResponse(authorization)) return authorization;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must contain valid JSON.' }, { status: 400 });
  }
  if (
    typeof body !== 'object'
    || body === null
    || !('status' in body)
    || typeof body.status !== 'string'
    || !statuses.includes(body.status as CrackStatus)
  ) {
    return NextResponse.json({ success: false, error: 'Select a valid detection status.' }, { status: 400 });
  }

  try {
    const { id } = await params;
    const status = body.status as CrackStatus;
    const now = new Date().toISOString();
    const { data, error } = await getSupabaseAdmin()
      .from('cracks')
      .update({
        status,
        resolved_at: status === 'resolved' ? now : null,
        updated_at: now,
      })
      .eq('id', id)
      .neq('review_state', 'forwarded')
      .select('id,status,resolved_at,updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, error: 'Detection not found.' }, { status: 404 });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating detection status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update detection status.' }, { status: 500 });
  }
}
