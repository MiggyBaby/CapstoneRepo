import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Badge, Busy, C, Heading, Page, Panel, Problem, label, s } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { fetchInspectionDetections, forwardInspectionBatch } from '@/services/inspection';
import type { Crack } from '@/types/database';

export default function Inspection() {
  const { session } = useAuth();
  const canInspect = session?.user.app_metadata.role === 'inspector' || session?.user.app_metadata.role === 'admin';
  const [rows, setRows] = useState<Crack[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const detections = await fetchInspectionDetections();
      setRows(detections);
      setSelected(current => current.filter(id => detections.some(row => row.id === id && row.review_state === 'reviewed')));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load inspection records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const reviewedIds = useMemo(() => new Set(rows.filter(row => row.review_state === 'reviewed').map(row => row.id)), [rows]);

  function toggleSelected(id: string) {
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }

  async function submitBatch() {
    if (!selected.length || forwarding) return;
    setForwarding(true);
    setError('');
    try {
      const batchId = await forwardInspectionBatch(selected);
      setSelected([]);
      Alert.alert('Inspection forwarded', `Batch ${batchId} is now available in the website review queue.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not forward this inspection batch.');
    } finally {
      setForwarding(false);
    }
  }

  return <Page>
    <Heading title="Inspection review" subtitle="Check detections, record notes, then forward reviewed records to the website." />
    {!canInspect ? <Problem message="Inspection review is available to inspector and admin accounts." /> : null}
    {canInspect ? <>
      <Panel>
        <Text style={s.sectionTitle}>Ready to forward</Text>
        <Text style={s.muted}>{reviewedIds.size} reviewed · {selected.length} selected</Text>
        <Pressable accessibilityRole="button" disabled={!selected.length || forwarding} onPress={() => void submitBatch()} style={[s.action, { opacity: !selected.length || forwarding ? 0.55 : 1 }]}>
          <Text style={s.actionText}>{forwarding ? 'Forwarding…' : `Forward ${selected.length || ''} reviewed ${selected.length === 1 ? 'record' : 'records'}`}</Text>
        </Pressable>
      </Panel>
      {error ? <Problem message={error} retry={() => void load()} /> : null}
      {loading ? <Busy /> : <FlatList
        data={rows}
        keyExtractor={item => item.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        renderItem={({ item }) => {
          const canSelect = item.review_state === 'reviewed';
          const isSelected = selected.includes(item.id);
          return <View style={s.card}>
            <Pressable accessibilityRole="button" onPress={() => router.push(`/detections/${item.id}`)} style={{ gap: 7 }}>
              <View style={s.row}><Text style={s.cardTitle}>{label(item.crack_type)}</Text><Badge value={item.severity} /></View>
              <Text style={s.muted} numberOfLines={1}>{item.location}</Text>
              <Text style={s.small}>Inspection: {label(item.review_state)}</Text>
              <Text style={s.small}>Detected {new Date(item.detected_at).toLocaleString()}</Text>
            </Pressable>
            {canSelect ? <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              onPress={() => toggleSelected(item.id)}
              style={[s.action, { backgroundColor: isSelected ? C.green : C.white, borderWidth: 1, borderColor: isSelected ? C.green : C.blue }]}
            ><Text style={[s.actionText, { color: isSelected ? C.white : C.blue }]}>{isSelected ? 'Selected for forwarding' : 'Select for forwarding'}</Text></Pressable> : null}
          </View>;
        }}
        ListEmptyComponent={!error ? <Problem message="No detections are waiting for inspector review." /> : null}
      />}
    </> : null}
  </Page>;
}
