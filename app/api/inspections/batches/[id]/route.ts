import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { authorizeReportRequest, isAuthorizationResponse } from '@/lib/report-api-auth';

export const dynamic = 'force-dynamic';
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const authorization = await authorizeReportRequest(request, ['admin', 'reviewer']);
  if (isAuthorizationResponse(authorization)) return authorization;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must contain valid JSON.' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null || !('review_status' in body)) {
    return NextResponse.json({ success: false, error: 'Choose reviewed or changes requested.' }, { status: 400 });
  }
  const reviewStatus = body.review_status;
  if (reviewStatus !== 'reviewed' && reviewStatus !== 'changes_requested') {
    return NextResponse.json({ success: false, error: 'Choose reviewed or changes requested.' }, { status: 400 });
  }
  const note = 'department_note' in body ? body.department_note : null;
  if (note !== null && (typeof note !== 'string' || note.trim().length > 2000)) {
    return NextResponse.json({ success: false, error: 'Department note must be at most 2000 characters.' }, { status: 400 });
  }

  try {
    const { id } = await params;
    const { error } = await getSupabaseAdmin().rpc('review_inspection_batch', {
      p_batch_id: id,
      p_review_status: reviewStatus,
      p_department_note: typeof note === 'string' && note.trim() ? note.trim() : null,
      p_reviewed_by: authorization.userId,
    });
    if (error) {
      if (error.message.includes('Batch not found or already reviewed')) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
      }
      throw error;
    }
    return NextResponse.json({ success: true, data: { id, review_status: reviewStatus } });
  } catch (error) {
    console.error('Error reviewing inspection batch:', error);
    return NextResponse.json({ success: false, error: 'Could not save the department review.' }, { status: 500 });
  }
}
