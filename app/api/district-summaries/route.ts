import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { REPORT_DEFECTS } from '@/lib/report-defects';
import type { DistrictSummarySection, ReportDefectCode } from '@/lib/types';

export const dynamic = 'force-dynamic';

const defectCodes = new Set(REPORT_DEFECTS.map(({ code }) => code));

function toDistrictSummary(record: any) {
  return {
    id: record.id,
    region: record.region,
    districtOffice: record.district_office,
    inspectionDate: record.inspection_date,
    validationDate: record.validation_date || '',
    sections: record.sections || [],
    preparedBy: record.prepared_by,
    preparedDesignation: record.prepared_designation || '',
    reviewedBy: record.reviewed_by,
    reviewedDesignation: record.reviewed_designation || '',
    notedBy: record.noted_by,
    notedDesignation: record.noted_designation || '',
    createdAt: record.created_at,
  };
}

function validateSummary(body: any) {
  const requiredFields = ['region', 'districtOffice', 'inspectionDate', 'preparedBy', 'reviewedBy', 'notedBy'];
  if (requiredFields.some((field) => typeof body[field] !== 'string' || !body[field].trim())) {
    return { error: 'Complete the region, district, inspection date, and all three signatory names.' };
  }
  if (!Array.isArray(body.sections) || body.sections.length === 0) {
    return { error: 'Add at least one road section.' };
  }

  const sections: DistrictSummarySection[] = [];
  for (const section of body.sections) {
    if (!section || typeof section.roadSection !== 'string' || !section.roadSection.trim()) {
      return { error: 'Every section must have a road section name.' };
    }
    if (section.lengthKm != null && (typeof section.lengthKm !== 'number' || !Number.isFinite(section.lengthKm) || section.lengthKm < 0)) {
      return { error: 'Section lengths must be zero or greater.' };
    }

    const quantities: DistrictSummarySection['quantities'] = {};
    for (const [code, quantity] of Object.entries(section.quantities || {})) {
      if (!defectCodes.has(code as ReportDefectCode)) return { error: `Unknown defect code: ${code}.` };
      if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 0) {
        return { error: 'Defect quantities must be zero or greater.' };
      }
      quantities[code as ReportDefectCode] = quantity;
    }

    sections.push({
      roadSection: section.roadSection.trim(),
      stationing: typeof section.stationing === 'string' ? section.stationing.trim() : '',
      landmark: typeof section.landmark === 'string' ? section.landmark.trim() : '',
      lengthKm: section.lengthKm ?? null,
      quantities,
    });
  }

  return {
    value: {
      region: body.region.trim(),
      district_office: body.districtOffice.trim(),
      inspection_date: body.inspectionDate,
      validation_date: typeof body.validationDate === 'string' && body.validationDate ? body.validationDate : null,
      sections,
      prepared_by: body.preparedBy.trim(),
      prepared_designation: typeof body.preparedDesignation === 'string' ? body.preparedDesignation.trim() : '',
      reviewed_by: body.reviewedBy.trim(),
      reviewed_designation: typeof body.reviewedDesignation === 'string' ? body.reviewedDesignation.trim() : '',
      noted_by: body.notedBy.trim(),
      noted_designation: typeof body.notedDesignation === 'string' ? body.notedDesignation.trim() : '',
    },
  };
}

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('district_summaries')
      .select('*')
      .order('inspection_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    const summaries = (data || []).map(toDistrictSummary);
    return NextResponse.json({ success: true, data: summaries, count: summaries.length });
  } catch (error) {
    console.error('Error fetching district summaries:', error);
    return NextResponse.json({
      success: false,
      error: 'Could not load district summaries. Run supabase/migrations/005_district_summaries.sql in the Supabase SQL Editor and verify the Supabase URL and service key in .env.local.',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mapped = validateSummary(body);
    if ('error' in mapped) return NextResponse.json({ success: false, error: mapped.error }, { status: 400 });

    const { data, error } = await getSupabaseAdmin()
      .from('district_summaries')
      .insert(mapped.value)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data: toDistrictSummary(data) }, { status: 201 });
  } catch (error) {
    console.error('Error creating district summary:', error);
    return NextResponse.json({
      success: false,
      error: 'Could not create district summary. Verify the district summaries migration and Supabase configuration.',
    }, { status: 500 });
  }
}