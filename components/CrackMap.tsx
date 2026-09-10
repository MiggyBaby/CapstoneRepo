'use client';

import React, { useEffect, useState } from 'react';
import { FiInfo, FiX } from 'react-icons/fi';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crack } from '@/lib/types';
import { fetchCracks } from '@/lib/api-client';

const severityConfig = {
  low: { color: 'bg-green-500', label: 'Low', mapColor: '#22c55e' },
  medium: { color: 'bg-yellow-500', label: 'Medium', mapColor: '#eab308' },
  high: { color: 'bg-orange-500', label: 'High', mapColor: '#f97316' },
  critical: { color: 'bg-red-500', label: 'Critical', mapColor: '#ef4444' },
};

function MapBounds({ cracks }: { cracks: Crack[] }) {
  const map = useMap();

  useEffect(() => {
    if (!cracks.length) return;

    const bounds = L.latLngBounds(cracks.map((crack) => [crack.coordinates.lat, crack.coordinates.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.35));
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCracks({ limit: 200 })
      .then((data) => {
        setCracks(data);
        setSelectedCrack(data[0] ?? null);
      })
      .catch((error) => console.error('Unable to load crack map data from Supabase:', error))
      .finally(() => setLoading(false));
  }, []);

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
          ) : cracks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FiInfo className="mx-auto text-blue-400 mb-4" size={48} />
                <p className="text-gray-600 font-medium">No cracks available</p>
                <p className="text-gray-500 text-sm mt-2">New detections will appear here once they are uploaded.</p>
              </div>
            </div>
          ) : (
            <MapContainer center={[14.5995, 120.9842]} zoom={11} scrollWheelZoom className="h-full w-full">
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
                      <p className="text-sm capitalize text-gray-700">{crack.crackType}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold text-white ${severityConfig[crack.severity].color}`}>
                        {severityConfig[crack.severity].label}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
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
              <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={selectedCrack.imageUrl || 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&h=500&fit=crop'}
                  alt={selectedCrack.location}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Location</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{selectedCrack.location}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedCrack.coordinates.lat.toFixed(4)}, {selectedCrack.coordinates.lng.toFixed(4)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Type</p>
                <p className="text-sm font-bold text-gray-900 mt-1 capitalize">{selectedCrack.crackType}</p>
              </div>

              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Severity</p>
                <div className="mt-1">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${severityConfig[selectedCrack.severity].color} text-white`}
                  >
                    {severityConfig[selectedCrack.severity].label}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Status</p>
                <p className="text-sm font-bold text-gray-900 mt-1 capitalize">{selectedCrack.status}</p>
              </div>

              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Detected</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {new Date(selectedCrack.detectedAt as string).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button className="w-full btn-primary mt-4">View Full Details</button>
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
