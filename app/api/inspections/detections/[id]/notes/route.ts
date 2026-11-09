import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { authorizeReportRequest, isAuthorizationResponse } from '@/lib/report-api-auth';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const authorization = await authorizeReportRequest(request, ['admin', 'inspector']);
  if (isAuthorizationResponse(authorization)) return authorization;

  try {
    const { id } = await params;
    const { data, error } = await getSupabaseAdmin()
      .from('crack_review_notes')
      .select('id,crack_id,author_id,note,created_at')
      .eq('crack_id', id)
      .order('created_at', { ascending: true })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error('Error loading inspector notes:', error);
    return NextResponse.json({ success: false, error: 'Could not load inspector notes.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
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
    || !('note' in body)
    || typeof body.note !== 'string'
    || !body.note.trim()
    || body.note.trim().length > 2000
  ) {
    return NextResponse.json({ success: false, error: 'Note is required and must be at most 2000 characters.' }, { status: 400 });
  }

  try {
    const { id } = await params;
    const { data: crack, error: crackError } = await getSupabaseAdmin()
      .from('cracks')
      .select('id,review_state')
      .eq('id', id)
      .maybeSingle();
    if (crackError) throw crackError;
    if (!crack) return NextResponse.json({ success: false, error: 'Detection not found.' }, { status: 404 });
    if (crack.review_state === 'forwarded') {
      return NextResponse.json({ success: false, error: 'Forwarded inspection records are read-only.' }, { status: 409 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from('crack_review_notes')
      .insert({ crack_id: id, author_id: authorization.userId, note: body.note.trim() })
      .select('id,crack_id,author_id,note,created_at')
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error saving inspector note:', error);
    return NextResponse.json({ success: false, error: 'Could not save inspector note.' }, { status: 500 });
  }
}
