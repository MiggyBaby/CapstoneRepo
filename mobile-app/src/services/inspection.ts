import { supabase } from '@/lib/supabase';
import type { Crack, CrackReviewNote, InspectionBatch } from '@/types/database';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
type ReviewAction = 'mark_reviewed' | 'mark_pending' | 'mark_duplicate';
export type InspectionEdits = Partial<Pick<
  Crack,
  'location' | 'image_url' | 'crack_type' | 'severity'
  | 'width_mm' | 'length_mm' | 'depth_mm' | 'status'
>> & { coordinates?: { lat: number; lng: number } };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function inspectionRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!supabase) throw new Error('Supabase is not configured.');
  if (!API_URL) throw new Error('Set EXPO_PUBLIC_API_URL in mobile-app/.env to your website API base URL.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error('Unable to verify your sign-in session. Please sign in again.');
  if (!data.session) throw new Error('Sign in before using inspection tools.');

  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${data.session.access_token}`);
  if (init?.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The website API returned an invalid response.');
  }
  if (!isObject(payload)) throw new Error('The website API returned an invalid response.');
  if (!response.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Inspection request failed.');
  }
  return payload.data as T;
}

export function fetchInspectionDetections(): Promise<Crack[]> {
  return inspectionRequest<Crack[]>('/inspections/detections');
}

export function updateInspectionDetection(
  id: string,
  action: ReviewAction,
  edits: InspectionEdits = {},
  duplicateOfId?: string,
): Promise<Crack> {
  return inspectionRequest<Crack>(`/inspections/detections/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ action, ...edits, ...(duplicateOfId ? { duplicateOfId } : {}) }),
  });
}

export function fetchInspectionNotes(id: string): Promise<CrackReviewNote[]> {
  return inspectionRequest<CrackReviewNote[]>(`/inspections/detections/${encodeURIComponent(id)}/notes`);
}

export function addInspectionNote(id: string, note: string): Promise<CrackReviewNote> {
  return inspectionRequest<CrackReviewNote>(`/inspections/detections/${encodeURIComponent(id)}/notes`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export async function forwardInspectionBatch(crackIds: string[]): Promise<string> {
  const result = await inspectionRequest<{ id: string }>('/inspections/batches', {
    method: 'POST',
    body: JSON.stringify({ crackIds }),
  });
  return result.id;
}

export function fetchInspectionBatches(): Promise<InspectionBatch[]> {
  return inspectionRequest<InspectionBatch[]>('/inspections/batches');
}
