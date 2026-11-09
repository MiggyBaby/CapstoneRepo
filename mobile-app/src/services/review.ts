import { configError, supabase } from '@/lib/supabase';
import type { CrackStatus } from '@/types/database';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

export type StatusUpdate = {
  status: CrackStatus;
  resolved_at: string | null;
  updated_at: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function updateDetectionStatus(id: string, status: CrackStatus): Promise<StatusUpdate> {
  if (!supabase) throw new Error(configError ?? 'Supabase is not configured.');
  if (!API_URL) throw new Error('Set EXPO_PUBLIC_API_URL in mobile-app/.env to your website API base URL.');

  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error('Unable to verify your sign-in session. Please sign in again.');
  if (!data.session) throw new Error('Sign in before updating a detection.');

  const response = await fetch(`${API_URL}/cracks/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The website API returned an invalid response.');
  }
  if (!isObject(payload)) throw new Error('The website API returned an invalid response.');
  if (!response.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Could not update detection status.');
  }
  if (!isObject(payload.data)) throw new Error('The website API response is missing the updated status.');

  const updated = payload.data;
  if (
    typeof updated.status !== 'string'
    || !['new', 'assigned', 'in-progress', 'resolved'].includes(updated.status)
    || (updated.resolved_at !== null && typeof updated.resolved_at !== 'string')
    || typeof updated.updated_at !== 'string'
  ) {
    throw new Error('The website API returned invalid detection status data.');
  }

  return {
    status: updated.status as CrackStatus,
    resolved_at: updated.resolved_at,
    updated_at: updated.updated_at,
  };
}
