'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiInfo, FiX } from 'react-icons/fi';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crack } from '@/lib/types';
import { fetchAllCracks } from '@/lib/api-client';
import { getCrackTypeDetails } from '@/lib/crack-types';
import { getCrackImageUrl } from '@/lib/crack-images';
import { useLiveRefresh } from '@/lib/use-live-refresh';

const severityConfig = {
  low: { color: 'bg-green-500', label: 'Low', mapColor: '#22c55e' },
  medium: { color: 'bg-yellow-500', label: 'Medium', mapColor: '#eab308' },
  high: { color: 'bg-orange-500', label: 'High', mapColor: '#f97316' },
  critical: { color: 'bg-red-500', label: 'Critical', mapColor: '#ef4444' },
};

const MINDANAO_CENTER: L.LatLngTuple = [7.7, 124.2];
const MINDANAO_BOUNDS = L.latLngBounds([5.2, 121.3], [10.0, 126.7]);

function getCrackDetailEntries(crack: Crack) {
  const defect = getCrackTypeDetails(crack.crackType);
  return [
    { label: 'Defect classification', value: `${defect.label}: ${defect.description}` },
    { label: 'Severity', value: crack.severity },
    { label: 'Workflow status', value: crack.status.replace(/-/g, ' ') },
    { label: 'Width', value: crack.width == null ? 'Not recorded' : `${crack.width} mm` },
    { label: 'Length', value: crack.length == null ? 'Not recorded' : `${crack.length} mm` },
    { label: 'Depth', value: crack.depth == null ? 'Not recorded' : `${crack.depth} mm` },
    { label: 'Detected', value: new Date(crack.detectedAt as string).toLocaleString() },
    ...(crack.description ? [{ label: 'Database description', value: crack.description }] : []),
  ];
}

function isInMindanao(crack: Crack) {
  return MINDANAO_BOUNDS.contains([crack.coordinates.lat, crack.coordinates.lng]);
}

function MapBounds({ cracks }: { cracks: Crack[] }) {
  const map = useMap();

  useEffect(() => {
    if (!cracks.length) {
      map.fitBounds(MINDANAO_BOUNDS, { padding: [16, 16] });
      return;
    }

    const bounds = L.latLngBounds(cracks.map((crack) => [crack.coordinates.lat, crack.coordinates.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.15), { padding: [16, 16], maxZoom: 8 });
    }
  }, [cracks, map]);

  return null;
}

function createMarkerIcon(color: string) {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 2px rgba(15,23,42,.1)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

export default function CrackMap() {
  const [cracks, setCracks] = useState<Crack[]>([]);
  const [selectedCrack, setSelectedCrack] = useState<Crack | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchAllCracks();
      const mindanaoCracks = data.filter(isInMindanao);
      setCracks(mindanaoCracks);
      setSelectedCrack(current => mindanaoCracks.find(crack => crack.id === current?.id) ?? mindanaoCracks[0] ?? null);
      setLoadError(null);
    } catch (error) {
      setCracks([]);
      setSelectedCrack(null);
      setLoadError(error instanceof Error ? error.message : 'Unable to load crack map data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useLiveRefresh(() => { void load(true); });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <div className="card p-0 overflow-hidden h-[32rem] lg:h-[42rem] flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
                <p className="text-gray-600 font-medium mt-4">Loading map data...</p>
              </div>
            </div>
          ) : (
            <div className="relative flex-1">
              <MapContainer
                center={MINDANAO_CENTER}
                zoom={7}
                minZoom={6}
                maxBounds={MINDANAO_BOUNDS}
                maxBoundsViscosity={1}
                scrollWheelZoom
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapBounds cracks={cracks} />
                {cracks.map((crack) => (
                  <Marker
                    key={crack.id}
                    position={[crack.coordinates.lat, crack.coordinates.lng]}
                    icon={createMarkerIcon(severityConfig[crack.severity].mapColor)}
                    eventHandlers={{ click: () => setSelectedCrack(crack) }}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900">{crack.location}</p>
                        <p className="text-sm font-semibold text-gray-800">{getCrackTypeDetails(crack.crackType).label}</p>
                        <p className="text-xs text-gray-600">{getCrackTypeDetails(crack.crackType).description}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold text-white ${severityConfig[crack.severity].color}`}>
                          {severityConfig[crack.severity].label}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {(loadError || cracks.length === 0) && (
                <div className="absolute inset-x-4 top-4 z-[400] rounded-md border border-blue-100 bg-white/95 px-4 py-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <FiInfo className="mt-0.5 shrink-0 text-blue-500" size={20} />
                    <div>
                      <p className="font-semibold text-gray-900">Mindanao map view</p>
                      <p className="text-sm text-gray-600">
                        {loadError || 'No crack detections are currently plotted inside Mindanao.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="grid grid-cols-4 gap-4 text-xs">
              {Object.entries(severityConfig).map(([severity, config]) => (
                <div key={severity} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 ${config.color} rounded-full`} />
                  <span className="text-gray-700">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        {selectedCrack ? (
          <div className="card h-full flex flex-col">
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Crack Details</h3>
              <button onClick={() => setSelectedCrack(null)} className="text-gray-400 hover:text-gray-600 transition">
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-4">
              <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={getCrackImageUrl(selectedCrack.imageUrl, selectedCrack.crackType)}
                  alt={selectedCrack.imageUrl ? `Road defect evidence for ${selectedCrack.location}` : `Example road defect image for ${selectedCrack.location}`}
                  className="w-full h-full object-cover"
                />
                {!selectedCrack.imageUrl ? <span className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">Example image · evidence not attached</span> : null}
              </div>

              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Location</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{selectedCrack.location}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedCrack.coordinates.lat.toFixed(4)}, {selectedCrack.coordinates.lng.toFixed(4)}
                </p>
              </div>

              <div className="space-y-3">
                {getCrackDetailEntries(selectedCrack).map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">{label}</p>
                    <p className="mt-1 text-sm text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link href={`/cracks/${selectedCrack.id}`} className="w-full btn-primary mt-4 inline-flex items-center justify-center">
              View Full Details
            </Link>
          </div>
        ) : (
          <div className="card h-full flex items-center justify-center">
            <div className="text-center">
              <FiInfo className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-600 font-medium">Click on a map marker to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
