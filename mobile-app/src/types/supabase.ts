import type { Crack, CrackReviewNote, CrackStatus, InspectionBatch, ValidationReport, Severity } from '@/types/database';

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
      crack_review_notes: Table<CrackReviewNote>;
      validation_reports: Table<ValidationReport>;
      inspection_batches: Table<InspectionBatch, Pick<InspectionBatch, 'submitted_by'>, Partial<InspectionBatch>>;
      inspection_batch_items: Table<{ batch_id: string; crack_id: string }>;
      district_summaries: Table<DistrictSummaryRow>;
    };
    Views: {
      crack_records: { Row: Crack; Relationships: [] };
    };
    Functions: {
      forward_inspection_batch: {
        Args: { p_crack_ids: string[]; p_submitted_by: string };
        Returns: string;
      };
    };
    Enums: {
      crack_severity: Severity;
      crack_status: CrackStatus;
      crack_type: Crack['crack_type'];
    };
    CompositeTypes: Record<never, never>;
  };
};
