'use client';

import { FormEvent, useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiFileText } from 'react-icons/fi';
import { createReport, deleteReport, fetchReports, updateReport } from '@/lib/api-client';
import { Report } from '@/lib/types';
import { REPORT_DEFECTS } from '@/lib/report-defects';

type ReportFields = Omit<Report, 'id' | 'createdAt' | 'updatedAt'>;
type FormFields = Omit<ReportFields, 'estimatedQuantity'> & { estimatedQuantity: string };

const today = () => new Date().toISOString().slice(0, 10);

function emptyForm(): FormFields {
  return {
    region: '', districtOffice: '', inspectionDate: today(), validationDate: '',
    stationing: '', landmark: '', roadSection: '', defectCode: '01',
    estimatedQuantity: '', unitOfMeasure: '', remarks: '', preparedBy: '', designation: '',
  };
}

function toFields(report: Report): FormFields {
  return {
    region: report.region,
    districtOffice: report.districtOffice,
    inspectionDate: report.inspectionDate,
    validationDate: report.validationDate,
    stationing: report.stationing,
    landmark: report.landmark,
    roadSection: report.roadSection,
    defectCode: report.defectCode,
    estimatedQuantity: report.estimatedQuantity == null ? '' : String(report.estimatedQuantity),
    unitOfMeasure: report.unitOfMeasure,
    remarks: report.remarks,
    preparedBy: report.preparedBy,
    designation: report.designation,
  };
}

function toPayload(fields: FormFields): ReportFields {
  return { ...fields, estimatedQuantity: fields.estimatedQuantity === '' ? null : Number(fields.estimatedQuantity) };
}

