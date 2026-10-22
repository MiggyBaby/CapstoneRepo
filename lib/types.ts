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
  | 'transverse'
  | 'longitudinal'
  | 'block'
  | 'corner'
  | 'diagonal'
  | 'meandering'
  | 'reflection';

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
  region: string;
  districtOffice: string;
  inspectionDate: string;
  validationDate: string;
  stationing: string;
  landmark: string;
  roadSection: string;
  defectCode: ReportDefectCode;
  estimatedQuantity: number | null;
  unitOfMeasure: string;
  remarks: string;
  preparedBy: string;
  designation: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DistrictSummarySection {
  roadSection: string;
  stationing: string;
  landmark: string;
  lengthKm: number | null;
  quantities: Partial<Record<ReportDefectCode, number>>;
}

export interface DistrictSummary {
  id: string;
  region: string;
  districtOffice: string;
  inspectionDate: string;
  validationDate: string;
  sections: DistrictSummarySection[];
  preparedBy: string;
  preparedDesignation: string;
  reviewedBy: string;
  reviewedDesignation: string;
  notedBy: string;
  notedDesignation: string;
  createdAt: Date | string;
}

export type ReportDefectCode =
  | '01' | '02' | '03' | '04' | '05' | '06-A' | '06-C' | '06-P' | '06-Y'
  | '07' | '08' | '09' | '10' | '11' | '12' | '13' | '14' | '15-B'
  | '15-P' | '15-S' | '16';
