import { supabase } from '@/lib/supabase';
import { withAuthRefresh } from '@/lib/auth-session';
import { Crack, CrackStatus, Severity } from '@/types/database';

export const PAGE_SIZE = 25;
type DetectionFilters = { offset?: number; search?: string; severity?: Severity | ''; status?: CrackStatus | ''; crackType?: Crack['crack_type'] | ''; detectedAfter?: string };
export async function fetchDetections({ offset = 0, search = '', severity = '', status = '', crackType = '', detectedAfter }: DetectionFilters = {}) {
  const client = supabase;
  if (!client) throw new Error('Supabase is not configured.');
  const { data } = await withAuthRefresh(() => {
    let query = client.from('crack_records').select('*').order('detected_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
    if (search.trim()) query = query.ilike('location', `%${search.trim()}%`);
    if (severity) query = query.eq('severity', severity);
    if (status) query = query.eq('status', status);
    if (crackType) query = query.eq('crack_type', crackType);
    if (detectedAfter) query = query.gte('detected_at', detectedAfter);
    return query;
  });
  return data ?? [];
}
export async function fetchDetection(id: string) {
  const client = supabase;
  if (!client) throw new Error('Supabase is not configured.');
  const { data } = await withAuthRefresh(() => client.from('crack_records').select('*').eq('id', id).maybeSingle());
  if (!data) throw new Error('Detection not found.');
  return data;
}
export async function fetchMapDetections() {
  const client = supabase;
  if (!client) throw new Error('Supabase is not configured.');
  const { data } = await withAuthRefresh(() => client
    .from('crack_records')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(500));
  return data ?? [];
}
export async function fetchSummary() {
  const client = supabase;
  if (!client) throw new Error('Supabase is not configured.');
  const [records, total, critical, open] = await Promise.all([
    fetchDetections({ offset: 0 }),
    withAuthRefresh(() => client.from('crack_records').select('id', { count: 'exact', head: true })),
    withAuthRefresh(() => client.from('crack_records').select('id', { count: 'exact', head: true }).eq('severity', 'critical')),
    withAuthRefresh(() => client.from('crack_records').select('id', { count: 'exact', head: true }).neq('status', 'resolved')),
  ]);
  return { records, total: total.count ?? 0, critical: critical.count ?? 0, open: open.count ?? 0 };
}
