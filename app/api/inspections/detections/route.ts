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
      .in('review_state', ['pending', 'reviewed', 'duplicate'])
      .order('detected_at', { ascending: false })
      .limit(500);
    if (state && ['pending', 'reviewed', 'duplicate'].includes(state)) {
      query = query.eq('review_state', state);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error('Error loading inspector detections:', error);
    return NextResponse.json({ success: false, error: 'Could not load inspector detections.' }, { status: 500 });
  }
}
