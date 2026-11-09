import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { authorizeReportRequest, isAuthorizationResponse } from '@/lib/report-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authorization = await authorizeReportRequest(request, ['admin', 'inspector']);
  if (isAuthorizationResponse(authorization)) return authorization;

  try {
    const state = request.nextUrl.searchParams.get('state');
    let query = getSupabaseAdmin()
      .from('crack_records')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(500);
    if (state === 'forwarded') {
      query = query.eq('review_state', 'forwarded');
    } else {
      query = query.in('review_state', ['pending', 'reviewed', 'duplicate']);
    }
    if (state && ['pending', 'reviewed', 'duplicate'].includes(state)) {
      query = query.eq('review_state', state);
    }

    const { data, error } = await query;
    if (error) throw error;

    let detections = data ?? [];
    if (state !== 'forwarded' && detections.length) {
      const { data: batchItems, error: batchError } = await getSupabaseAdmin()
        .from('inspection_batch_items')
        .select('crack_id,inspection_batches!inner(review_status,department_note,submitted_at)')
        .in('crack_id', detections.map(detection => detection.id));
      if (batchError) throw batchError;

      type BatchReview = { review_status: string; department_note: string | null; submitted_at: string };
      const latestBatchByCrack = new Map<string, BatchReview>();
      for (const item of batchItems ?? []) {
        const batch = item.inspection_batches[0] as BatchReview | undefined;
        if (!batch) continue;
        const previous = latestBatchByCrack.get(item.crack_id);
        if (!previous || batch.submitted_at > previous.submitted_at) {
          latestBatchByCrack.set(item.crack_id, batch);
        }
      }

      detections = detections.map(detection => {
        const latestBatch = latestBatchByCrack.get(detection.id);
        return latestBatch?.review_status === 'changes_requested'
          ? {
            ...detection,
            return_review_note: latestBatch.department_note,
            return_reviewed_at: latestBatch.submitted_at,
          }
          : detection;
      });
    }

    return NextResponse.json(
      { success: true, data: detections },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (error) {
    console.error('Error loading inspector detections:', error);
    return NextResponse.json({ success: false, error: 'Could not load inspector detections.' }, { status: 500 });
  }
}
