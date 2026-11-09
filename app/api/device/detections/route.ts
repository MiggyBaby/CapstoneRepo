import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { hasValidPiDeviceToken } from '@/lib/pi-device-auth';
import { validatePiDetection } from '@/lib/pi-detection-validation';

export const dynamic = 'force-dynamic';
const MAX_BODY_BYTES = 32_768;

export async function POST(request: NextRequest) {
  const authorized = hasValidPiDeviceToken(request);
  if (authorized === null) {
    console.error('Pi ingestion is not configured: PI_INGESTION_TOKEN is missing.');
    return NextResponse.json({ success: false, error: 'Device ingestion is not configured.' }, { status: 503 });
  }
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'A valid device bearer token is required.' }, { status: 401 });
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, error: 'Request body must be at most 32 KB.' }, { status: 413 });
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return NextResponse.json({ success: false, error: 'Request body must contain valid JSON.' }, { status: 400 });
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      return NextResponse.json({ success: false, error: 'Request body must be at most 32 KB.' }, { status: 413 });
    }
    chunks.push(value);
  }

  let body: unknown;
  try {
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must contain valid JSON.' }, { status: 400 });
  }

  const validation = validatePiDetection(body);
  if ('error' in validation) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  try {
    const detection = validation.value;
    const values = {
      source_device_id: detection.deviceId,
      source_detection_id: detection.detectionId,
      location: detection.location,
      latitude: detection.latitude,
      longitude: detection.longitude,
      coordinates: `POINT(${detection.longitude} ${detection.latitude})`,
      image_url: detection.imageUrl,
      crack_type: detection.crackType,
      severity: detection.severity,
      status: 'new' as const,
      width_mm: detection.widthMm,
      length_mm: detection.lengthMm,
      depth_mm: detection.depthMm,
      description: detection.description,
      detected_at: detection.detectedAt,
    };

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('cracks')
      .upsert(values, {
        onConflict: 'source_device_id,source_detection_id',
        ignoreDuplicates: true,
      })
      .select('id,location,latitude,longitude,image_url,crack_type,severity,status,width_mm,length_mm,depth_mm,description,detected_at,source_device_id,source_detection_id')
      .maybeSingle();
    if (error) throw error;

    if (data) return NextResponse.json({ success: true, duplicate: false, data }, { status: 201 });

    const { data: existing, error: lookupError } = await admin
      .from('cracks')
      .select('id,location,latitude,longitude,image_url,crack_type,severity,status,width_mm,length_mm,depth_mm,description,detected_at,source_device_id,source_detection_id')
      .eq('source_device_id', detection.deviceId)
      .eq('source_detection_id', detection.detectionId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) throw new Error('Idempotent detection lookup returned no record.');

    return NextResponse.json({ success: true, duplicate: true, data: existing });
  } catch (error) {
    console.error('Error ingesting Raspberry Pi detection:', error);
    return NextResponse.json({ success: false, error: 'Failed to save detection.' }, { status: 500 });
  }
}
