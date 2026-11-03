import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { Busy, C, DetectionCard, Heading, Page, Problem, s } from '@/components/ui';
import { FilterDropdownPanel, type DropdownFilterSection } from '@/components/filter-dropdown-panel';
import { fetchDetections, PAGE_SIZE } from '@/services/detections';
import { Crack, CrackStatus, Severity } from '@/types/database';
import { mergeById } from '@/services/detection-utils.mjs';

type Filters = { severity: Severity | ''; status: CrackStatus | ''; crackType: Crack['crack_type'] | ''; date: '' | 'today' | '7d' | '30d' };
const NO_FILTERS: Filters = { severity: '', status: '', crackType: '', date: '' };

export default function Detections() {
  const [rows, setRows] = useState<Crack[]>([]); const [search, setSearch] = useState(''); const [filters, setFilters] = useState<Filters>(NO_FILTERS); const [draft, setDraft] = useState<Filters>(NO_FILTERS); const [filterOpen, setFilterOpen] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [loadingMore, setLoadingMore] = useState(false); const [refreshing, setRefreshing] = useState(false); const [more, setMore] = useState(true); const offset = useRef(0);
  const detectedAfter = useMemo(() => { if (!filters.date) return undefined; const start = new Date(); if (filters.date === 'today') start.setHours(0, 0, 0, 0); else start.setTime(Date.now() - (filters.date === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000); return start.toISOString(); }, [filters.date]);
  const load = useCallback(async (reset = true) => { try { setError(''); if (reset) offset.current = 0; const next = await fetchDetections({ offset: reset ? 0 : offset.current, search, severity: filters.severity, status: filters.status, crackType: filters.crackType, detectedAfter }); offset.current = reset ? next.length : offset.current + next.length; setRows(old => reset ? next : mergeById(old, next)); setMore(next.length === PAGE_SIZE); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load detections.'); } finally { setLoading(false); setRefreshing(false); setLoadingMore(false); } }, [search, filters, detectedAfter]);
  const dropdownSections = useMemo<DropdownFilterSection[]>(() => [
    { id: 'severity', title: 'Crack severity', value: draft.severity, options: [{ label: 'All severities', value: '' }, ...(['low', 'medium', 'high', 'critical'] as Severity[]).map(value => ({ label: value[0].toUpperCase() + value.slice(1), value }))] },
    { id: 'crackType', title: 'Crack type', value: draft.crackType, options: [{ label: 'All types', value: '' }, ...(['transverse', 'longitudinal', 'block', 'corner', 'diagonal', 'meandering', 'reflection'] as Crack['crack_type'][]).map(value => ({ label: value[0].toUpperCase() + value.slice(1), value }))] },
    { id: 'status', title: 'Report status', value: draft.status, options: [{ label: 'All statuses', value: '' }, ...(['new', 'assigned', 'in-progress', 'resolved'] as CrackStatus[]).map(value => ({ label: value.replace('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase()), value }))] },
    { id: 'date', title: 'Detection date', value: draft.date, options: [{ label: 'All time', value: '' }, { label: 'Today', value: 'today' }, { label: 'Last 7 days', value: '7d' }, { label: 'Last 30 days', value: '30d' }] },
  ], [draft]);
  const activeFilters = Number(Boolean(filters.severity)) + Number(Boolean(filters.status)) + Number(Boolean(filters.crackType)) + Number(Boolean(filters.date));
  function openFilters() { setDraft(filters); setFilterOpen(true); }
  function updateDraft(section: string, value: string) {
    if (section === 'severity') setDraft(current => ({ ...current, severity: value as Filters['severity'] }));
    else if (section === 'status') setDraft(current => ({ ...current, status: value as Filters['status'] }));
    else if (section === 'crackType') setDraft(current => ({ ...current, crackType: value as Filters['crackType'] }));
    else if (section === 'date') setDraft(current => ({ ...current, date: value as Filters['date'] }));
  }
  function applyFilters() { setFilters(draft); setFilterOpen(false); }
  function resetFilters() { setDraft(NO_FILTERS); }
  useEffect(() => { setLoading(true); void load(true); }, [load]);
  return <Page>
    <View style={styles.header}><View style={{ flex: 1, minWidth: 0 }}><Heading title="Detection history" subtitle="Search and filter records from Supabase." /></View><Pressable accessibilityRole="button" accessibilityLabel={`Filters${activeFilters ? `, ${activeFilters} active` : ''}`} onPress={openFilters} style={styles.filterButton}><Text style={styles.filterIcon}>☷</Text><Text style={styles.filterText}>Filters</Text>{activeFilters > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{activeFilters}</Text></View> : null}</Pressable></View>
    <TextInput style={s.input} placeholder="Search by location" value={search} onChangeText={setSearch} returnKeyType="search" />
    {error ? <Problem message={error} retry={() => void load(true)} /> : null}
    {loading && rows.length === 0 ? <Busy /> : <FlatList data={rows} keyExtractor={x => x.id} renderItem={({ item }) => <DetectionCard item={item} />} ItemSeparatorComponent={() => <></>} contentContainerStyle={{ gap: 10, paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />} onEndReached={() => { if (more && !loading && !loadingMore) { setLoadingMore(true); void load(false); } }} onEndReachedThreshold={0.5} ListEmptyComponent={!error ? <Problem message="No matching detections found." /> : null} />}
    <FilterDropdownPanel visible={filterOpen} title="Detection filters" sections={dropdownSections} onChange={updateDraft} onReset={resetFilters} onApply={applyFilters} onClose={() => setFilterOpen(false)} />
  </Page>;
}

const styles = {
  header: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  filterButton: { minHeight: 42, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  filterIcon: { color: C.blue, fontSize: 20 }, filterText: { color: C.ink, fontSize: 13, fontWeight: '700' as const },
  badge: { minWidth: 19, height: 19, borderRadius: 10, backgroundColor: C.blue, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: 4 },
  badgeText: { color: C.white, fontSize: 11, fontWeight: '800' as const },
};
