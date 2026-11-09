import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { error } = await getSupabaseAdmin()
      .from('cracks')
      .select('id', { head: true, count: 'exact' });
    if (error) throw error;
    return NextResponse.json({
      success: true,
      status: 'operational',
      message: 'API and database are connected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    console.error('Health check could not reach Supabase:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'down',
        message: 'API is running but the database connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
