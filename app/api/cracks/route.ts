import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const crackTypes = ['longitudinal', 'transverse', 'alligator', 'edge', 'reflection', 'other'];
const severities = ['low', 'medium', 'high', 'critical'];

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
    const severity = request.nextUrl.searchParams.get('severity');
    const crackType = request.nextUrl.searchParams.get('type');
    const location = request.nextUrl.searchParams.get('location');
    const requestedLimit = Number(request.nextUrl.searchParams.get('limit') || 100);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 100;

    let query = getSupabaseAdmin().from('crack_records').select('*').order('detected_at', { ascending: false });
    if (severity) query = query.eq('severity', severity);
    if (crackType) query = query.eq('crack_type', crackType);
    if (location) query = query.ilike('location', `%${location}%`);
    const { data, error } = await query.limit(limit);
    if (error) throw error;
    const cracks = (data || []).map(toCrack);
    return NextResponse.json({ success: true, data: cracks, count: cracks.length });
  } catch (error) {
    console.error('Error fetching cracks:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch cracks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, coordinates, crackType, severity } = body;
    if (!location || !coordinates || !crackTypes.includes(crackType) || !severities.includes(severity)) {
      return NextResponse.json({ success: false, error: 'Missing or invalid required crack fields' }, { status: 400 });
    }
    if (!Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) {
      return NextResponse.json({ success: false, error: 'Coordinates must contain numeric lat and lng values' }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin().from('cracks').insert({
      location, latitude: coordinates.lat, longitude: coordinates.lng,
      coordinates: `POINT(${coordinates.lng} ${coordinates.lat})`, image_url: body.imageUrl ?? null,
      crack_type: crackType, severity, status: body.status ?? 'new',
      width_mm: body.width ?? null, length_mm: body.length ?? null, depth_mm: body.depth ?? null,
      description: body.description ?? null, detected_at: body.detectedAt ?? new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data: toCrack(data), message: 'Crack created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating crack:', error);
    return NextResponse.json({ success: false, error: 'Failed to create crack' }, { status: 500 });
  }
}
