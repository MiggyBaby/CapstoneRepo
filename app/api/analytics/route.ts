import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Prevent Next.js from attempting a database request while building.
export const dynamic = 'force-dynamic';

const types = ['longitudinal', 'transverse', 'alligator', 'edge', 'reflection', 'other'];
const statuses = ['new', 'assigned', 'in-progress', 'resolved'];

export async function GET() {
  try {
    const { data: cracks, error } = await getSupabaseAdmin().from('crack_records').select('severity, status, crack_type');
    if (error) throw error;
    const records = cracks || [];
    const count = (field: string, value: string) => records.filter((record: any) => record[field] === value).length;
    return NextResponse.json({ success: true, data: {
      totalCracks: records.length,
      criticalCracks: count('severity', 'critical'), highCracks: count('severity', 'high'),
      mediumCracks: count('severity', 'medium'), lowCracks: count('severity', 'low'),
      resolvedCracks: count('status', 'resolved'), inProgressCracks: count('status', 'in-progress'),
      cracksByType: Object.fromEntries(types.map((type) => [type, count('crack_type', type)])),
      cracksByStatus: Object.fromEntries(statuses.map((status) => [status, count('status', status)])),
      timestamp: new Date().toISOString(),
    } });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
