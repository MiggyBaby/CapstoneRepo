import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

interface Params { id: string }

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

export async function GET(_: NextRequest, { params }: { params: Params }) {
  try {
    const { data, error } = await getSupabaseAdmin().from('crack_records').select('*').eq('id', params.id).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, error: 'Crack not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: toCrack(data) });
  } catch (error) {
    console.error('Error fetching crack:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch crack' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const fields: Record<string, string> = {
      location: 'location', imageUrl: 'image_url', crackType: 'crack_type', severity: 'severity',
      status: 'status', width: 'width_mm', length: 'length_mm', depth: 'depth_mm',
      description: 'description', assignedTo: 'assigned_to', detectedAt: 'detected_at', resolvedAt: 'resolved_at',
    };
    for (const [source, target] of Object.entries(fields)) if (source in body) updates[target] = body[source];
    if (body.coordinates) {
      const { lat, lng } = body.coordinates;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ success: false, error: 'Coordinates must contain numeric lat and lng values' }, { status: 400 });
      updates.latitude = lat; updates.longitude = lng; updates.coordinates = `POINT(${lng} ${lat})`;
    }
    const { data, error } = await getSupabaseAdmin().from('cracks').update(updates).eq('id', params.id).select().maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, error: 'Crack not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: toCrack(data), message: 'Crack updated successfully' });
  } catch (error) {
    console.error('Error updating crack:', error);
    return NextResponse.json({ success: false, error: 'Failed to update crack' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Params }) {
  try {
    const { error, count } = await getSupabaseAdmin().from('cracks').delete({ count: 'exact' }).eq('id', params.id);
    if (error) throw error;
    if (!count) return NextResponse.json({ success: false, error: 'Crack not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Crack deleted successfully' });
  } catch (error) {
    console.error('Error deleting crack:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete crack' }, { status: 500 });
  }
}
