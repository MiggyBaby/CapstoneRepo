import { supabase } from '@/lib/supabase';
import { Crack, CrackStatus, Severity } from '@/types/database';

export const PAGE_SIZE = 25;
type DetectionFilters = { offset?: number; search?: string; severity?: Severity | ''; status?: CrackStatus | ''; crackType?: Crack['crack_type'] | ''; detectedAfter?: string };
export async function fetchDetections({ offset = 0, search = '', severity = '', status = '', crackType = '', detectedAfter }: DetectionFilters = {}) {
  if (!supabase) throw new Error('Supabase is not configured.');
  let query = supabase.from('crack_records').select('*').order('detected_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
  if (search.trim()) query = query.ilike('location', `%${search.trim()}%`);
  if (severity) query = query.eq('severity', severity);
  if (status) query = query.eq('status', status);
  if (crackType) query = query.eq('crack_type', crackType);
  if (detectedAfter) query = query.gte('detected_at', detectedAfter);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
export async function fetchDetection(id: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('crack_records').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Detection not found.');
  return data;
}
export async function fetchMapDetections() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('crack_records')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}
export async function fetchSummary() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const [records, total, critical, open] = await Promise.all([
    fetchDetections({ offset: 0 }),
    supabase.from('crack_records').select('id', { count: 'exact', head: true }),
    supabase.from('crack_records').select('id', { count: 'exact', head: true }).eq('severity', 'critical'),
    supabase.from('crack_records').select('id', { count: 'exact', head: true }).neq('status', 'resolved'),
  ]);
  if (total.error) throw total.error;
  if (critical.error) throw critical.error;
  if (open.error) throw open.error;
  return { records, total: total.count ?? 0, critical: critical.count ?? 0, open: open.count ?? 0 };
}
