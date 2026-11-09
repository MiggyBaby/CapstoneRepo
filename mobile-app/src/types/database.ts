export type CrackStatus = 'new' | 'assigned' | 'in-progress' | 'resolved';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Crack = {
  id: string; location: string; latitude: number; longitude: number; image_url: string | null;
  crack_type: 'transverse' | 'longitudinal' | 'block' | 'corner' | 'diagonal' | 'meandering' | 'reflection' | 'pothole';
  severity: Severity; status: CrackStatus; width_mm: number | null; length_mm: number | null;
  depth_mm: number | null; description: string | null; assigned_to: string | null;
  source_device_id: string | null; source_detection_id: string | null;
  review_state: 'pending' | 'reviewed' | 'duplicate' | 'forwarded';
  duplicate_of_id: string | null; reviewed_by: string | null; reviewed_at: string | null;
  return_review_note?: string | null; return_reviewed_at?: string | null;
  detected_at: string; resolved_at: string | null; created_at: string; updated_at: string;
};
export type CrackReviewNote = {
  id: string; crack_id: string; author_id: string; note: string; created_at: string;
};
export type InspectionBatchItem = { crack_id: string; cracks: Crack | null };
export type InspectionBatch = {
  id: string; submitted_by: string; submitted_at: string;
  review_status: 'pending_review' | 'reviewed' | 'changes_requested';
  department_note: string | null; reviewed_by: string | null; reviewed_at: string | null;
  inspection_batch_items: InspectionBatchItem[];
};
export type ValidationReport = {
  id: string; region: string; district_office: string; inspection_date: string; validation_date: string | null;
  road_section: string; defect_code: string; estimated_quantity: number | null; unit_of_measure: string;
  remarks: string; prepared_by: string; designation: string; created_at: string; updated_at: string;
};
