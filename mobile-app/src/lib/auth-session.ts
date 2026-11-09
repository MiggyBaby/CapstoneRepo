import { supabase } from '@/lib/supabase';

type AuthError = {
  code?: string;
  message: string;
  status?: number;
};

type AuthResult = { data: unknown; error: AuthError | null };

function isAuthError(error: AuthError) {
  return error.status === 401
    || error.code === 'PGRST301'
    || /jwt.*expired|invalid jwt|token.*expired/i.test(error.message);
}

export async function refreshAccessToken() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) {
    throw new Error('Your session could not be refreshed. Sign out and sign in again.');
  }
  return data.session.access_token;
}

export async function withAuthRefresh<T extends AuthResult>(
  request: () => PromiseLike<T>,
): Promise<T> {
  const result = await request();
  if (!result.error) return result;
  if (!isAuthError(result.error)) throw result.error;

  await refreshAccessToken();
  const retry = await request();
  if (retry.error) throw retry.error;
  return retry;
}