function displayDate(value: string) {
  if (!value) return 'Not set';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

const inputClass = 'w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-100';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Report | null>(null);
  const [fields, setFields] = useState<FormFields>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function loadReports() {
    setError('');
    try {
      setReports(await fetchReports());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load reports.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
    if (new URLSearchParams(window.location.search).get('new') === '1') {
      openCreate();
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  function openCreate() {
    setEditing(null);
    setFields(emptyForm());
    setError('');
    setDialogOpen(true);
  }

  function openEdit(report: Report) {
    setEditing(report);
    setFields(toFields(report));
    setError('');
    setDialogOpen(true);
  }

  async function saveReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = toPayload(fields);
      if (editing) {
        const saved = await updateReport(editing.id, payload);
        setReports((current) => current.map((item) => item.id === saved.id ? saved : item));
      } else {
        const saved = await createReport(payload);
        setReports((current) => [saved, ...current]);
      }
      setDialogOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save report.');
    } finally {
      setSaving(false);
    }
  }

  async function removeReport(report: Report) {
    if (!window.confirm(`Delete the validation report for ${report.roadSection}? This cannot be undone.`)) return;
    setDeletingId(report.id);
    setError('');
    try {
      await deleteReport(report.id);
      setReports((current) => current.filter((item) => item.id !== report.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete report.');
    } finally {
      setDeletingId(null);
    }
  }

  const query = search.trim().toLowerCase();
  const filtered = reports.filter((report) => [
    report.region, report.districtOffice, report.roadSection, report.stationing,
    report.landmark, report.preparedBy, REPORT_DEFECTS.find((item) => item.code === report.defectCode)?.label || '',
  ].some((value) => value.toLowerCase().includes(query)));

  function setField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="min-h-full space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary-800">Road and bridge validation</p>
          <h1 className="text-3xl font-bold text-gray-900">Inspection Reports</h1>
          <p className="mt-1 text-sm text-gray-600">{reports.length} recorded inspection{reports.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800">
          <FiPlus size={17} /> New report
        </button>
      </header>

      {error && !dialogOpen && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span>{error}</span>
          <button onClick={() => void loadReports()} className="font-semibold underline">Retry</button>
        </div>
      )}

      <section aria-label="Report records">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">Validation records</h2>
          <label className="relative block w-full sm:w-80">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} pl-9`} placeholder="Search road, district, defect..." />
          </label>
        </div>

        <div className="mt-3 overflow-x-auto border border-gray-200 bg-white">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Inspection date</th>
                <th className="px-4 py-3 font-semibold">Region / district</th>
                <th className="px-4 py-3 font-semibold">Section / station</th>
                <th className="px-4 py-3 font-semibold">Defect</th>
                <th className="px-4 py-3 font-semibold">Estimated quantity</th>
                <th className="px-4 py-3 font-semibold">Prepared by</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-14 text-center text-gray-500">Loading reports...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <FiFileText className="mx-auto mb-3 text-gray-300" size={28} />
                    <p className="font-medium text-gray-700">{reports.length ? 'No matching records' : 'No reports entered yet'}</p>
                    <p className="mt-1 text-sm text-gray-500">{reports.length ? 'Try another search.' : 'Start a validation record with the New report button.'}</p>
                  </td>
                </tr>
              ) : filtered.map((report) => {
                const defect = REPORT_DEFECTS.find((item) => item.code === report.defectCode);
                return (
                  <tr key={report.id} className="align-top hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-4 text-gray-700">{displayDate(report.inspectionDate)}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{report.region}</div>
                      <div className="mt-0.5 text-xs text-gray-500">{report.districtOffice}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{report.roadSection}</div>
                      <div className="mt-0.5 text-xs text-gray-500">{report.stationing || report.landmark || 'No station or landmark'}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-700"><span className="mr-1 font-semibold text-primary-700">{report.defectCode}</span>{defect?.label}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-700">{report.estimatedQuantity ?? '—'} {report.unitOfMeasure}</td>
                    <td className="px-4 py-4">
                      <div className="text-gray-900">{report.preparedBy}</div>
                      <div className="mt-0.5 text-xs text-gray-500">{report.designation}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button title="Edit report" aria-label={`Edit report for ${report.roadSection}`} onClick={() => openEdit(report)} className="mr-1 rounded p-2 text-gray-600 hover:bg-primary-50 hover:text-primary-800"><FiEdit2 size={16} /></button>
                      <button title="Delete report" aria-label={`Delete report for ${report.roadSection}`} disabled={deletingId === report.id} onClick={() => void removeReport(report)} className="rounded p-2 text-gray-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><FiTrash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-950/50 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDialogOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="report-dialog-title" className="my-auto w-full max-w-3xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-800">DPWH form entry</p>
                <h2 id="report-dialog-title" className="mt-1 text-xl font-bold text-gray-900">{editing ? 'Edit inspection report' : 'New inspection report'}</h2>
              </div>
              <button type="button" title="Close" aria-label="Close report form" onClick={() => setDialogOpen(false)} className="rounded p-2 text-gray-500 hover:bg-gray-100"><FiX size={19} /></button>
            </div>

            <form onSubmit={(event) => void saveReport(event)} className="max-h-[calc(100vh-9rem)] space-y-6 overflow-y-auto px-5 py-5 sm:px-7">
              {error && <div role="alert" className="border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}

              <fieldset>
                <legend className="mb-3 text-sm font-bold text-gray-900">Office and dates</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label><span className={labelClass}>Region *</span><input required value={fields.region} onChange={(e) => setField('region', e.target.value)} className={inputClass} /></label>
                  <label><span className={labelClass}>District office *</span><input required value={fields.districtOffice} onChange={(e) => setField('districtOffice', e.target.value)} className={inputClass} /></label>
                  <label><span className={labelClass}>Date of inspection *</span><input required type="date" value={fields.inspectionDate} onChange={(e) => setField('inspectionDate', e.target.value)} className={inputClass} /></label>
                  <label><span className={labelClass}>Date of validation</span><input type="date" value={fields.validationDate} onChange={(e) => setField('validationDate', e.target.value)} className={inputClass} /></label>
                </div>
              </fieldset>

              <fieldset className="border-t border-gray-200 pt-5">
                <legend className="mb-3 text-sm font-bold text-gray-900">Road section</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label><span className={labelClass}>Road section / section ID *</span><input required value={fields.roadSection} onChange={(e) => setField('roadSection', e.target.value)} className={inputClass} placeholder="e.g. Road Section 001" /></label>
                  <label><span className={labelClass}>Stationing / station limit</span><input value={fields.stationing} onChange={(e) => setField('stationing', e.target.value)} className={inputClass} placeholder="e.g. L = 0.000 km" /></label>
                  <label className="sm:col-span-2"><span className={labelClass}>Landmark</span><input value={fields.landmark} onChange={(e) => setField('landmark', e.target.value)} className={inputClass} /></label>
                </div>
              </fieldset>

              <fieldset className="border-t border-gray-200 pt-5">
                <legend className="mb-3 text-sm font-bold text-gray-900">Defect / deficiency</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2"><span className={labelClass}>Defect code *</span>
                    <select required value={fields.defectCode} onChange={(e) => setField('defectCode', e.target.value as ReportDefectCode)} className={inputClass}>
                      {REPORT_DEFECTS.map((defect) => <option key={defect.code} value={defect.code}>{defect.code} - {defect.label}</option>)}
                    </select>
                  </label>
                  <label><span className={labelClass}>Estimated quantity</span><input type="number" min="0" step="any" value={fields.estimatedQuantity} onChange={(e) => setField('estimatedQuantity', e.target.value)} className={inputClass} /></label>
                  <label><span className={labelClass}>Unit of measure</span><input value={fields.unitOfMeasure} onChange={(e) => setField('unitOfMeasure', e.target.value)} className={inputClass} placeholder="e.g. sq.m., m, pcs" /></label>
                  <label className="sm:col-span-2"><span className={labelClass}>Remarks</span><textarea rows={3} value={fields.remarks} onChange={(e) => setField('remarks', e.target.value)} className={inputClass} /></label>
                </div>
              </fieldset>

              <fieldset className="border-t border-gray-200 pt-5">
                <legend className="mb-3 text-sm font-bold text-gray-900">Prepared by</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label><span className={labelClass}>Name *</span><input required value={fields.preparedBy} onChange={(e) => setField('preparedBy', e.target.value)} className={inputClass} /></label>
                  <label><span className={labelClass}>Designation</span><input value={fields.designation} onChange={(e) => setField('designation', e.target.value)} className={inputClass} /></label>
                </div>
              </fieldset>

              <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
                <button type="button" disabled={saving} onClick={() => setDialogOpen(false)} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="rounded bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60">{saving ? 'Saving...' : editing ? 'Save changes' : 'Save report'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}