import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { SUPPORTED_CRACK_TYPES } from '@/lib/crack-types';

// Prevent Next.js from attempting a database request while building.
export const dynamic = 'force-dynamic';

const statuses = ['new', 'assigned', 'in-progress', 'resolved'];

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !supabaseSecretKey) {
      console.error('Analytics API is not configured: Supabase URL or service key is missing.');
      return NextResponse.json({ success: false, error: 'Analytics are temporarily unavailable.' }, { status: 500 });
    }

    const records: Array<{
      severity: string;
      status: string;
      crack_type: string;
      detected_at: string;
      resolved_at: string | null;
      image_url: string | null;
    }> = [];
    const pageSize = 1000;
    const supabase = getSupabaseAdmin();
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from('crack_records')
        .select('severity, status, crack_type, detected_at, resolved_at, image_url')
        .in('crack_type', SUPPORTED_CRACK_TYPES)
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      records.push(...(data ?? []));
      if (!data || data.length < pageSize) break;
    }
    const count = (field: 'severity' | 'status' | 'crack_type', value: string) => records.filter((record) => record[field] === value).length;
    const resolvedRecords = records.filter(record => record.status === 'resolved' && record.resolved_at);
    const resolutionHours = resolvedRecords
      .map(record => (new Date(record.resolved_at!).getTime() - new Date(record.detected_at).getTime()) / 3600000)
      .filter(hours => Number.isFinite(hours) && hours >= 0);
    const now = new Date();
    const weeklyTrend = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (6 - index)));
      const dateKey = date.toISOString().slice(0, 10);
      return {
        date: dateKey,
        day: new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(date),
        count: records.filter(record => record.detected_at.slice(0, 10) === dateKey).length,
      };
    });
    return NextResponse.json({ success: true, data: {
      totalCracks: records.length,
      criticalCracks: count('severity', 'critical'), highCracks: count('severity', 'high'),
      mediumCracks: count('severity', 'medium'), lowCracks: count('severity', 'low'),
      resolvedCracks: count('status', 'resolved'), inProgressCracks: count('status', 'in-progress'),
      openCracks: records.filter(record => record.status !== 'resolved').length,
      averageResolutionHours: resolutionHours.length
        ? resolutionHours.reduce((sum, hours) => sum + hours, 0) / resolutionHours.length
        : null,
      evidenceCracks: records.filter(record => record.image_url).length,
      weeklyTrend,
      cracksByType: Object.fromEntries(SUPPORTED_CRACK_TYPES.map((type) => [type, count('crack_type', type)])),
      cracksByStatus: Object.fromEntries(statuses.map((status) => [status, count('status', status)])),
      timestamp: new Date().toISOString(),
    } });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
