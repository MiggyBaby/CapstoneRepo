import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { ReportDefectCode } from '@/lib/types';

export const dynamic = 'force-dynamic';

const defectCodes: ReportDefectCode[] = [
  '01', '02', '03', '04', '05', '06-A', '06-C', '06-P', '06-Y', '07',
  '08', '09', '10', '11', '12', '13', '14', '15-B', '15-P', '15-S', '16',
];

function toReport(record: any) {
  return {
    id: record.id,
    region: record.region,
    districtOffice: record.district_office,
    inspectionDate: record.inspection_date,
    validationDate: record.validation_date || '',
    stationing: record.stationing || '',
    landmark: record.landmark || '',
    roadSection: record.road_section,
    defectCode: record.defect_code,
    estimatedQuantity: record.estimated_quantity == null ? null : Number(record.estimated_quantity),
    unitOfMeasure: record.unit_of_measure || '',
    remarks: record.remarks || '',
    preparedBy: record.prepared_by,
    designation: record.designation || '',
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapReport(body: Record<string, unknown>) {
  const required = ['region', 'districtOffice', 'inspectionDate', 'roadSection', 'defectCode', 'preparedBy'];
  if (required.some((field) => typeof body[field] !== 'string' || !String(body[field]).trim())) {
    return { error: 'Complete the region, district, inspection date, road section, defect, and preparer fields.' };
  }
  if (!defectCodes.includes(body.defectCode as ReportDefectCode)) {
    return { error: 'Select a valid defect code.' };
  }
  const quantity = body.estimatedQuantity;
  if (quantity !== null && quantity !== '' && (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 0)) {
    return { error: 'Estimated quantity must be zero or greater.' };
  }

  return {
    value: {
      region: String(body.region).trim(),
      district_office: String(body.districtOffice).trim(),
      inspection_date: String(body.inspectionDate),
      validation_date: typeof body.validationDate === 'string' && body.validationDate ? body.validationDate : null,
      stationing: typeof body.stationing === 'string' ? body.stationing.trim() : '',
      landmark: typeof body.landmark === 'string' ? body.landmark.trim() : '',
      road_section: String(body.roadSection).trim(),
      defect_code: body.defectCode,
      estimated_quantity: quantity === '' ? null : quantity,
      unit_of_measure: typeof body.unitOfMeasure === 'string' ? body.unitOfMeasure.trim() : '',
      remarks: typeof body.remarks === 'string' ? body.remarks.trim() : '',
      prepared_by: String(body.preparedBy).trim(),
      designation: typeof body.designation === 'string' ? body.designation.trim() : '',
    },
  };
}

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) return NextResponse.json({ success: true, data: [], count: 0 });

    const { data, error } = await getSupabaseAdmin()
      .from('validation_reports')
      .select('*')
      .order('inspection_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    const reports = (data || []).map(toReport);
    return NextResponse.json({ success: true, data: reports, count: reports.length });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({
      success: false,
      error: 'Could not load reports. Run supabase/migrations/002_validation_reports.sql in the Supabase SQL Editor and verify the Supabase URL and service key in .env.local.',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mapped = mapReport(body);
    if ('error' in mapped) return NextResponse.json({ success: false, error: mapped.error }, { status: 400 });

    const { data, error } = await getSupabaseAdmin()
      .from('validation_reports')
      .insert(mapped.value)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data: toReport(data) }, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({
      success: false,
      error: 'Could not save report. Run supabase/migrations/002_validation_reports.sql in the Supabase SQL Editor and verify the Supabase URL and service key in .env.local.',
    }, { status: 500 });
  }
}