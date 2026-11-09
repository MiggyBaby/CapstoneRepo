import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { authorizeReportRequest, isAuthorizationResponse } from '@/lib/report-api-auth';
import { SUPPORTED_CRACK_TYPES } from '@/lib/crack-types';
import type { Crack } from '@/lib/types';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };
type CrackStatus = Crack['status'];
type Severity = Crack['severity'];
const statuses: CrackStatus[] = ['new', 'assigned', 'in-progress', 'resolved'];
const severities: Severity[] = ['low', 'medium', 'high', 'critical'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const authorization = await authorizeReportRequest(request, ['admin', 'inspector']);
  if (isAuthorizationResponse(authorization)) return authorization;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must contain valid JSON.' }, { status: 400 });
  }
  if (!isObject(body)) {
    return NextResponse.json({ success: false, error: 'Request body must be a JSON object.' }, { status: 400 });
  }

  const action = body.action;
  if (!['mark_reviewed', 'mark_pending', 'mark_duplicate'].includes(String(action))) {
    return NextResponse.json({ success: false, error: 'Select a valid inspection action.' }, { status: 400 });
  }
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ('location' in body) {
    if (typeof body.location !== 'string' || !body.location.trim() || body.location.trim().length > 500) {
      return NextResponse.json({ success: false, error: 'Location is required and must be at most 500 characters.' }, { status: 400 });
    }
    updates.location = body.location.trim();
  }
  if ('coordinates' in body) {
    if (!isObject(body.coordinates)) {
      return NextResponse.json({ success: false, error: 'Coordinates must contain numeric lat and lng values.' }, { status: 400 });
    }
    const { lat, lng } = body.coordinates;
    if (
      typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90
      || typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180
    ) {
      return NextResponse.json({ success: false, error: 'Coordinates must be valid latitude and longitude values.' }, { status: 400 });
    }
    updates.latitude = lat;
    updates.longitude = lng;
    updates.coordinates = `POINT(${lng} ${lat})`;
  }
  if ('crack_type' in body) {
    if (typeof body.crack_type !== 'string' || !SUPPORTED_CRACK_TYPES.includes(body.crack_type as typeof SUPPORTED_CRACK_TYPES[number])) {
      return NextResponse.json({ success: false, error: 'Select a valid road defect type.' }, { status: 400 });
    }
    updates.crack_type = body.crack_type;
  }
  if ('severity' in body) {
    if (typeof body.severity !== 'string' || !severities.includes(body.severity as Severity)) {
      return NextResponse.json({ success: false, error: 'Select a valid severity.' }, { status: 400 });
    }
    updates.severity = body.severity;
  }
  for (const [field, column] of [['width_mm', 'width_mm'], ['length_mm', 'length_mm'], ['depth_mm', 'depth_mm']] as const) {
    if (field in body) {
      const value = body[field];
      if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
        return NextResponse.json({ success: false, error: `${field} must be a non-negative number or null.` }, { status: 400 });
      }
      updates[column] = value;
    }
  }
  if ('image_url' in body) {
    const url = body.image_url;
    if (url !== null && typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'Evidence image URL must be an HTTPS URL or null.' }, { status: 400 });
    }
    if (typeof url === 'string') {
      try {
        if (url.length > 2048 || new URL(url).protocol !== 'https:') throw new Error();
      } catch {
        return NextResponse.json({ success: false, error: 'Evidence image URL must be a valid HTTPS URL.' }, { status: 400 });
      }
    }
    updates.image_url = url;
  }
  if ('status' in body) {
    if (typeof body.status !== 'string' || !statuses.includes(body.status as CrackStatus)) {
      return NextResponse.json({ success: false, error: 'Select a valid workflow status.' }, { status: 400 });
    }
    updates.status = body.status;
    updates.resolved_at = body.status === 'resolved' ? new Date().toISOString() : null;
  }

  const reviewState = action === 'mark_reviewed' ? 'reviewed' : action === 'mark_pending' ? 'pending' : 'duplicate';
  updates.review_state = reviewState;
  updates.reviewed_by = reviewState === 'reviewed' ? authorization.userId : null;
  updates.reviewed_at = reviewState === 'reviewed' ? new Date().toISOString() : null;

  if (reviewState === 'duplicate') {
    const duplicateOfId = body.duplicateOfId;
    if (typeof duplicateOfId !== 'string') {
      return NextResponse.json({ success: false, error: 'Select the original detection this record duplicates.' }, { status: 400 });
    }
    updates.duplicate_of_id = duplicateOfId;
  } else {
    updates.duplicate_of_id = null;
  }

  try {
    const { id } = await params;
    if (reviewState === 'duplicate') {
      if (body.duplicateOfId === id) {
        return NextResponse.json({ success: false, error: 'A detection cannot be marked as a duplicate of itself.' }, { status: 400 });
      }
      const { data: original, error: originalError } = await getSupabaseAdmin()
        .from('cracks')
        .select('id,review_state')
        .eq('id', body.duplicateOfId as string)
        .maybeSingle();
      if (originalError) throw originalError;
      if (!original || original.review_state === 'duplicate') {
        return NextResponse.json({ success: false, error: 'Choose an existing non-duplicate detection as the original.' }, { status: 400 });
      }
    }

    const { data, error } = await getSupabaseAdmin()
      .from('cracks')
      .update(updates)
      .eq('id', id)
      .neq('review_state', 'forwarded')
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, error: 'Detection not found or already forwarded.' }, { status: 404 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating inspection detection:', error);
    return NextResponse.json({ success: false, error: 'Could not save inspection changes.' }, { status: 500 });
  }
}
