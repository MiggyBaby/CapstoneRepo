import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Badge, Busy, C, Heading, Page, Panel, Problem, label, s } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { fetchInspectionDetections, forwardInspectionBatch } from '@/services/inspection';
import type { Crack } from '@/types/database';

type InspectionView = 'ready' | 'forwarded';

export default function Inspection() {
  const { session } = useAuth();
  const canInspect = session?.user.app_metadata.role === 'inspector' || session?.user.app_metadata.role === 'admin';
  const [activeView, setActiveView] = useState<InspectionView>('ready');
  const [rows, setRows] = useState<Crack[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (view: InspectionView = activeView) => {
    setLoading(true);
    setRows([]);
    setSelected([]);
    try {
      setError('');
      const detections = await fetchInspectionDetections(view === 'forwarded' ? 'forwarded' : undefined);
      setRows(detections);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load inspection records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeView]);

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
      setActiveView('forwarded');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not forward this inspection batch.');
    } finally {
      setForwarding(false);
    }
  }

  return <Page>
    <Heading title="Inspection review" subtitle="New and updated records marked reviewed appear under Ready to forward. Forwarded records are kept separate to prevent resubmission." />
    {!canInspect ? <Problem message="Inspection review is available to inspector and admin accounts." /> : null}
    {canInspect ? <>
      <View style={styles.tabs} accessibilityRole="tablist">
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeView === 'ready' }}
          onPress={() => setActiveView('ready')}
          style={[styles.tab, activeView === 'ready' && styles.activeTab]}
        ><Text style={[styles.tabText, activeView === 'ready' && styles.activeTabText]}>Ready to forward</Text></Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeView === 'forwarded' }}
          onPress={() => setActiveView('forwarded')}
          style={[styles.tab, activeView === 'forwarded' && styles.activeTab]}
        ><Text style={[styles.tabText, activeView === 'forwarded' && styles.activeTabText]}>Forwarded</Text></Pressable>
      </View>
      {activeView === 'ready' ? <Panel>
        <Text style={s.sectionTitle}>Ready to forward</Text>
        <Text style={s.muted}>{reviewedIds.size} reviewed · {selected.length} selected</Text>
        <Pressable accessibilityRole="button" disabled={!selected.length || forwarding} onPress={() => void submitBatch()} style={[s.action, { opacity: !selected.length || forwarding ? 0.55 : 1 }]}>
          <Text style={s.actionText}>{forwarding ? 'Forwarding…' : `Forward ${selected.length || ''} reviewed ${selected.length === 1 ? 'record' : 'records'}`}</Text>
        </Pressable>
      </Panel> : <Panel>
        <Text style={s.sectionTitle}>Already forwarded</Text>
        <Text style={s.muted}>These records have been sent to the website and cannot be selected for forwarding again.</Text>
      </Panel>}
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
              {activeView === 'ready' && item.return_reviewed_at ? <View style={styles.returnNotice}>
                <Text style={styles.returnTitle}>Changes requested</Text>
                <Text style={s.small}>Returned {new Date(item.return_reviewed_at).toLocaleString()}</Text>
                {item.return_review_note ? <Text style={s.small}>Reviewer note: {item.return_review_note}</Text> : null}
              </View> : null}
              <Text style={s.small}>{activeView === 'forwarded' ? 'Forwarded to website' : 'Inspection'}: {activeView === 'forwarded' ? new Date(item.updated_at).toLocaleString() : label(item.review_state)}</Text>
              <Text style={s.small}>Detected {new Date(item.detected_at).toLocaleString()}</Text>
            </Pressable>
            {activeView === 'ready' && canSelect ? <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              onPress={() => toggleSelected(item.id)}
              style={[s.action, { backgroundColor: isSelected ? C.green : C.white, borderWidth: 1, borderColor: isSelected ? C.green : C.blue }]}
            ><Text style={[s.actionText, { color: isSelected ? C.white : C.blue }]}>{isSelected ? 'Selected for forwarding' : 'Select for forwarding'}</Text></Pressable> : null}
          </View>;
        }}
        ListEmptyComponent={!error ? <Problem message={activeView === 'forwarded' ? 'No records have been forwarded yet.' : 'No detections are waiting for inspector review.'} /> : null}
      />}
    </> : null}
  </Page>;
}

const styles = {
  tabs: { flexDirection: 'row' as const, backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.line, padding: 4, gap: 4 },
  tab: { flex: 1, minHeight: 40, alignItems: 'center' as const, justifyContent: 'center' as const, borderRadius: 7 },
  activeTab: { backgroundColor: C.blue },
  tabText: { color: C.muted, fontSize: 13, fontWeight: '700' as const },
  activeTabText: { color: C.white },
  returnNotice: { backgroundColor: '#FFF7E6', borderColor: '#E8B949', borderWidth: 1, borderRadius: 8, padding: 10, gap: 4 },
  returnTitle: { color: C.amber, fontSize: 13, fontWeight: '800' as const },
};
