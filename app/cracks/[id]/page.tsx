'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FiArrowLeft, FiCalendar, FiMapPin, FiNavigation, FiTool } from 'react-icons/fi';
import { Crack } from '@/lib/types';
import { fetchCrackById } from '@/lib/api-client';
import { getCrackTypeDetails } from '@/lib/crack-types';
import { getCrackImageUrl } from '@/lib/crack-images';
import { useLiveRefresh } from '@/lib/use-live-refresh';

export default function CrackDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [crack, setCrack] = useState<Crack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;

    try {
      const data = await fetchCrackById(id);
      setCrack(data);
      setError(null);
    } catch (cause) {
      console.error('Unable to load crack details:', cause);
      setError(cause instanceof Error ? cause.message : 'Unable to load crack details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  useLiveRefresh(() => { void load(); });

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
              <Image src={getCrackImageUrl(crack.imageUrl, crack.crackType)} alt={`Sample crack photo for ${crack.location}`} fill unoptimized className="object-cover" />
              {!crack.imageUrl && <span className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">Sample image</span>}
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
                  <p className="mt-1 text-sm font-semibold">{getCrackTypeDetails(crack.crackType).label}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">{getCrackTypeDetails(crack.crackType).description}</p>
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
                {crack.description ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">Database description</p>
                    <p className="mt-1 text-sm text-gray-800">{crack.description}</p>
                  </div>
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
