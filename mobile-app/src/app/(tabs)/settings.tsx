import React from 'react';
import { Text } from 'react-native';
import { Action, Heading, Page, Panel, s } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';

export default function Settings() {
  const { session } = useAuth();
  return <Page><Heading title="Settings" subtitle="Account and synchronization" /><Panel><Text style={s.sectionTitle}>Signed in</Text><Text style={s.muted}>{session?.user.email ?? 'No email available'}</Text><Text style={s.muted}>Use refresh to fetch current records. Realtime has not been enabled because the target project&apos;s publication and access policies are unverified.</Text></Panel><Panel><Text style={s.sectionTitle}>Data status</Text><Text style={s.muted}>AI classifications shown here are model predictions. The existing schema has no confidence score or separate human assessment fields.</Text></Panel><Action title="Run read-only connection diagnostic" secondary onPress={() => router.push('/diagnostics')} /><Action title="Sign out" onPress={() => { void supabase?.auth.signOut().then(() => router.replace('/login')); }} /></Page>;
}
