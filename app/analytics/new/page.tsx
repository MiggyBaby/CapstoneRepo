'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import { createDistrictSummary } from '@/lib/api-client';
import { REPORT_DEFECTS } from '@/lib/report-defects';
import type { DistrictSummarySection, ReportDefectCode } from '@/lib/types';

interface SectionDraft extends Omit<DistrictSummarySection, 'lengthKm' | 'quantities'> {
  key: string;
  lengthKm: string;
  quantities: Partial<Record<ReportDefectCode, string>>;
}

const inputClass = 'w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-100';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase text-gray-600';

function createSection(): SectionDraft {
  return {
    key: `${Date.now()}-${Math.random()}`,
    roadSection: '',
    stationing: '',
    landmark: '',
    lengthKm: '',
    quantities: {},
  };
}

export default function NewDistrictSummaryPage() {
  const router = useRouter();
  const [region, setRegion] = useState('');
  const [districtOffice, setDistrictOffice] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [validationDate, setValidationDate] = useState('');
  const [sections, setSections] = useState<SectionDraft[]>([createSection()]);
  const [preparedBy, setPreparedBy] = useState('');
  const [preparedDesignation, setPreparedDesignation] = useState('');
  const [reviewedBy, setReviewedBy] = useState('');
  const [reviewedDesignation, setReviewedDesignation] = useState('');
  const [notedBy, setNotedBy] = useState('');
  const [notedDesignation, setNotedDesignation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateSection(key: string, updates: Partial<SectionDraft>) {
    setSections((current) => current.map((section) => section.key === key ? { ...section, ...updates } : section));
  }

  function updateQuantity(key: string, code: ReportDefectCode, value: string) {
    setSections((current) => current.map((section) => section.key === key
      ? { ...section, quantities: { ...section.quantities, [code]: value } }
      : section));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const created = await createDistrictSummary({
        region,
        districtOffice,
        inspectionDate,
        validationDate,
        sections: sections.map(({ key, lengthKm, quantities, ...section }) => ({
          ...section,
          lengthKm: lengthKm === '' ? null : Number(lengthKm),
          quantities: Object.fromEntries(
            Object.entries(quantities)
              .filter(([, quantity]) => quantity !== '')
              .map(([code, quantity]) => [code, Number(quantity)]),
          ),
        })),
        preparedBy,
        preparedDesignation,
        reviewedBy,
        reviewedDesignation,
        notedBy,
        notedDesignation,
      });
      router.push(`/analytics?summary=${created.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create district summary.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <Link href="/analytics" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-900">
            <FiArrowLeft aria-hidden="true" /> District Summary
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">New District Summary</h1>
          <p className="mt-1 text-sm text-gray-600">Enter inspection details and defect quantities by road section.</p>
        </div>
      </header>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
        {error && <p role="alert" className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

        <section className="border-b border-gray-200 pb-6" aria-labelledby="summary-details-heading">
          <h2 id="summary-details-heading" className="mb-4 text-lg font-semibold text-gray-900">Office and inspection details</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label><span className={labelClass}>Region *</span><input required value={region} onChange={(event) => setRegion(event.target.value)} className={inputClass} /></label>
            <label><span className={labelClass}>District office *</span><input required value={districtOffice} onChange={(event) => setDistrictOffice(event.target.value)} className={inputClass} /></label>
            <label><span className={labelClass}>Date of inspection *</span><input required type="date" value={inspectionDate} onChange={(event) => setInspectionDate(event.target.value)} className={inputClass} /></label>
            <label><span className={labelClass}>Date of validation</span><input type="date" value={validationDate} onChange={(event) => setValidationDate(event.target.value)} className={inputClass} /></label>
          </div>
        </section>

        <section className="space-y-5" aria-labelledby="sections-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="sections-heading" className="text-lg font-semibold text-gray-900">Road sections and defects</h2>
              <p className="mt-1 text-sm text-gray-600">Enter quantities only for defects found in each section.</p>
            </div>
            <button type="button" onClick={() => setSections((current) => [...current, createSection()])} className="inline-flex items-center gap-2 border border-primary-700 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50">
              <FiPlus aria-hidden="true" /> Add road section
            </button>
          </div>

          {sections.map((section, index) => (
            <fieldset key={section.key} className="min-w-0 border-t border-gray-200 pt-5">
              <legend className="mb-4 flex w-full items-center justify-between gap-3 text-sm font-semibold text-gray-900">
                <span>Road section {index + 1}</span>
                {sections.length > 1 && (
                  <button type="button" onClick={() => setSections((current) => current.filter((item) => item.key !== section.key))} aria-label={`Remove road section ${index + 1}`} className="flex h-9 w-9 items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-700">
                    <FiTrash2 aria-hidden="true" />
                  </button>
                )}
              </legend>
              <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label><span className={labelClass}>Road section / section ID *</span><input required value={section.roadSection} onChange={(event) => updateSection(section.key, { roadSection: event.target.value })} className={inputClass} placeholder="e.g. Road Section 001" /></label>
                <label><span className={labelClass}>Station limit</span><input value={section.stationing} onChange={(event) => updateSection(section.key, { stationing: event.target.value })} className={inputClass} placeholder="e.g. L = 0.000 km" /></label>
                <label><span className={labelClass}>Landmark</span><input value={section.landmark} onChange={(event) => updateSection(section.key, { landmark: event.target.value })} className={inputClass} /></label>
                <label><span className={labelClass}>Length (km)</span><input type="number" min="0" step="any" value={section.lengthKm} onChange={(event) => updateSection(section.key, { lengthKm: event.target.value })} className={inputClass} /></label>
              </div>
              <div className="overflow-x-auto border border-gray-200">
                <table className="w-full min-w-[1500px] border-collapse text-left text-[11px]">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      {REPORT_DEFECTS.map((defect) => (
                        <th key={defect.code} scope="col" title={defect.label} className="min-w-28 border border-gray-200 px-2 py-2 align-bottom">
                          <span className="block font-bold">{defect.code}</span>
                          <span className="mt-1 block font-normal leading-tight">{defect.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {REPORT_DEFECTS.map((defect) => (
                        <td key={defect.code} className="border border-gray-200 p-1">
                          <input
                            aria-label={`${defect.code} ${defect.label} quantity for road section ${index + 1}`}
                            type="number"
                            min="0"
                            step="any"
                            value={section.quantities[defect.code] ?? ''}
                            onChange={(event) => updateQuantity(section.key, defect.code, event.target.value)}
                            className="w-full min-w-20 border border-gray-300 bg-white px-2 py-2 text-center text-sm text-gray-900 outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-100"
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </fieldset>
          ))}
        </section>

        <section className="border-t border-gray-200 pt-5" aria-labelledby="signatories-heading">
          <h2 id="signatories-heading" className="mb-4 text-lg font-semibold text-gray-900">Signatories</h2>
          <div className="grid gap-5 lg:grid-cols-3">
            <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <legend className="mb-3 text-sm font-semibold text-gray-800">Prepared by</legend>
              <label><span className={labelClass}>Name *</span><input required value={preparedBy} onChange={(event) => setPreparedBy(event.target.value)} className={inputClass} /></label>
              <label><span className={labelClass}>Designation</span><input value={preparedDesignation} onChange={(event) => setPreparedDesignation(event.target.value)} className={inputClass} /></label>
            </fieldset>
            <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <legend className="mb-3 text-sm font-semibold text-gray-800">Reviewed by</legend>
              <label><span className={labelClass}>Name *</span><input required value={reviewedBy} onChange={(event) => setReviewedBy(event.target.value)} className={inputClass} /></label>
              <label><span className={labelClass}>Designation</span><input value={reviewedDesignation} onChange={(event) => setReviewedDesignation(event.target.value)} className={inputClass} /></label>
            </fieldset>
            <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <legend className="mb-3 text-sm font-semibold text-gray-800">Noted by</legend>
              <label><span className={labelClass}>Name *</span><input required value={notedBy} onChange={(event) => setNotedBy(event.target.value)} className={inputClass} /></label>
              <label><span className={labelClass}>Designation</span><input value={notedDesignation} onChange={(event) => setNotedDesignation(event.target.value)} className={inputClass} /></label>
            </fieldset>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-5">
          <Link href="/analytics" className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-wait disabled:opacity-60">
            <FiSave aria-hidden="true" />
            {saving ? 'Saving summary...' : 'Create summary'}
          </button>
        </div>
      </form>
    </div>
  );
}