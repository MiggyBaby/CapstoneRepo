import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { SymbolView } from 'expo-symbols';
import { router, useLocalSearchParams } from 'expo-router';
import { C, Page, Panel, Problem, s, label } from '@/components/ui';
import { FilterDropdownPanel, type DropdownFilterSection } from '@/components/filter-dropdown-panel';
import { fetchMapDetections } from '@/services/detections';
import type { Crack, CrackStatus, Severity } from '@/types/database';

// Broad extent from the Davao City CLUP geographic-location description.
// It bounds navigation; record eligibility separately checks coordinates and location text.
const BOUNDS = { south: 6.9667, north: 7.5667, west: 125.2333, east: 125.6667 };
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const SEVERITIES: Severity[] = ['high', 'medium', 'low', 'critical'];
const STATUSES: CrackStatus[] = ['new', 'assigned', 'in-progress', 'resolved'];
const TYPES: Crack['crack_type'][] = ['transverse', 'longitudinal', 'block', 'corner', 'diagonal', 'meandering', 'reflection'];
type DateFilter = '' | 'today' | '7d' | '30d';
type Filters = { severity: Severity | ''; status: CrackStatus | ''; type: Crack['crack_type'] | ''; date: DateFilter };
const NO_FILTERS: Filters = { severity: '', status: '', type: '', date: '' };
type MapRecord = Pick<Crack, 'id' | 'location' | 'latitude' | 'longitude' | 'crack_type' | 'severity' | 'status' | 'image_url' | 'detected_at' | 'width_mm' | 'length_mm' | 'depth_mm' | 'description'>;
type MapMessage = { type: 'ready' } | { type: 'loaded' } | { type: 'map_error'; message: string } | { type: 'selected'; id: string };

