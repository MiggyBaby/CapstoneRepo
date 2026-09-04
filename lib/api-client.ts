import { Crack, CrackFilter } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * API Client for DPWH Backend
 * Handles all API calls to the Next.js backend endpoints
 */

// ===== Cracks API =====

export async function fetchCracks(filters?: CrackFilter & { limit?: number }): Promise<Crack[]> {
  try {
    const params = new URLSearchParams();

    if (filters?.severity) {
      params.append('severity', Array.isArray(filters.severity) ? filters.severity[0] : filters.severity);
    }
    if (filters?.crackType) {
      params.append('type', Array.isArray(filters.crackType) ? filters.crackType[0] : filters.crackType);
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    const response = await fetch(`${API_URL}/cracks?${params}`);
    if (!response.ok) throw new Error('Failed to fetch cracks');

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching cracks:', error);
    throw error;
  }
}

export async function fetchCrackById(id: string): Promise<Crack> {
  try {
    const response = await fetch(`${API_URL}/cracks/${id}`);
    if (!response.ok) throw new Error('Failed to fetch crack');

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching crack:', error);
    throw error;
  }
}

export async function createCrack(crack: Omit<Crack, 'id' | 'createdAt' | 'updatedAt'>): Promise<Crack> {
  try {
    const response = await fetch(`${API_URL}/cracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(crack),
    });

    if (!response.ok) throw new Error('Failed to create crack');

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating crack:', error);
    throw error;
  }
}

export async function updateCrack(id: string, updates: Partial<Crack>): Promise<Crack> {
  try {
    const response = await fetch(`${API_URL}/cracks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) throw new Error('Failed to update crack');

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error updating crack:', error);
    throw error;
  }
}

export async function deleteCrack(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/cracks/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete crack');
    return true;
  } catch (error) {
    console.error('Error deleting crack:', error);
    throw error;
  }
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
  cracksByType: Record<string, number>;
  cracksByStatus: Record<string, number>;
  timestamp: string;
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  try {
    const response = await fetch(`${API_URL}/analytics`);
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
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/uploads`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload image');

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
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
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking API health:', error);
    throw error;
  }
}
