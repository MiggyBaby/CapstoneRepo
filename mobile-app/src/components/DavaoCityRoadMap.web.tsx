import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { C, Page, Panel, Problem, s, label } from '@/components/ui';
import { FilterDropdownPanel, type DropdownFilterSection } from '@/components/filter-dropdown-panel';
import { fetchMapDetections } from '@/services/detections';
import type { Crack, CrackStatus, Severity } from '@/types/database';

const BOUNDS = { south: 6.9667, north: 7.5667, west: 125.2333, east: 125.6667 };
const SEVERITIES: Severity[] = ['high', 'medium', 'low', 'critical'];
const STATUSES: CrackStatus[] = ['new', 'assigned', 'in-progress', 'resolved'];
const TYPES: Crack['crack_type'][] = ['transverse', 'longitudinal', 'block', 'corner', 'diagonal', 'meandering', 'reflection', 'pothole'];
type DateFilter = '' | 'today' | '7d' | '30d';
type Filters = { severity: Severity | ''; status: CrackStatus | ''; type: Crack['crack_type'] | ''; date: DateFilter };
type MapRecord = Pick<Crack, 'id' | 'location' | 'latitude' | 'longitude' | 'crack_type' | 'severity' | 'status' | 'image_url' | 'detected_at' | 'width_mm' | 'length_mm' | 'depth_mm' | 'description'>;

const NO_FILTERS: Filters = { severity: '', status: '', type: '', date: '' };

function isInDavao(row: Crack) {
  return Number.isFinite(row.latitude) && row.latitude >= BOUNDS.south && row.latitude <= BOUNDS.north
    && Number.isFinite(row.longitude) && row.longitude >= BOUNDS.west && row.longitude <= BOUNDS.east
    && row.location.toLocaleLowerCase().includes('davao');
}

function matchesDate(value: string, filter: DateFilter) {
  if (!filter) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (filter === 'today') return date.toDateString() === new Date().toDateString();
  return date.getTime() >= Date.now() - (filter === '7d' ? 7 : 30) * 86400000;
}

function createPopup(record: MapRecord) {
  const root = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = record.location || 'Location not provided';
  root.appendChild(title);
  const details = [
    ['Type', record.crack_type],
    ['Severity', record.severity],
    ['Status', record.status],
    ['Detected', record.detected_at ? new Date(record.detected_at).toLocaleString() : ''],
    ['Width', record.width_mm == null ? '' : `${record.width_mm} mm`],
    ['Length', record.length_mm == null ? '' : `${record.length_mm} mm`],
    ['Depth', record.depth_mm == null ? '' : `${record.depth_mm} mm`],
  ];
  for (const [name, value] of details) {
    if (!value) continue;
    const row = document.createElement('div');
    row.textContent = `${name}: ${value}`;
    root.appendChild(row);
  }
  if (record.description) {
    const description = document.createElement('p');
    description.textContent = record.description;
    root.appendChild(description);
  }
  if (record.image_url?.startsWith('https://')) {
    const image = document.createElement('img');
    image.alt = 'Detection evidence';
    image.src = record.image_url;
    image.style.cssText = 'display:block;max-width:210px;max-height:130px;margin-top:8px';
    image.onerror = () => image.remove();
    root.appendChild(image);
  }
  return root;
}

