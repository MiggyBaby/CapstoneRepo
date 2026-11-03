import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type AuthState = { session: Session | null; loading: boolean };
const Context = createContext<AuthState>({ session: null, loading: true });
export const useAuth = () => useContext(Context);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setLoading(false); });
    return () => subscription.unsubscribe();
  }, []);
  return <Context.Provider value={{ session, loading }}>{children}</Context.Provider>;
}