const HTML = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<link rel="preconnect" href="https://unpkg.com" crossorigin /><link rel="preconnect" href="https://tiles.openfreemap.org" crossorigin />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" /><link rel="stylesheet" href="https://unpkg.com/maplibre-gl@6.3.0/dist/maplibre-gl.css" />
<style>html,body,#map{height:100%;width:100%;margin:0;background:#e8eef2}.leaflet-popup-content{min-width:185px}.popup-title{font-weight:700;margin-bottom:6px}.popup-row{margin:3px 0}.popup-image{display:block;max-width:210px;max-height:130px;margin-top:8px}</style>
<script type="importmap">{"imports":{"leaflet":"https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js","maplibre-gl":"https://unpkg.com/maplibre-gl@6.3.0/dist/maplibre-gl.mjs"}}</script></head><body><div id="map"></div><script type="module">
const send=value=>window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(value));
try{const [L,{maplibreGL}]=await Promise.all([import('leaflet'),import('https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/dist/leaflet-maplibre-gl.mjs')]);
const map=L.map('map',{minZoom:9,maxZoom:18,maxBounds:[[${BOUNDS.south},${BOUNDS.west}],[${BOUNDS.north},${BOUNDS.east}]],maxBoundsViscosity:0.95,zoomControl:true}).setView([7.07,125.6],10);
const gl=maplibreGL({style:'${STYLE_URL}'}).addTo(map);const markers=L.layerGroup().addTo(map);const colors={low:'#18794e',medium:'#9a6700',high:'#d05b00',critical:'#b42318'};
function popup(r){const root=document.createElement('div');const title=document.createElement('div');title.className='popup-title';title.textContent=r.location||'Location not provided';root.appendChild(title);for(const [k,v] of [['Type',r.crack_type],['Severity',r.severity],['Status',r.status],['Detected',r.detected_at?new Date(r.detected_at).toLocaleString():'']]){if(v==null||v==='')continue;const row=document.createElement('div');row.className='popup-row';const b=document.createElement('strong');b.textContent=k+': ';row.appendChild(b);row.appendChild(document.createTextNode(String(v)));root.appendChild(row);}for(const [k,v] of [['Width',r.width_mm],['Length',r.length_mm],['Depth',r.depth_mm]])if(v!=null){const row=document.createElement('div');row.className='popup-row';row.textContent=k+': '+v+' mm';root.appendChild(row);}if(r.description){const p=document.createElement('p');p.className='popup-row';p.textContent=r.description;root.appendChild(p);}if(typeof r.image_url==='string'&&r.image_url.startsWith('https://')){const img=document.createElement('img');img.className='popup-image';img.alt='Detection evidence';img.src=r.image_url;img.onerror=()=>img.remove();root.appendChild(img);}return root;}
gl.getMaplibreMap().on('load',()=>send({type:'loaded'}));gl.getMaplibreMap().on('error',()=>send({type:'map_error',message:'Map style or tiles could not be loaded. Check your connection.'}));
function receive(e){try{const m=JSON.parse(e.data);if(!m||m.type!=='detections'||!Array.isArray(m.records))return;markers.clearLayers();let target=null;for(const r of m.records){if(!r||typeof r.id!=='string'||!Number.isFinite(r.latitude)||r.latitude<${BOUNDS.south}||r.latitude>${BOUNDS.north}||!Number.isFinite(r.longitude)||r.longitude<${BOUNDS.west}||r.longitude>${BOUNDS.east})continue;const marker=L.circleMarker([r.latitude,r.longitude],{radius:7,color:'#fff',weight:2,fillColor:colors[r.severity]||'#176b87',fillOpacity:.95});marker.bindPopup(popup(r));marker.on('click',()=>send({type:'selected',id:r.id}));marker.addTo(markers);if(r.id===m.selectedId)target={marker,record:r};}if(target){map.setView([target.record.latitude,target.record.longitude],15);target.marker.openPopup();}setTimeout(()=>map.invalidateSize(),80);}catch(_){send({type:'map_error',message:'Map data could not be displayed.'});}}
window.addEventListener('message',receive);document.addEventListener('message',receive);send({type:'ready'});setTimeout(()=>map.invalidateSize(),100);
}catch(_){send({type:'map_error',message:'Leaflet could not start. Check your internet connection and reload.'});}</script></body></html>`;

function hasValidCoordinates(row: Crack) { return Number.isFinite(row.latitude) && row.latitude >= -90 && row.latitude <= 90 && Number.isFinite(row.longitude) && row.longitude >= -180 && row.longitude <= 180; }
function isInDavao(row: Crack) { return hasValidCoordinates(row) && row.latitude >= BOUNDS.south && row.latitude <= BOUNDS.north && row.longitude >= BOUNDS.west && row.longitude <= BOUNDS.east && row.location.toLocaleLowerCase().includes('davao'); }
function matchesDate(value: string, filter: DateFilter) { if (!filter) return true; const date = new Date(value); if (Number.isNaN(date.getTime())) return false; if (filter === 'today') return date.toDateString() === new Date().toDateString(); return date.getTime() >= Date.now() - (filter === '7d' ? 7 : 30) * 86400000; }

export default function DavaoCityRoadMap() {
  const { detectionId } = useLocalSearchParams<{ detectionId?: string }>();
  const webView = useRef<WebView>(null);
  const [rows, setRows] = useState<Crack[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [ready, setReady] = useState(false); const [mapLoaded, setMapLoaded] = useState(false); const [mapError, setMapError] = useState(''); const [error, setError] = useState(''); const [webKey, setWebKey] = useState(0); const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(detectionId ?? ''); const [filters, setFilters] = useState<Filters>(NO_FILTERS); const [draft, setDraft] = useState<Filters>(NO_FILTERS);
  const load = useCallback(async () => { try { setRows(await fetchMapDetections()); setError(''); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load detections.'); } finally { setLoading(false); setRefreshing(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const cityRows = useMemo(() => rows.filter(isInDavao), [rows]);
  const visibleRows = useMemo(() => cityRows.filter(row => (!filters.severity || row.severity === filters.severity) && (!filters.status || row.status === filters.status) && (!filters.type || row.crack_type === filters.type) && matchesDate(row.detected_at, filters.date)), [cityRows, filters]);
  const selected = visibleRows.find(row => row.id === selectedId);
  const records = useMemo<MapRecord[]>(() => visibleRows.map(({ id, location, latitude, longitude, crack_type, severity, status, image_url, detected_at, width_mm, length_mm, depth_mm, description }) => ({ id, location, latitude, longitude, crack_type, severity, status, image_url, detected_at, width_mm, length_mm, depth_mm, description })), [visibleRows]);
  const activeFilters = Number(Boolean(filters.severity)) + Number(Boolean(filters.type)) + Number(Boolean(filters.status)) + Number(Boolean(filters.date));
  useEffect(() => { if (ready) webView.current?.postMessage(JSON.stringify({ type: 'detections', records, selectedId })); }, [ready, records, selectedId]);
  const dropdownSections = useMemo<DropdownFilterSection[]>(() => [
    { id: 'severity', title: 'Crack severity', value: draft.severity, options: [{ label: 'All severities', value: '' }, ...SEVERITIES.map(value => ({ label: label(value), value }))] },
    { id: 'type', title: 'Crack type', value: draft.type, options: [{ label: 'All types', value: '' }, ...TYPES.map(value => ({ label: label(value), value }))] },
    { id: 'status', title: 'Report status', value: draft.status, options: [{ label: 'All statuses', value: '' }, ...STATUSES.map(value => ({ label: label(value), value }))] },
    { id: 'date', title: 'Detection date', value: draft.date, options: [{ label: 'All time', value: '' }, { label: 'Today', value: 'today' }, { label: 'Last 7 days', value: '7d' }, { label: 'Last 30 days', value: '30d' }] },
  ], [draft]);
  const onMapMessage = useCallback((event: WebViewMessageEvent) => { try { const message = JSON.parse(event.nativeEvent.data) as Partial<MapMessage>; if (message.type === 'ready') { setReady(true); setMapError(''); } else if (message.type === 'loaded') { setMapLoaded(true); setMapError(''); } else if (message.type === 'map_error' && typeof message.message === 'string') { setMapLoaded(false); setMapError(message.message.slice(0, 200)); } else if (message.type === 'selected' && typeof message.id === 'string' && cityRows.some(row => row.id === message.id)) setSelectedId(message.id); } catch { setMapError('Received an invalid map response. Reload the map.'); } }, [cityRows]);

  async function navigateWithGoogleMaps() { if (!selected) return; try { await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`); } catch { Alert.alert('Unable to open Google Maps', 'Check that a maps app or browser is available.'); } }
  function openSheet() { setDraft(filters); setSheetOpen(true); }
  function updateDraft(section: string, value: string) {
    if (section === 'severity') setDraft(current => ({ ...current, severity: value as Filters['severity'] }));
    else if (section === 'type') setDraft(current => ({ ...current, type: value as Filters['type'] }));
    else if (section === 'status') setDraft(current => ({ ...current, status: value as Filters['status'] }));
    else if (section === 'date') setDraft(current => ({ ...current, date: value as DateFilter }));
  }
  function applyFilters() { setFilters(draft); setSelectedId(detectionId ?? ''); setSheetOpen(false); }
  function resetDraft() { setDraft(NO_FILTERS); }

  return <Page>
    <View style={ui.header}><View style={{ flex: 1, minWidth: 0 }}><Text style={ui.title}>Davao City Road Map</Text><Text style={s.muted} numberOfLines={1}>Road crack detection and monitoring</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Refresh detections" onPress={() => { setRefreshing(true); void load(); }} style={ui.refresh}>{refreshing ? <ActivityIndicator size="small" color={C.blue} /> : <SymbolView name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} tintColor={C.blue} size={21} />}</Pressable></View>
    <View style={ui.summary}><Text style={ui.count}>{loading ? 'Loading detections...' : `${visibleRows.length} records shown`}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Filters${activeFilters ? `, ${activeFilters} active` : ''}`} onPress={openSheet} style={ui.filterButton}><SymbolView name={{ ios: 'line.3.horizontal.decrease', android: 'filter_list', web: 'filter_list' }} tintColor={C.blue} size={19} /><Text style={ui.filterText}>Filters</Text>{activeFilters > 0 ? <View style={ui.badge}><Text style={ui.badgeText}>{activeFilters}</Text></View> : null}</Pressable></View>
    {error ? <Problem message={error} retry={() => { setLoading(true); void load(); }} /> : null}
    <View style={ui.map}><WebView key={webKey} ref={webView} source={{ html: HTML }} originWhitelist={['*']} onMessage={onMapMessage} onError={() => setMapError('The embedded map page could not load. Check your internet connection.')} javaScriptEnabled domStorageEnabled mixedContentMode="never" style={{ flex: 1, backgroundColor: C.bg }} />
      {!ready && !mapError ? <View pointerEvents="none" style={ui.mapLoading}><ActivityIndicator color={C.blue} /><Text style={s.muted}>Starting Davao map...</Text></View> : null}
      {ready && !mapLoaded && !mapError ? <View pointerEvents="none" style={ui.tileLoading}><ActivityIndicator size="small" color={C.blue} /><Text style={ui.tileLoadingText}>Loading map tiles</Text></View> : null}
    </View>
    {!loading && !error && !cityRows.length ? <Panel><Text style={s.muted}>No valid road-crack records were found within the Davao City map area.</Text></Panel> : null}
    {cityRows.length ? <>
      {mapError ? <Problem message={mapError} retry={() => { setMapError(''); setMapLoaded(false); setReady(false); setSelectedId(detectionId ?? ''); setWebKey(key => key + 1); }} /> : null}
      <View style={ui.legend}>{SEVERITIES.map(value => <View key={value} style={ui.legendItem}><View style={[ui.dot, { backgroundColor: value === 'low' ? C.green : value === 'medium' ? C.amber : value === 'high' ? '#D05B00' : C.red }]} /><Text style={s.small}>{label(value)}</Text></View>)}</View>
      {selected ? <Panel><Text style={s.sectionTitle}>{selected.location}</Text><Text style={s.muted}>{label(selected.crack_type)} · {label(selected.severity)} · {label(selected.status)}</Text><Text style={s.small}>{new Date(selected.detected_at).toLocaleString()}</Text><View style={ui.selectedActions}><Pressable accessibilityRole="button" onPress={() => router.push(`/detections/${selected.id}`)} style={[ui.actionButton, ui.apply]}><Text style={ui.applyText}>View details</Text></Pressable><Pressable accessibilityRole="button" onPress={() => void navigateWithGoogleMaps()} style={[ui.actionButton, ui.reset]}><Text style={ui.resetText}>Navigate</Text></Pressable></View></Panel> : null}
      {!visibleRows.length ? <Panel><Text style={s.muted}>No Davao City detections match these filters.</Text></Panel> : null}
      <Text style={s.small}>OpenFreeMap · © OpenMapTiles · Data from OpenStreetMap</Text>
      {rows.length > cityRows.length ? <Text style={s.small}>{rows.length - cityRows.length} record(s) excluded by the Davao City location or coordinate boundary.</Text> : null}
    </> : null}
    <FilterDropdownPanel visible={sheetOpen} title="Map filters" sections={dropdownSections} onChange={updateDraft} onReset={resetDraft} onApply={applyFilters} onClose={() => setSheetOpen(false)} />
  </Page>;
}

const ui = {
  header: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 }, title: { color: C.ink, fontSize: 22, fontWeight: '800' as const },
  refresh: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: 'center' as const, justifyContent: 'center' as const },
  summary: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: 8 }, count: { color: C.ink, fontSize: 14, fontWeight: '700' as const },
  filterButton: { minHeight: 42, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 }, filterText: { color: C.ink, fontSize: 13, fontWeight: '700' as const }, badge: { minWidth: 19, height: 19, borderRadius: 10, backgroundColor: C.blue, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: 4 }, badgeText: { color: C.white, fontSize: 11, fontWeight: '800' as const },
  map: { flex: 1, minHeight: 230, borderRadius: 16, overflow: 'hidden' as const, borderWidth: 1, borderColor: C.line }, mapLoading: { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, backgroundColor: '#F3F6F8CC' }, tileLoading: { position: 'absolute' as const, top: 10, alignSelf: 'center' as const, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 7, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: C.white }, tileLoadingText: { color: C.muted, fontSize: 11 },
  legend: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, alignItems: 'center' as const, gap: 12 }, legendItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5 }, dot: { width: 10, height: 10, borderRadius: 5 }, selectedActions: { flexDirection: 'row' as const, gap: 8, marginTop: 4 },
  actionButton: { minHeight: 44, flex: 1, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: 14 }, reset: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line }, resetText: { color: C.blue, fontSize: 14, fontWeight: '700' as const }, apply: { backgroundColor: C.blue }, applyText: { color: C.white, fontSize: 14, fontWeight: '700' as const },
};