export default function DavaoCityRoadMap() {
  const { detectionId } = useLocalSearchParams<{ detectionId?: string }>();
  const mapElement = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markersRef = useRef<Leaflet.LayerGroup | null>(null);
  const [rows, setRows] = useState<Crack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');
  const [error, setError] = useState('');
  const [mapVersion, setMapVersion] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(detectionId ?? '');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [draft, setDraft] = useState<Filters>(NO_FILTERS);

  const load = useCallback(async () => {
    try {
      setRows(await fetchMapDetections());
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load detections.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const cityRows = useMemo(() => rows.filter(isInDavao), [rows]);
  const visibleRows = useMemo(() => cityRows.filter(row =>
    (!filters.severity || row.severity === filters.severity)
    && (!filters.status || row.status === filters.status)
    && (!filters.type || row.crack_type === filters.type)
    && matchesDate(row.detected_at, filters.date)), [cityRows, filters]);
  const selected = visibleRows.find(row => row.id === selectedId);
  const records = useMemo<MapRecord[]>(() => visibleRows.map(({
    id, location, latitude, longitude, crack_type, severity, status, image_url, detected_at, width_mm, length_mm, depth_mm, description,
  }) => ({ id, location, latitude, longitude, crack_type, severity, status, image_url, detected_at, width_mm, length_mm, depth_mm, description })), [visibleRows]);
  const activeFilters = Number(Boolean(filters.severity)) + Number(Boolean(filters.type)) + Number(Boolean(filters.status)) + Number(Boolean(filters.date));

  useEffect(() => {
    const element = mapElement.current;
    if (!element) return;
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    let resize: number | undefined;
    setMapReady(false);
    void import('leaflet').then(L => {
      if (cancelled) return;
      leafletRef.current = L;
      map = L.map(element, {
        minZoom: 9,
        maxZoom: 18,
        maxBounds: [[BOUNDS.south, BOUNDS.west], [BOUNDS.north, BOUNDS.east]],
        maxBoundsViscosity: 0.95,
      }).setView([7.07, 125.6], 10);
      mapRef.current = map;
      markersRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      tiles.on('tileload', () => { setMapLoaded(true); setMapError(''); });
      tiles.on('tileerror', () => setMapError('Map tiles could not be loaded. Check your internet connection.'));
      resize = window.setTimeout(() => map?.invalidateSize(), 100);
    }).catch(() => setMapError('The map could not start. Check your internet connection and reload.'));
    return () => {
      cancelled = true;
      if (resize !== undefined) window.clearTimeout(resize);
      map?.remove();
      leafletRef.current = null;
      mapRef.current = null;
      markersRef.current = null;
    };
  }, [mapVersion]);

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    const L = leafletRef.current;
    if (!mapReady || !map || !markers || !L) return;
    markers.clearLayers();
    const severityColors: Record<Severity, string> = { low: '#18794e', medium: '#9a6700', high: '#d05b00', critical: '#b42318' };
    for (const record of records) {
      const marker = L.circleMarker([record.latitude, record.longitude], {
        radius: 7,
        color: '#fff',
        weight: 2,
        fillColor: severityColors[record.severity],
        fillOpacity: 0.95,
      });
      marker.bindPopup(createPopup(record));
      marker.on('click', () => setSelectedId(record.id));
      marker.addTo(markers);
      if (record.id === selectedId) {
        map.setView([record.latitude, record.longitude], 15);
        marker.openPopup();
      }
    }
  }, [mapReady, records, selectedId]);

  const dropdownSections = useMemo<DropdownFilterSection[]>(() => [
    { id: 'severity', title: 'Crack severity', value: draft.severity, options: [{ label: 'All severities', value: '' }, ...SEVERITIES.map(value => ({ label: label(value), value }))] },
    { id: 'type', title: 'Crack type', value: draft.type, options: [{ label: 'All types', value: '' }, ...TYPES.map(value => ({ label: label(value), value }))] },
    { id: 'status', title: 'Report status', value: draft.status, options: [{ label: 'All statuses', value: '' }, ...STATUSES.map(value => ({ label: label(value), value }))] },
    { id: 'date', title: 'Detection date', value: draft.date, options: [{ label: 'All time', value: '' }, { label: 'Today', value: 'today' }, { label: 'Last 7 days', value: '7d' }, { label: 'Last 30 days', value: '30d' }] },
  ], [draft]);

  async function navigateWithGoogleMaps() {
    if (!selected) return;
    await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`);
  }

  function updateDraft(section: string, value: string) {
    if (section === 'severity') setDraft(current => ({ ...current, severity: value as Filters['severity'] }));
    else if (section === 'type') setDraft(current => ({ ...current, type: value as Filters['type'] }));
    else if (section === 'status') setDraft(current => ({ ...current, status: value as Filters['status'] }));
    else if (section === 'date') setDraft(current => ({ ...current, date: value as DateFilter }));
  }

  return <Page>
    <View style={ui.header}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={ui.title}>Davao City Road Map</Text>
        <Text style={s.muted} numberOfLines={1}>Road crack detection and monitoring</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Refresh detections" onPress={() => { setRefreshing(true); void load(); }} style={ui.refresh}>
        {refreshing ? <ActivityIndicator size="small" color={C.blue} /> : <SymbolView name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} tintColor={C.blue} size={21} />}
      </Pressable>
    </View>
    <View style={ui.summary}>
      <Text style={ui.count}>{loading ? 'Loading detections...' : `${visibleRows.length} records shown`}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Filters${activeFilters ? `, ${activeFilters} active` : ''}`} onPress={() => { setDraft(filters); setSheetOpen(true); }} style={ui.filterButton}>
        <SymbolView name={{ ios: 'line.3.horizontal.decrease', android: 'filter_list', web: 'filter_list' }} tintColor={C.blue} size={19} />
        <Text style={ui.filterText}>Filters</Text>
        {activeFilters > 0 ? <View style={ui.badge}><Text style={ui.badgeText}>{activeFilters}</Text></View> : null}
      </Pressable>
    </View>
    {error ? <Problem message={error} retry={() => { setLoading(true); void load(); }} /> : null}
    <View style={ui.map}>
      {React.createElement('div', { ref: mapElement, style: { width: '100%', height: '100%', minHeight: 230, backgroundColor: '#e8eef2' } })}
      {!mapLoaded && !mapError ? <View pointerEvents="none" style={ui.mapLoading}><ActivityIndicator color={C.blue} /><Text style={s.muted}>Loading map tiles</Text></View> : null}
    </View>
    {!loading && !error && !cityRows.length ? <Panel><Text style={s.muted}>No valid road-crack records were found within the Davao City map area.</Text></Panel> : null}
    {cityRows.length ? <>
      {mapError ? <Problem message={mapError} retry={() => { setMapError(''); setMapLoaded(false); setMapVersion(version => version + 1); }} /> : null}
      <View style={ui.legend}>{SEVERITIES.map(value => <View key={value} style={ui.legendItem}><View style={[ui.dot, { backgroundColor: value === 'low' ? C.green : value === 'medium' ? C.amber : value === 'high' ? '#D05B00' : C.red }]} /><Text style={s.small}>{label(value)}</Text></View>)}</View>
      {selected ? <Panel>
        <Text style={s.sectionTitle}>{selected.location}</Text>
        <Text style={s.muted}>{label(selected.crack_type)} · {label(selected.severity)} · {label(selected.status)}</Text>
        <Text style={s.small}>{new Date(selected.detected_at).toLocaleString()}</Text>
        <View style={ui.selectedActions}>
          <Pressable accessibilityRole="button" onPress={() => router.push(`/detections/${selected.id}`)} style={[ui.actionButton, ui.apply]}><Text style={ui.applyText}>View details</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => void navigateWithGoogleMaps()} style={[ui.actionButton, ui.reset]}><Text style={ui.resetText}>Navigate</Text></Pressable>
        </View>
      </Panel> : null}
      {!visibleRows.length ? <Panel><Text style={s.muted}>No Davao City detections match these filters.</Text></Panel> : null}
      <Text style={s.small}>OpenStreetMap contributors</Text>
      {rows.length > cityRows.length ? <Text style={s.small}>{rows.length - cityRows.length} record(s) excluded by the Davao City location or coordinate boundary.</Text> : null}
    </> : null}
    <FilterDropdownPanel
      visible={sheetOpen}
      title="Map filters"
      sections={dropdownSections}
      onChange={updateDraft}
      onReset={() => setDraft(NO_FILTERS)}
      onApply={() => { setFilters(draft); setSelectedId(detectionId ?? ''); setSheetOpen(false); }}
      onClose={() => setSheetOpen(false)}
    />
  </Page>;
}

