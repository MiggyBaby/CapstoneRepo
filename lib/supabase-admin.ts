import { createClient } from '@supabase/supabase-js';

/** Server-only client. Never import this from a client component. */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase is not configured. Add its URL and secret key to .env.local.');
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
