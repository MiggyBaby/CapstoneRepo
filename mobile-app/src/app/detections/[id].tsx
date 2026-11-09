import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Badge, Busy, C, Heading, Page, Panel, Problem, label, s } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { addInspectionNote, fetchInspectionNotes, updateInspectionDetection, uploadInspectionImage, type InspectionEdits } from '@/services/inspection';
import { fetchDetection } from '@/services/detections';
import type { Crack, CrackReviewNote, CrackStatus } from '@/types/database';
import { updateDetectionStatus } from '@/services/review';

function nullableNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default function DetectionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const canInspect = session?.user.app_metadata.role === 'admin' || session?.user.app_metadata.role === 'inspector';
  const [item, setItem] = useState<Crack | null>(null);
  const [notes, setNotes] = useState<CrackReviewNote[]>([]);
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [crackType, setCrackType] = useState<Crack['crack_type']>('transverse');
  const [severity, setSeverity] = useState<Crack['severity']>('low');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [depth, setDepth] = useState('');
  const [duplicateOfId, setDuplicateOfId] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const detection = await fetchDetection(id);
      setItem(detection);
      setLocation(detection.location);
      setLatitude(String(detection.latitude));
      setLongitude(String(detection.longitude));
      setCrackType(detection.crack_type);
      setSeverity(detection.severity);
      setImageUrl(detection.image_url ?? '');
      setWidth(detection.width_mm == null ? '' : String(detection.width_mm));
      setLength(detection.length_mm == null ? '' : String(detection.length_mm));
      setDepth(detection.depth_mm == null ? '' : String(detection.depth_mm));
      setDuplicateOfId(detection.duplicate_of_id ?? '');
      setNotes(await fetchInspectionNotes(id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load this detection.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const hasCoordinates = item
    && Number.isFinite(item.latitude) && item.latitude >= -90 && item.latitude <= 90
    && Number.isFinite(item.longitude) && item.longitude >= -180 && item.longitude <= 180;
  const isForwarded = item?.review_state === 'forwarded';

  async function saveReview(action: 'mark_reviewed' | 'mark_pending' | 'mark_duplicate') {
    if (!item || saving || imageUploading || !canInspect || (isForwarded && action !== 'mark_reviewed')) return;
    setSaving(true);
    setError('');
    try {
      const edits: InspectionEdits = action === 'mark_duplicate' || action === 'mark_pending' ? {} : {
        location: location.trim(),
        coordinates: { lat: Number(latitude), lng: Number(longitude) },
        crack_type: crackType,
        severity,
        image_url: imageUrl.trim() || null,
        width_mm: nullableNumber(width),
        length_mm: nullableNumber(length),
        depth_mm: nullableNumber(depth),
      };
      if (action === 'mark_reviewed') {
        if (!edits.location) throw new Error('Location is required.');
        const coordinates = edits.coordinates;
        if (!coordinates || !Number.isFinite(coordinates.lat) || coordinates.lat < -90 || coordinates.lat > 90
          || !Number.isFinite(coordinates.lng) || coordinates.lng < -180 || coordinates.lng > 180) {
          throw new Error('Enter valid latitude and longitude coordinates.');
        }
        if (edits.width_mm === undefined || edits.length_mm === undefined || edits.depth_mm === undefined) {
          throw new Error('Measurements must be zero or greater, or left blank.');
        }
        if (selectedImage) {
          const mimeType = selectedImage.mimeType ?? 'image/jpeg';
          const extension = mimeType.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'jpg';
          const filename = selectedImage.fileName || `evidence-${Date.now()}.${extension}`;
          edits.image_url = await uploadInspectionImage(selectedImage.uri, filename, mimeType);
          setImageUrl(edits.image_url);
          setSelectedImage(null);
        }
      }
      const updated = await updateInspectionDetection(
        item.id,
        action,
        edits,
        action === 'mark_duplicate' ? duplicateOfId.trim() : undefined,
      );
      setItem(updated);
      setLocation(updated.location);
      setLatitude(String(updated.latitude));
      setLongitude(String(updated.longitude));
      setCrackType(updated.crack_type);
      setSeverity(updated.severity);
      setImageUrl(updated.image_url ?? '');
      setSelectedImage(null);
      setWidth(updated.width_mm == null ? '' : String(updated.width_mm));
      setLength(updated.length_mm == null ? '' : String(updated.length_mm));
      setDepth(updated.depth_mm == null ? '' : String(updated.depth_mm));
      setDuplicateOfId(updated.duplicate_of_id ?? '');
      if (isForwarded && action === 'mark_reviewed') {
        Alert.alert(
          'Follow-up review created',
          'The updated record is back under Ready to forward. Earlier forwarded batches keep their submitted details.',
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this inspection.');
    } finally {
      setSaving(false);
    }
  }

  async function chooseEvidenceImage() {
    if (imageUploading || saving) return;
    setError('');
    setImageUploading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      if (asset.fileSize != null && asset.fileSize > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5 MB.');
      }
      setSelectedImage(asset);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not upload the selected image.');
    } finally {
      setImageUploading(false);
    }
  }

  async function saveNote() {
    if (!item || saving || !noteDraft.trim()) return;
    setSaving(true);
    setError('');
    try {
      const note = await addInspectionNote(item.id, noteDraft.trim());
      setNotes(current => [...current, note]);
      setNoteDraft('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save inspector remark.');
    } finally {
      setSaving(false);
    }
  }

  async function saveWorkflowStatus(status: CrackStatus) {
    if (!item || saving) return;
    setSaving(true);
    setError('');
    try {
      const update = await updateDetectionStatus(item.id, status);
      setItem(current => current ? { ...current, ...update } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update workflow status.');
    } finally {
      setSaving(false);
    }
  }

  return <Page>
    <Heading title="Detection inspection" subtitle={id} />
    {loading ? <Busy /> : item ? <ScrollView contentContainerStyle={s.scroll}>
      <Panel>
        <View style={s.row}><Text style={s.sectionTitle}>{label(item.crack_type)}</Text><Badge value={item.severity} /></View>
        <Text style={s.muted}>{item.location}</Text>
        <Text style={s.muted}>Detected {new Date(item.detected_at).toLocaleString()}</Text>
        <Text style={s.muted}>Inspection: {label(item.review_state)}</Text>
        {item.source_device_id ? <Text style={s.muted}>Raspberry Pi device: {item.source_device_id}</Text> : null}
        <Text style={s.muted}>Coordinates {item.latitude}, {item.longitude}</Text>
        {hasCoordinates ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/(tabs)/map', params: { detectionId: item.id } })} style={s.action}><Text style={s.actionText}>View on Map</Text></Pressable> : null}
        {item.image_url ? <Image source={{ uri: item.image_url }} accessibilityLabel="Detection evidence image" style={{ width: '100%', height: 220, borderRadius: 10, backgroundColor: '#E6EDF2' }} /> : <Text style={s.muted}>No evidence image is attached.</Text>}
        {item.description ? <Text style={s.muted}>{item.description}</Text> : null}
      </Panel>

      <Panel>
        <Text style={s.sectionTitle}>Inspector review</Text>
        {canInspect ? <>
          <Text style={isForwarded ? s.muted : item.review_state === 'reviewed' ? { color: C.green, fontSize: 14, fontWeight: '700' } : s.muted}>
            {isForwarded
              ? 'This detection was forwarded. Save corrections below to create a follow-up review; its earlier submissions remain unchanged.'
              : item.review_state === 'reviewed'
              ? 'Reviewed and ready to forward. Save further corrections to keep it reviewed.'
              : 'Correct the detection fields before marking it reviewed.'}
          </Text>
          <TextInput accessibilityLabel="Location" style={s.input} placeholder="Location" value={location} onChangeText={setLocation} />
          <View style={s.row}>
            <TextInput accessibilityLabel="Latitude" style={[s.input, { flex: 1 }]} placeholder="Latitude" keyboardType="decimal-pad" value={latitude} onChangeText={setLatitude} />
            <TextInput accessibilityLabel="Longitude" style={[s.input, { flex: 1 }]} placeholder="Longitude" keyboardType="decimal-pad" value={longitude} onChangeText={setLongitude} />
          </View>
          <Text style={s.muted}>Defect type: {label(crackType)}</Text>
          <View style={styles.options}>{(['transverse', 'longitudinal', 'block', 'corner', 'diagonal', 'meandering', 'reflection', 'pothole'] as Crack['crack_type'][]).map(value => <Option key={value} title={label(value)} selected={crackType === value} onPress={() => setCrackType(value)} />)}</View>
          <Text style={s.muted}>Severity: {label(severity)}</Text>
          <View style={styles.options}>{(['low', 'medium', 'high', 'critical'] as Crack['severity'][]).map(value => <Option key={value} title={label(value)} selected={severity === value} onPress={() => setSeverity(value)} />)}</View>
          {selectedImage?.uri || imageUrl.trim() ? <Image source={{ uri: selectedImage?.uri || imageUrl.trim() }} accessibilityLabel="Selected evidence image preview" style={{ width: '100%', height: 180, borderRadius: 10, backgroundColor: '#E6EDF2' }} /> : null}
          <View style={s.row}>
            <Pressable accessibilityRole="button" disabled={saving || imageUploading} onPress={() => void chooseEvidenceImage()} style={[s.action, { flex: 1, opacity: saving || imageUploading ? 0.6 : 1 }]}><Text style={s.actionText}>{imageUploading ? 'Opening gallery…' : 'Choose from gallery'}</Text></Pressable>
            {imageUrl || selectedImage ? <Pressable accessibilityRole="button" disabled={saving || imageUploading} onPress={() => { setImageUrl(''); setSelectedImage(null); }} style={[s.action, { flex: 1, backgroundColor: C.red }]}><Text style={s.actionText}>Remove image</Text></Pressable> : null}
          </View>
          <TextInput accessibilityLabel="Evidence image URL" style={s.input} placeholder="Or enter an evidence image HTTPS URL" autoCapitalize="none" value={imageUrl} onChangeText={value => { setImageUrl(value); setSelectedImage(null); }} />
          <View style={s.row}>
            <TextInput accessibilityLabel="Width in millimeters" style={[s.input, { flex: 1 }]} placeholder="Width mm" keyboardType="decimal-pad" value={width} onChangeText={setWidth} />
            <TextInput accessibilityLabel="Length in millimeters" style={[s.input, { flex: 1 }]} placeholder="Length mm" keyboardType="decimal-pad" value={length} onChangeText={setLength} />
            <TextInput accessibilityLabel="Depth in millimeters" style={[s.input, { flex: 1 }]} placeholder="Depth mm" keyboardType="decimal-pad" value={depth} onChangeText={setDepth} />
          </View>
          <Pressable accessibilityRole="button" disabled={saving || imageUploading} onPress={() => void saveReview('mark_reviewed')} style={[s.action, { opacity: saving || imageUploading ? 0.6 : 1 }]}><Text style={s.actionText}>{saving ? selectedImage ? 'Uploading image and saving…' : 'Saving…' : isForwarded ? 'Save corrections and create follow-up review' : item.review_state === 'reviewed' ? 'Save corrections and keep reviewed' : 'Save corrections and mark reviewed'}</Text></Pressable>
          {!isForwarded ? <>
            {item.review_state !== 'pending' ? <Pressable accessibilityRole="button" disabled={saving} onPress={() => void saveReview('mark_pending')} style={s.action}><Text style={s.actionText}>Return to pending review</Text></Pressable> : null}
            <Text style={s.sectionTitle}>Exclude duplicate</Text>
            <Text style={s.muted}>This hides the record from the forwardable list but keeps it recoverable.</Text>
            <TextInput accessibilityLabel="Original detection ID" style={s.input} placeholder="Original detection ID" autoCapitalize="none" value={duplicateOfId} onChangeText={setDuplicateOfId} />
            <Pressable accessibilityRole="button" disabled={saving} onPress={() => Alert.alert('Mark as duplicate?', 'This will exclude the detection from forwarding but keep the record recoverable.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Mark duplicate', style: 'destructive', onPress: () => void saveReview('mark_duplicate') }])} style={[s.action, { backgroundColor: C.red }]}><Text style={s.actionText}>Mark as duplicate</Text></Pressable>
          </> : null}
        </> : <Text style={s.muted}>{isForwarded ? 'This record is forwarded and read-only.' : 'Inspector review is available to inspector and admin accounts.'}</Text>}
      </Panel>

      <Panel>
        <Text style={s.sectionTitle}>Inspector remarks</Text>
        {canInspect && !isForwarded ? <>
          <TextInput accessibilityLabel="Add inspector remark" style={[s.input, { minHeight: 90, height: undefined, textAlignVertical: 'top', paddingTop: 12 }]} placeholder="Add a note to the review history" multiline maxLength={2000} value={noteDraft} onChangeText={setNoteDraft} />
          <Pressable accessibilityRole="button" disabled={saving || !noteDraft.trim()} onPress={() => void saveNote()} style={[s.action, { opacity: saving || !noteDraft.trim() ? 0.55 : 1 }]}><Text style={s.actionText}>{saving ? 'Saving…' : 'Add remark'}</Text></Pressable>
        </> : null}
        {notes.length ? notes.map(note => <View key={note.id} style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 }}>
          <Text style={s.muted}>{new Date(note.created_at).toLocaleString()} · {note.author_id}</Text>
          <Text style={{ color: C.ink }}>{note.note}</Text>
        </View>) : <Text style={s.muted}>No inspector remarks yet.</Text>}
      </Panel>

      <Panel>
        <Text style={s.sectionTitle}>Response workflow status</Text>
        {canInspect ? <View style={{ gap: 8 }}>{(['new', 'assigned', 'in-progress', 'resolved'] as CrackStatus[]).map(status => {
          const current = item.status === status;
          return <Pressable key={status} accessibilityRole="button" accessibilityState={{ selected: current, disabled: current || saving || isForwarded }} disabled={current || saving || isForwarded} onPress={() => void saveWorkflowStatus(status)} style={[s.action, { backgroundColor: current ? C.green : C.blue, opacity: saving || isForwarded ? 0.6 : 1 }]}><Text style={s.actionText}>{current ? `Current: ${label(status)}` : `Set to ${label(status)}`}</Text></Pressable>;
        })}</View> : <Text style={s.muted}>Status: {label(item.status)}</Text>}
      </Panel>
      {error ? <Problem message={error} retry={() => void load()} /> : null}
    </ScrollView> : <Problem message={error || 'Detection not found.'} retry={() => void load()} />}
  </Page>;
}

function Option({ title, selected, onPress }: { title: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.option, selected && { backgroundColor: C.blue, borderColor: C.blue }]}>
    <Text style={{ color: selected ? C.white : C.ink, fontWeight: '600', fontSize: 12 }}>{title}</Text>
  </Pressable>;
}

const styles = {
  options: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 7 },
  option: { borderWidth: 1, borderColor: C.line, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: C.white },
};
