import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Busy, C, DetectionCard, Heading, Page, Panel, Problem, s } from '@/components/ui';
import { fetchSummary } from '@/services/detections';
import { Crack } from '@/types/database';

export default function Overview() {
  const [data, setData] = useState<Crack[]>([]); const [stats, setStats] = useState({ total: 0, critical: 0, open: 0 }); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { try { setError(''); const summary = await fetchSummary(); setData(summary.records); setStats({ total: summary.total, critical: summary.critical, open: summary.open }); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load detections.'); } finally { setLoading(false); setRefreshing(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <Page><ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}><Heading title="Road Watch" subtitle="Shared road condition monitoring" />{error ? <Problem message={error} retry={() => void load()} /> : null}{loading ? <Busy /> : <>
    <View style={{ flexDirection: 'row', gap: 10 }}><Panel><Text style={s.muted}>Total detections</Text><Text style={s.metric}>{stats.total}</Text></Panel><Panel><Text style={s.muted}>Critical</Text><Text style={[s.metric, { color: C.red }]}>{stats.critical}</Text></Panel></View>
    <Panel><Text style={s.sectionTitle}>Open workflow items</Text><Text style={s.metric}>{stats.open}</Text></Panel>
    {data.slice(0, 5).map(item => <DetectionCard key={item.id} item={item} />)}{!data.length && !error ? <Panel><Text style={s.muted}>No detections are available to this account.</Text></Panel> : null}
    <Action title="View all detections" onPress={() => router.push('/(tabs)/detections')} />
  </>}</ScrollView></Page>;
}
