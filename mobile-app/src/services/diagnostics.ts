import { configError, supabase } from '@/lib/supabase';

export type DiagnosticRecord = Pick<
  import('@/types/database').Crack,
  'location' | 'crack_type' | 'severity' | 'status' | 'detected_at'
>;

export type ConnectionDiagnostic = {
  configured: boolean;
  serverResponded: boolean | null;
  querySucceeded: boolean | null;
  retrieved: number;
  totalRows: number | null;
  sample: DiagnosticRecord[];
  error: string | null;
};

export async function runConnectionDiagnostic(): Promise<ConnectionDiagnostic> {
  if (!supabase || configError) {
    return { configured: false, serverResponded: null, querySucceeded: null, retrieved: 0, totalRows: null, sample: [], error: configError };
  }

  try {
    const { data, error, count } = await supabase
      .from('crack_records')
      .select('location,crack_type,severity,status,detected_at', { count: 'exact' })
      .order('detected_at', { ascending: false })
      .limit(5);
    if (error) {
      return { configured: true, serverResponded: true, querySucceeded: false, retrieved: 0, totalRows: null, sample: [], error: `${error.message}${error.code ? ` (${error.code})` : ''}` };
    }
    const sample = data ?? [];
    return { configured: true, serverResponded: true, querySucceeded: true, retrieved: sample.length, totalRows: count, sample, error: null };
  } catch (cause) {
    return { configured: true, serverResponded: false, querySucceeded: false, retrieved: 0, totalRows: null, sample: [], error: cause instanceof Error ? cause.message : 'Network request failed.' };
  }
}
