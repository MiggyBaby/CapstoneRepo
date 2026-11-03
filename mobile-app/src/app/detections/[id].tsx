import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Badge, Busy, Heading, Page, Panel, Problem, s } from '@/components/ui';
import { fetchDetection } from '@/services/detections';
import { Crack } from '@/types/database';

export default function DetectionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const [item, setItem] = useState<Crack | null>(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { try { setError(''); setItem(await fetchDetection(id)); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load this detection.'); } finally { setLoading(false); } }, [id]);
  useEffect(() => { void load(); }, [load]);
  const hasCoordinates = item && Number.isFinite(item.latitude) && item.latitude >= -90 && item.latitude <= 90 && Number.isFinite(item.longitude) && item.longitude >= -180 && item.longitude <= 180;
  return <Page><Heading title="Detection details" subtitle={id} />{loading ? <Busy /> : error && !item ? <Problem message={error} retry={() => void load()} /> : item ? <ScrollView contentContainerStyle={s.scroll}><Panel><Text style={s.sectionTitle}>{item.crack_type.replaceAll('-', ' ')}</Text><Badge value={item.severity} /><Text style={s.muted}>{item.location}</Text><Text style={s.muted}>Detected {new Date(item.detected_at).toLocaleString()}</Text><Text style={s.muted}>Coordinates {item.latitude}, {item.longitude}</Text>{hasCoordinates ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/(tabs)/map', params: { detectionId: item.id } })} style={s.action}><Text style={s.actionText}>View on Map</Text></Pressable> : <Text style={s.muted}>Map unavailable: this detection has invalid coordinates.</Text>}{item.width_mm != null ? <Text style={s.muted}>Width {item.width_mm} mm</Text> : null}{item.length_mm != null ? <Text style={s.muted}>Length {item.length_mm} mm</Text> : null}{item.depth_mm != null ? <Text style={s.muted}>Depth {item.depth_mm} mm</Text> : null}{item.description ? <Text>{item.description}</Text> : null}{item.image_url ? <Image source={{ uri: item.image_url }} accessibilityLabel="Detection evidence image" style={{ width: '100%', height: 220, borderRadius: 10, backgroundColor: '#E6EDF2' }} onError={() => setError('Evidence image could not be loaded.')} /> : <Text style={s.muted}>No evidence image is attached.</Text>}<Text style={s.muted}>Status: {item.status}</Text></Panel>{error ? <Problem message={error} /> : null}</ScrollView> : null}</Page>;
}
