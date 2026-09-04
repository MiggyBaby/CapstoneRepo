export interface Crack {
  id: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  imageUrl: string;
  crackType: CrackType;
  severity: Severity;
  detectedAt: Date | string;
  width?: number; // in mm
  length?: number; // in mm
  depth?: number; // in mm
  description?: string;
  status: 'new' | 'assigned' | 'in-progress' | 'resolved';
  assignedTo?: string;
  resolvedAt?: Date | string;
  metadata?: {
    temperature?: number;
    humidity?: number;
    weatherCondition?: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type CrackType =
  | 'longitudinal'
  | 'transverse'
  | 'alligator'
  | 'edge'
  | 'reflection'
  | 'other';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface CrackFilter {
  severity?: Severity | Severity[];
  crackType?: CrackType | CrackType[];
  status?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: string;
}

export interface StatisticsData {
  totalCracks: number;
  criticalCracks: number;
  resolvedCracks: number;
  averageSeverity: number;
  cracksByType: Record<CrackType, number>;
  cracksBySeverity: Record<Severity, number>;
  weeklyTrend: Array<{
    date: string;
    count: number;
  }>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'inspector' | 'worker' | 'viewer';
  avatar?: string;
  createdAt: Date | string;
}

export interface Report {
  id: string;
  crackId: string;
  reportedBy: string;
  status: 'new' | 'reviewed' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date | string;
  description: string;
}
