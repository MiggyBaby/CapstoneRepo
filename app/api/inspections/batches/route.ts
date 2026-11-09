import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { authorizeReportRequest, isAuthorizationResponse } from '@/lib/report-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authorization = await authorizeReportRequest(request, ['admin', 'inspector', 'worker', 'viewer', 'reviewer']);
  if (isAuthorizationResponse(authorization)) return authorization;

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('inspection_batches')
      .select('id,submitted_by,submitted_at,review_status,department_note,reviewed_by,reviewed_at,inspection_batch_items(crack_id,crack_snapshot,crack_review_notes_snapshot,cracks(id,location,latitude,longitude,image_url,crack_type,severity,status,width_mm,length_mm,depth_mm,description,detected_at,source_device_id,review_state,crack_review_notes(id,author_id,note,created_at)))')
      .order('submitted_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    const batches = (data ?? []).map(batch => ({
      ...batch,
      inspection_batch_items: batch.inspection_batch_items.map(item => ({
        ...item,
        cracks: item.crack_snapshot
          ? {
            ...item.crack_snapshot,
            crack_review_notes: item.crack_review_notes_snapshot,
          }
          : item.cracks,
      })),
    }));
    return NextResponse.json({ success: true, data: batches });
  } catch (error) {
    console.error('Error loading forwarded inspection batches:', error);
    return NextResponse.json({ success: false, error: 'Could not load forwarded inspections.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    || !('crackIds' in body)
    || !Array.isArray(body.crackIds)
    || body.crackIds.length === 0
    || body.crackIds.length > 500
    || body.crackIds.some((id) => typeof id !== 'string')
  ) {
    return NextResponse.json({ success: false, error: 'Select between 1 and 500 reviewed detections.' }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .rpc('forward_inspection_batch', {
        p_crack_ids: body.crackIds,
        p_submitted_by: authorization.userId,
      });
    if (error) {
      if (error.message.includes('reviewed') || error.message.includes('Duplicate detection IDs')) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
      }
      throw error;
    }
    return NextResponse.json({ success: true, data: { id: data } }, { status: 201 });
  } catch (error) {
    console.error('Error forwarding inspection batch:', error);
    return NextResponse.json({ success: false, error: 'Could not forward the inspection batch.' }, { status: 500 });
  }
}
