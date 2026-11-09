import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { SUPPORTED_CRACK_TYPES } from '@/lib/crack-types';

export const dynamic = 'force-dynamic';

function toCrack(record: any) {
  return {
    id: record.id, location: record.location,
    coordinates: { lat: record.latitude, lng: record.longitude },
    imageUrl: record.image_url, crackType: record.crack_type, severity: record.severity,
    status: record.status, width: record.width_mm, length: record.length_mm,
    depth: record.depth_mm, description: record.description, assignedTo: record.assigned_to,
    detectedAt: record.detected_at, resolvedAt: record.resolved_at,
    createdAt: record.created_at, updatedAt: record.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !supabaseSecretKey) {
      console.error('Crack API is not configured: Supabase URL or service key is missing.');
      return NextResponse.json({ success: false, error: 'Detection records are temporarily unavailable.' }, { status: 500 });
    }

    const severity = request.nextUrl.searchParams.get('severity');
    const crackType = request.nextUrl.searchParams.get('type');
    const location = request.nextUrl.searchParams.get('location');
    const requestedLimit = Number(request.nextUrl.searchParams.get('limit') || 100);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 100;
    const requestedOffset = Number(request.nextUrl.searchParams.get('offset') || 0);
    const offset = Number.isSafeInteger(requestedOffset) ? Math.max(requestedOffset, 0) : 0;

    let query = getSupabaseAdmin().from('crack_records').select('*').order('detected_at', { ascending: false }).order('id', { ascending: true });
    if (severity) query = query.eq('severity', severity);
    if (crackType) {
      if (!SUPPORTED_CRACK_TYPES.includes(crackType as typeof SUPPORTED_CRACK_TYPES[number])) {
        return NextResponse.json({ success: false, error: 'Select a valid DPWH crack type.' }, { status: 400 });
      }
      query = query.eq('crack_type', crackType);
    } else {
      query = query.in('crack_type', SUPPORTED_CRACK_TYPES);
    }
    if (location) query = query.ilike('location', `%${location}%`);
    const { data, error } = await query.range(offset, offset + limit - 1);
    if (error) throw error;
    const cracks = (data || []).map(toCrack);
    return NextResponse.json({ success: true, data: cracks, count: cracks.length });
  } catch (error) {
    console.error('Error fetching cracks:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch cracks' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Unauthenticated detection uploads are disabled. Use POST /api/device/detections with a device bearer token.' },
    { status: 410 },
  );
}
