'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';
import { useLiveRefresh } from '@/lib/use-live-refresh';

type ForwardedDetection = {
  id: string;
  location: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  crack_type: string;
  severity: string;
  status: string;
  width_mm: number | null;
  length_mm: number | null;
  depth_mm: number | null;
  description: string | null;
  detected_at: string;
  source_device_id: string | null;
  review_state: string;
  crack_review_notes: Array<{ id: string; author_id: string; note: string; created_at: string }>;
};

type InspectionBatch = {
  id: string;
  submitted_by: string;
  submitted_at: string;
  review_status: 'pending_review' | 'reviewed' | 'changes_requested';
  department_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  inspection_batch_items: Array<{ crack_id: string; cracks: ForwardedDetection | null }>;
};

export default function InspectionsPage() {
  const [batches, setBatches] = useState<InspectionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError('');
      const { data: { session }, error: sessionError } = await getSupabaseClient().auth.getSession();
      if (sessionError) throw new Error('Unable to verify your sign-in session. Please sign in again.');
      if (!session) throw new Error('Sign in to view forwarded inspection batches.');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/inspections/batches`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Could not load forwarded inspections.');
      setBatches(Array.isArray(result.data) ? result.data : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load forwarded inspections.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useLiveRefresh(() => { void load(); });

  const reviewBatch = async (batchId: string, review_status: 'reviewed' | 'changes_requested') => {
    try {
      setReviewingId(batchId);
      setError('');
      const { data: { session }, error: sessionError } = await getSupabaseClient().auth.getSession();
      if (sessionError) throw new Error('Unable to verify your sign-in session. Please sign in again.');
      if (!session) throw new Error('Sign in to submit a department review.');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/inspections/batches/${batchId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review_status, department_note: reviewNote }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Could not save the department review.');
      setReviewNote('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the department review.');
    } finally {
      setReviewingId(null);
    }
  };

  return <section className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary-800">Inspector submissions</p>
        <h1 className="text-3xl font-bold text-gray-900">Forwarded Inspections</h1>
        <p className="mt-1 text-sm text-gray-600">Finalized Raspberry Pi detections submitted for department review.</p>
      </div>
      <button onClick={() => { setRefreshing(true); void load(); }} disabled={refreshing} className="inline-flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
        <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />Refresh
      </button>
    </header>

    {error ? <p role="alert" className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
    {loading ? <div className="border border-gray-200 bg-white py-12 text-center text-sm text-gray-500">Loading inspection batches…</div>
      : batches.length ? <div className="space-y-5">{batches.map(batch => {
        const records = batch.inspection_batch_items.flatMap(item => item.cracks ? [item.cracks] : []);
        return <article key={batch.id} className="border border-gray-200 bg-white">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4">
            <div>
              <h2 className="font-bold text-gray-900">Batch {batch.id}</h2>
              <p className="mt-1 text-xs text-gray-600">Forwarded {new Date(batch.submitted_at).toLocaleString()} · Inspector {batch.submitted_by}</p>
            </div>
            <span className="border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase text-amber-900">
              {batch.review_status.replace(/_/g, ' ')}
            </span>
          </header>
          <div className="p-5">
            <p className="mb-3 text-sm font-semibold text-gray-800">{records.length} finalized detection{records.length === 1 ? '' : 's'}</p>
            {records.length ? <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-gray-200 text-xs uppercase text-gray-500"><tr>
                  <th className="px-3 py-2">Detection</th><th className="px-3 py-2">Location</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Severity</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Evidence</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">{records.map(record => <tr key={record.id}>
                  <td className="px-3 py-3"><span className="font-medium text-gray-900">{record.id.slice(0, 8)}</span><p className="mt-1 text-xs text-gray-500">{new Date(record.detected_at).toLocaleString()}</p></td>
                  <td className="px-3 py-3 text-gray-800">{record.location}<p className="mt-1 text-xs text-gray-500">{record.latitude.toFixed(5)}, {record.longitude.toFixed(5)}</p></td>
                  <td className="px-3 py-3 capitalize text-gray-700">{record.crack_type}</td>
                  <td className="px-3 py-3 capitalize text-gray-700">{record.severity}</td>
                  <td className="px-3 py-3 capitalize text-gray-700">{record.status.replace(/-/g, ' ')}</td>
                  <td className="px-3 py-3">{record.image_url ? <a href={record.image_url} target="_blank" rel="noreferrer" className="text-primary-800 underline">Open image</a> : <span className="text-gray-500">None</span>}</td>
                </tr>)}</tbody>
              </table>
            </div> : <p className="text-sm text-gray-600">No detection details are available for this batch.</p>}
            {records.map(record => <details key={`${record.id}-remarks`} className="mt-3 border-t border-gray-100 pt-3">
              <summary className="cursor-pointer text-sm font-medium text-primary-800">Inspector remarks for {record.id.slice(0, 8)} ({record.crack_review_notes?.length ?? 0})</summary>
              <div className="mt-2 space-y-2">{record.crack_review_notes?.length ? record.crack_review_notes.map(note => <div key={note.id} className="bg-gray-50 px-3 py-2 text-sm">
                <p className="text-xs text-gray-500">{new Date(note.created_at).toLocaleString()} · {note.author_id}</p>
                <p className="mt-1 whitespace-pre-wrap text-gray-800">{note.note}</p>
              </div>) : <p className="text-sm text-gray-500">No inspector remarks.</p>}</div>
            </details>)}
            {batch.department_note ? <div className="mt-4 border-l-4 border-primary-700 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase text-gray-600">Department review note</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{batch.department_note}</p>
              {batch.reviewed_by ? <p className="mt-1 text-xs text-gray-500">Reviewed by {batch.reviewed_by}{batch.reviewed_at ? ` · ${new Date(batch.reviewed_at).toLocaleString()}` : ''}</p> : null}
            </div> : null}
            {batch.review_status === 'pending_review' ? <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              <label className="block text-sm font-medium text-gray-700">
                Department note (optional)
                <textarea value={reviewNote} onChange={event => setReviewNote(event.target.value)} maxLength={2000} rows={3} className="mt-1 block w-full border border-gray-300 p-2 text-sm" placeholder="Add review feedback for the inspector" />
              </label>
              <div className="flex flex-wrap gap-2">
                <button disabled={reviewingId !== null} onClick={() => void reviewBatch(batch.id, 'reviewed')} className="bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {reviewingId === batch.id ? 'Saving…' : 'Mark reviewed'}
                </button>
                <button disabled={reviewingId !== null} onClick={() => void reviewBatch(batch.id, 'changes_requested')} className="border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-900 disabled:opacity-60">
                  Request changes
                </button>
              </div>
            </div> : null}
          </div>
        </article>;
      })}</div> : <div className="border border-gray-200 bg-white py-16 text-center">
        <p className="font-medium text-gray-800">No forwarded inspections yet</p>
        <p className="mt-1 text-sm text-gray-500">Batches forwarded by inspectors will appear here for department review.</p>
      </div>}
  </section>;
}