const ui = {
  header: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  title: { color: C.ink, fontSize: 22, fontWeight: '800' as const },
  refresh: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: 'center' as const, justifyContent: 'center' as const },
  summary: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: 8 },
  count: { color: C.ink, fontSize: 14, fontWeight: '700' as const },
  filterButton: { minHeight: 42, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  filterText: { color: C.ink, fontSize: 13, fontWeight: '700' as const },
  badge: { minWidth: 19, height: 19, borderRadius: 10, backgroundColor: C.blue, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: 4 },
  badgeText: { color: C.white, fontSize: 11, fontWeight: '800' as const },
  map: { flex: 1, minHeight: 230, borderRadius: 16, overflow: 'hidden' as const, borderWidth: 1, borderColor: C.line },
  mapLoading: { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, backgroundColor: '#F3F6F8CC' },
  legend: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, alignItems: 'center' as const, gap: 12 },
  legendItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  selectedActions: { flexDirection: 'row' as const, gap: 8, marginTop: 4 },
  actionButton: { minHeight: 44, flex: 1, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: 14 },
  reset: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  resetText: { color: C.blue, fontSize: 14, fontWeight: '700' as const },
  apply: { backgroundColor: C.blue },
  applyText: { color: C.white, fontSize: 14, fontWeight: '700' as const },
};
