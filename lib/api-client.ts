import { Crack, CrackFilter, DistrictSummary, Report } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * API Client for DPWH Backend
 * Handles all API calls to the Next.js backend endpoints
 */

// ===== Cracks API =====

export async function fetchCracks(filters?: CrackFilter & { limit?: number; offset?: number }): Promise<Crack[]> {
  const params = new URLSearchParams();

  if (filters?.severity) {
    params.append('severity', Array.isArray(filters.severity) ? filters.severity[0] : filters.severity);
  }
  if (filters?.crackType) {
    params.append('type', Array.isArray(filters.crackType) ? filters.crackType[0] : filters.crackType);
  }
  if (filters?.location) {
    params.append('location', filters.location);
  }
  if (filters?.limit) {
    params.append('limit', filters.limit.toString());
  }
  if (filters?.offset) {
    params.append('offset', filters.offset.toString());
  }

  const query = params.toString();
  const response = await fetch(`${API_URL}/cracks${query ? `?${query}` : ''}`, { cache: 'no-store' });

  if (!response.ok) {
    let message = 'Failed to fetch cracks';
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // Keep the generic message when the server does not return JSON.
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data.data || [];
}

export async function fetchAllCracks(): Promise<Crack[]> {
  const pageSize = 500;
  const records: Crack[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await fetchCracks({ limit: pageSize, offset });
    records.push(...page);
    if (page.length < pageSize) return records;
  }
}

export async function fetchCrackById(id: string): Promise<Crack> {
  try {
    const response = await fetch(`${API_URL}/cracks/${id}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch crack');

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching crack:', error);
    throw error;
  }
}

export async function updateCrack(id: string, updates: Partial<Crack>): Promise<Crack> {
  return reportRequest<Crack>(`${API_URL}/cracks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteCrack(id: string): Promise<boolean> {
  await reportRequest<null>(`${API_URL}/cracks/${id}`, { method: 'DELETE' });
  return true;
}

// ===== Reports API =====

async function reportRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const { data: { session }, error: sessionError } = await (await import('@/lib/supabase')).getSupabaseClient().auth.getSession();
  if (sessionError) throw new Error('Unable to verify your sign-in session. Please sign in again.');
  const headers = new Headers(options?.headers);
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  const response = await fetch(url, { ...options, headers, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error || 'Report request failed');
  return result.data as T;
}

export function fetchReports(): Promise<Report[]> {
  return reportRequest<Report[]>(`${API_URL}/reports`);
}

export function createReport(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
  return reportRequest<Report>(`${API_URL}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  });
}

export function updateReport(id: string, updates: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
  return reportRequest<Report>(`${API_URL}/reports/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteReport(id: string): Promise<void> {
  await reportRequest<null>(`${API_URL}/reports/${id}`, { method: 'DELETE' });
}

export function fetchDistrictSummaries(): Promise<DistrictSummary[]> {
  return reportRequest<DistrictSummary[]>(`${API_URL}/district-summaries`);
}

export function createDistrictSummary(summary: Omit<DistrictSummary, 'id' | 'createdAt'>): Promise<DistrictSummary> {
  return reportRequest<DistrictSummary>(`${API_URL}/district-summaries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(summary),
  });
}

// ===== Analytics API =====

export interface AnalyticsData {
  totalCracks: number;
  criticalCracks: number;
  highCracks: number;
  mediumCracks: number;
  lowCracks: number;
  resolvedCracks: number;
  inProgressCracks: number;
  openCracks: number;
  averageResolutionHours: number | null;
  evidenceCracks: number;
  weeklyTrend: Array<{ date: string; day: string; count: number }>;
  cracksByType: Record<string, number>;
  cracksByStatus: Record<string, number>;
  timestamp: string;
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  try {
    const response = await fetch(`${API_URL}/analytics`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch analytics');

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}

// ===== Uploads API =====

export interface UploadResponse {
  filename: string;
  url: string;
  size: number;
  type: string;
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return reportRequest<UploadResponse>(`${API_URL}/uploads`, { method: 'POST', body: formData });
}

// ===== Health API =====

export interface HealthStatus {
  status: 'operational' | 'down';
  message: string;
  timestamp: string;
  version: string;
}

export async function checkApiHealth(): Promise<HealthStatus> {
  try {
    const response = await fetch(`${API_URL}/health`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Health check failed.');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking API health:', error);
    throw error;
  }
}
