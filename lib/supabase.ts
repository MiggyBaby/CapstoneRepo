import { createClient } from '@supabase/supabase-js';

/** Browser-safe client for future client-side auth or realtime features. */
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Supabase browser environment variables are not configured.');
  return createClient(url, anonKey);
}
