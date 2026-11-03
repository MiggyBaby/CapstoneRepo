export type CrackStatus = 'new' | 'assigned' | 'in-progress' | 'resolved';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Crack = {
  id: string; location: string; latitude: number; longitude: number; image_url: string | null;
  crack_type: 'transverse' | 'longitudinal' | 'block' | 'corner' | 'diagonal' | 'meandering' | 'reflection';
  severity: Severity; status: CrackStatus; width_mm: number | null; length_mm: number | null;
  depth_mm: number | null; description: string | null; assigned_to: string | null;
  detected_at: string; resolved_at: string | null; created_at: string; updated_at: string;
};
export type ValidationReport = {
  id: string; region: string; district_office: string; inspection_date: string; validation_date: string | null;
  road_section: string; defect_code: string; estimated_quantity: number | null; unit_of_measure: string;
  remarks: string; prepared_by: string; designation: string; created_at: string; updated_at: string;
};
