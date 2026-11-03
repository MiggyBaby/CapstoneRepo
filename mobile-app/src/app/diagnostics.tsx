import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { Action, Busy, Heading, Page, Panel, Problem, s } from '@/components/ui';
import { ConnectionDiagnostic, runConnectionDiagnostic } from '@/services/diagnostics';

export default function Diagnostics() {
  const [result, setResult] = useState<ConnectionDiagnostic | null>(null);
  const [loading, setLoading] = useState(false);
  const run = useCallback(async () => { setLoading(true); setResult(await runConnectionDiagnostic()); setLoading(false); }, []);
  useEffect(() => { void run(); }, [run]);
  return <Page><Heading title="Supabase connection check" subtitle="Read-only query against public.crack_records. No credentials are displayed." />{loading ? <Busy /> : result ? <ScrollView contentContainerStyle={s.scroll}>
    <Panel><Text style={s.sectionTitle}>Configuration</Text><Text style={s.muted}>{result.configured ? 'Environment variables found' : 'Environment variables missing'}</Text><Text style={s.sectionTitle}>Supabase reachable</Text><Text style={s.muted}>{result.serverResponded === null ? 'Not tested' : result.serverResponded ? 'Yes' : 'No'}</Text><Text style={s.sectionTitle}>Read query</Text><Text style={s.muted}>{result.querySucceeded === null ? 'Not tested' : result.querySucceeded ? 'Succeeded' : 'Failed'}</Text><Text style={s.sectionTitle}>Records retrieved</Text><Text style={s.muted}>{result.retrieved} sample rows · {result.totalRows === null ? 'total count unavailable' : `${result.totalRows} total rows`}</Text>{result.error ? <Problem message={result.error} /> : null}</Panel>
    {result.sample.map((record, index) => <Panel key={`${record.location}-${record.detected_at}-${index}`}><Text style={s.sectionTitle}>{record.location}</Text><Text style={s.muted}>Type: {record.crack_type} · Severity: {record.severity} · Status: {record.status}</Text><Text style={s.muted}>Detected: {record.detected_at}</Text></Panel>)}
    {result.querySucceeded && result.retrieved === 0 ? <Panel><Text style={s.muted}>The query succeeded and returned no records.</Text></Panel> : null}
    <Action title="Run again" onPress={() => void run()} />
  </ScrollView> : null}</Page>;
}
