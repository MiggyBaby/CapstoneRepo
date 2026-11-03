import type { Crack, CrackStatus, ValidationReport, Severity } from '@/types/database';

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type CrackRow = Crack & { coordinates: unknown };
type DistrictSummaryRow = {
  id: string;
  region: string;
  district_office: string;
  inspection_date: string;
  validation_date: string | null;
  sections: unknown;
  prepared_by: string;
  prepared_designation: string;
  reviewed_by: string;
  reviewed_designation: string;
  noted_by: string;
  noted_designation: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      cracks: Table<CrackRow>;
      validation_reports: Table<ValidationReport>;
      district_summaries: Table<DistrictSummaryRow>;
    };
    Views: {
      crack_records: { Row: Crack; Relationships: [] };
    };
    Functions: Record<never, never>;
    Enums: {
      crack_severity: Severity;
      crack_status: CrackStatus;
      crack_type: Crack['crack_type'];
    };
    CompositeTypes: Record<never, never>;
  };
};
