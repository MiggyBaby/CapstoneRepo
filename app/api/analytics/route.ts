import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Prevent Next.js from attempting a database request while building.
export const dynamic = 'force-dynamic';

const types = ['longitudinal', 'transverse', 'alligator', 'edge', 'reflection', 'other'];
const statuses = ['new', 'assigned', 'in-progress', 'resolved'];

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !supabaseSecretKey) {
      return NextResponse.json({ success: true, data: {
        totalCracks: 0,
        criticalCracks: 0, highCracks: 0,
        mediumCracks: 0, lowCracks: 0,
        resolvedCracks: 0, inProgressCracks: 0,
        cracksByType: Object.fromEntries(types.map((type) => [type, 0])),
        cracksByStatus: Object.fromEntries(statuses.map((status) => [status, 0])),
        timestamp: new Date().toISOString(),
      } });
    }

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
