import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Page, Heading, Panel, Action, Problem, C, s } from '@/components/ui';
import { configError, supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit() { if (!supabase) { setError(configError ?? 'Supabase is not configured.'); return; } setBusy(true); setError(''); const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); setBusy(false); if (authError) setError(authError.message); else router.replace('/(tabs)'); }
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Page><Heading title="Road Watch" subtitle="Sign in to review shared inspection records." />{configError ? <Problem message={configError} /> : null}<Panel><Text style={s.sectionTitle}>Authorized access</Text><TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Work email" value={email} onChangeText={setEmail} style={s.input} /><TextInput secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} style={s.input} />{error ? <Text style={{ color: C.red }}>{error}</Text> : null}<Action title={busy ? 'Signing in…' : 'Sign in'} onPress={() => void submit()} /></Panel><View><Text style={s.muted}>Use an account configured in the existing Supabase project.</Text><Link href="/diagnostics" style={{ color: C.blue, marginTop: 12 }}>Run read-only connection diagnostic</Link></View></Page></KeyboardAvoidingView>;
}
