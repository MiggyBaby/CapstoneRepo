import { SUPPORTED_CRACK_TYPES } from '@/lib/crack-types';

const severities = ['low', 'medium', 'high', 'critical'] as const;
const identifierPattern = /^[A-Za-z0-9._:-]+$/;

export type PiDetection = {
  deviceId: string;
  detectionId: string;
  location: string;
  latitude: number;
  longitude: number;
  crackType: (typeof SUPPORTED_CRACK_TYPES)[number];
  severity: (typeof severities)[number];
  imageUrl: string | null;
  widthMm: number | null;
  lengthMm: number | null;
  depthMm: number | null;
  description: string | null;
  detectedAt: string;
};

type ValidationResult = { value: PiDetection } | { error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalMeasurement(value: unknown, name: string): number | null | string {
  if (value == null || value === '') return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return `${name} must be a non-negative number.`;
  }
  return value;
}

export function validatePiDetection(body: unknown): ValidationResult {
  if (!isObject(body)) return { error: 'Request body must be a JSON object.' };

  const { deviceId, detectionId, location, coordinates, crackType, severity } = body;
  if (
    typeof deviceId !== 'string'
    || deviceId.length > 64
    || !identifierPattern.test(deviceId)
  ) {
    return { error: 'deviceId must be 1 to 64 letters, numbers, dots, underscores, colons, or hyphens.' };
  }
  if (
    typeof detectionId !== 'string'
    || detectionId.length > 128
    || !identifierPattern.test(detectionId)
  ) {
    return { error: 'detectionId must be 1 to 128 letters, numbers, dots, underscores, colons, or hyphens.' };
  }
  if (typeof location !== 'string' || !location.trim() || location.trim().length > 500) {
    return { error: 'location is required and must be at most 500 characters.' };
  }
  if (!isObject(coordinates)) return { error: 'coordinates must include numeric lat and lng values.' };
  const { lat, lng } = coordinates;
  if (
    typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90
    || typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180
  ) {
    return { error: 'coordinates must include valid latitude and longitude values.' };
  }
  if (typeof crackType !== 'string' || !SUPPORTED_CRACK_TYPES.includes(crackType as PiDetection['crackType'])) {
    return { error: 'crackType must be a supported DPWH road defect type.' };
  }
  if (typeof severity !== 'string' || !severities.includes(severity as PiDetection['severity'])) {
    return { error: 'severity must be low, medium, high, or critical.' };
  }

  const imageUrl = body.imageUrl;
  let normalizedImageUrl: string | null = null;
  if (imageUrl != null && imageUrl !== '') {
    if (typeof imageUrl !== 'string' || imageUrl.length > 2048) {
      return { error: 'imageUrl must be an HTTPS URL of at most 2048 characters.' };
    }
    try {
      if (new URL(imageUrl).protocol !== 'https:') throw new Error();
    } catch {
      return { error: 'imageUrl must be a valid HTTPS URL.' };
    }
    normalizedImageUrl = imageUrl;
  }

  const widthMm = optionalMeasurement(body.widthMm, 'widthMm');
  const lengthMm = optionalMeasurement(body.lengthMm, 'lengthMm');
  const depthMm = optionalMeasurement(body.depthMm, 'depthMm');
  if (typeof widthMm === 'string') return { error: widthMm };
  if (typeof lengthMm === 'string') return { error: lengthMm };
  if (typeof depthMm === 'string') return { error: depthMm };

  const description = body.description;
  if (description != null && (typeof description !== 'string' || description.length > 5000)) {
    return { error: 'description must be at most 5000 characters.' };
  }

  const detectedAtInput = body.detectedAt;
  const detectedAt = detectedAtInput == null ? new Date().toISOString() : detectedAtInput;
  if (typeof detectedAt !== 'string' || !Number.isFinite(Date.parse(detectedAt))) {
    return { error: 'detectedAt must be a valid date/time string.' };
  }

  return {
    value: {
      deviceId,
      detectionId,
      location: location.trim(),
      latitude: lat,
      longitude: lng,
      crackType: crackType as PiDetection['crackType'],
      severity: severity as PiDetection['severity'],
      imageUrl: normalizedImageUrl,
      widthMm,
      lengthMm,
      depthMm,
      description: typeof description === 'string' && description.trim() ? description.trim() : null,
      detectedAt: new Date(detectedAt).toISOString(),
    },
  };
}
