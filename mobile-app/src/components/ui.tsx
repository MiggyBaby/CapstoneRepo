import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Crack } from '@/types/database';

export const C = { ink: '#102A43', muted: '#627D98', blue: '#176B87', bg: '#F3F6F8', line: '#D9E2EC', white: '#FFFFFF', red: '#B42318', green: '#18794E', amber: '#9A6700' };
export function Page({ children }: React.PropsWithChildren) { return <View style={s.page}>{children}</View>; }
export function Heading({ title, subtitle }: { title: string; subtitle?: string }) { return <View style={s.heading}><Text style={s.title}>{title}</Text>{subtitle ? <Text style={s.muted}>{subtitle}</Text> : null}</View>; }
export function Panel({ children }: React.PropsWithChildren) { return <View style={s.panel}>{children}</View>; }
export function Action({ title, onPress, secondary = false }: { title: string; onPress: () => void; secondary?: boolean }) { return <Pressable onPress={onPress} style={[s.action, secondary && s.secondary]}><Text style={[s.actionText, secondary && { color: C.blue }]}>{title}</Text></Pressable>; }
export function Busy() { return <View style={s.center}><ActivityIndicator color={C.blue} /><Text style={s.muted}>Loading records…</Text></View>; }
export function Problem({ message, retry }: { message: string; retry?: () => void }) { return <Panel><Text style={s.problem}>{message}</Text>{retry ? <Action title="Try again" onPress={retry} secondary /> : null}</Panel>; }
export function DetectionCard({ item }: { item: Crack }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showSample = !item.image_url || imageFailed;
  useEffect(() => setImageFailed(false), [item.image_url]);
  return <Pressable onPress={() => router.push(`/detections/${item.id}`)} style={s.card}>
    <View style={s.evidenceFrame}>
      <Image
        source={!item.image_url || imageFailed ? require('@/assets/images/example-road-defect.jpg') : { uri: item.image_url }}
        accessibilityLabel={showSample ? 'Illustrative sample road defect image' : 'Detection evidence image'}
        contentFit="cover"
        cachePolicy="disk"
        onError={() => setImageFailed(true)}
        style={s.evidenceImage}
      />
      {showSample ? <View style={s.sampleBadge}><Text style={s.sampleBadgeText}>EXAMPLE PHOTO</Text></View> : null}
    </View>
    <View style={s.row}><Text style={s.cardTitle}>{label(item.crack_type)}</Text><Badge value={item.severity} /></View>
    <Text style={s.muted} numberOfLines={1}>{item.location}</Text>
    <View style={[s.row, { marginTop: 8 }]}><Text style={s.small}>{new Date(item.detected_at).toLocaleString()}</Text><Text style={s.status}>{label(item.status)}</Text></View>
  </Pressable>;
}
export function Badge({ value }: { value: string }) { const color = value === 'critical' || value === 'high' ? C.red : value === 'resolved' || value === 'low' ? C.green : C.amber; return <Text style={[s.badge, { color, borderColor: color }]}>{label(value)}</Text>; }
export function label(value: string) { return value.replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
export const s = StyleSheet.create({ page: { flex: 1, backgroundColor: C.bg, padding: 20, gap: 16 }, scroll: { flexGrow: 1, paddingBottom: 30 }, heading: { gap: 5 }, title: { fontSize: 26, color: C.ink, fontWeight: '800' }, muted: { color: C.muted, fontSize: 14 }, panel: { backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.line, padding: 16, gap: 10 }, card: { backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.line, padding: 14, gap: 7 }, evidenceFrame: { height: 150, borderRadius: 9, overflow: 'hidden', backgroundColor: '#E6EDF2', marginBottom: 5 }, evidenceImage: { width: '100%', height: '100%' }, sampleBadge: { position: 'absolute', right: 9, bottom: 9, backgroundColor: '#102A43E6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 }, sampleBadgeText: { color: C.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }, cardTitle: { color: C.ink, fontSize: 16, fontWeight: '700' }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, small: { color: C.muted, fontSize: 12 }, status: { color: C.ink, fontSize: 12, fontWeight: '600' }, badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, fontSize: 11, fontWeight: '700' }, action: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue, borderRadius: 9, minHeight: 44, paddingHorizontal: 14 }, secondary: { backgroundColor: C.white, borderWidth: 1, borderColor: C.blue }, actionText: { color: C.white, fontWeight: '700' }, center: { padding: 28, alignItems: 'center', gap: 10 }, problem: { color: C.red, lineHeight: 21 }, input: { borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 9, paddingHorizontal: 12, height: 46, color: C.ink }, sectionTitle: { color: C.ink, fontWeight: '700', fontSize: 16 }, metric: { fontSize: 28, color: C.ink, fontWeight: '800' } });
