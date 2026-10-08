'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FiArrowLeft, FiCalendar, FiMapPin, FiNavigation, FiTool } from 'react-icons/fi';
import { Crack } from '@/lib/types';
import { fetchCrackById } from '@/lib/api-client';

function parseDemoFieldText(description?: string) {
  const entries: { label: string; value: string }[] = [];
  if (!description) return entries;

  for (const part of description.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      entries.push({ label: 'Note', value: trimmed });
      continue;
    }

    const label = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    entries.push({ label, value });
  }

  return entries;
}

export default function CrackDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [crack, setCrack] = useState<Crack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetchCrackById(id)
      .then((data) => {
        setCrack(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Unable to load crack details:', err);
        setError('Unable to load crack details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const detailEntries = useMemo(() => parseDemoFieldText(crack?.description), [crack?.description]);

  if (!id) {
    return <div className="p-6 text-red-600">Invalid crack reference.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crack Details</h1>
          <p className="text-gray-600 mt-1">Inspection and maintenance record</p>
        </div>
        <Link href="/cracks" className="btn-secondary inline-flex items-center gap-2">
          <FiArrowLeft size={16} />
          Back to list
        </Link>
      </div>

      {loading ? (
        <div className="card py-12 text-center text-gray-500">Loading crack record...</div>
      ) : error || !crack ? (
        <div className="card border-red-200 bg-red-50 text-red-700 py-12 text-center">{error || 'Crack record not found.'}</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="card overflow-hidden">
            <div className="relative h-80 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
              {crack.imageUrl ? (
                <Image src={crack.imageUrl} alt={crack.location} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">No image available</div>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-600">Location</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{crack.location}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {crack.coordinates.lat.toFixed(4)}, {crack.coordinates.lng.toFixed(4)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-gray-600">Type</p>
                  <p className="mt-1 text-sm font-semibold capitalize">{crack.crackType}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-gray-600">Severity</p>
                  <p className="mt-1 text-sm font-semibold capitalize">{crack.severity}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-gray-600">Status</p>
                  <p className="mt-1 text-sm font-semibold capitalize">{crack.status}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Inspection Summary</h2>
              <div className="space-y-3">
                {detailEntries.length > 0 ? (
                  detailEntries.map(({ label, value }) => (
                    <div key={`${label}-${value}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">{label}</p>
                      <p className="mt-1 text-sm text-gray-800">{value}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                    No detailed inspection notes are available for this record.
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Info</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <FiMapPin className="text-primary-600" size={16} />
                  <span>{crack.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-primary-600" size={16} />
                  <span>{new Date(crack.detectedAt as string).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiNavigation className="text-primary-600" size={16} />
                  <span>{crack.width ?? 0} mm width / {crack.length ?? 0} mm length</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiTool className="text-primary-600" size={16} />
                  <span>{crack.status} maintenance action</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
