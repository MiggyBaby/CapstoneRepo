'use client';

import React, { useState } from 'react';
import { FiInfo, FiX } from 'react-icons/fi';
import { Crack } from '@/lib/types';

// Mock data
const mockCracks: Crack[] = [
  {
    id: '1',
    location: 'Gen. Luna St, Manila',
    coordinates: { lat: 14.5994, lng: 120.9842 },
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&h=500&fit=crop',
    crackType: 'alligator',
    severity: 'critical',
    detectedAt: '2024-09-04',
    status: 'new',
    createdAt: '2024-09-04',
    updatedAt: '2024-09-04',
  },
  {
    id: '2',
    location: 'Ayala Avenue, Makati',
    coordinates: { lat: 14.5629, lng: 121.0248 },
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&h=500&fit=crop',
    crackType: 'longitudinal',
    severity: 'high',
    detectedAt: '2024-09-03',
    status: 'assigned',
    createdAt: '2024-09-03',
    updatedAt: '2024-09-03',
  },
  {
    id: '3',
    location: 'EDSA, Quezon City',
    coordinates: { lat: 14.6091, lng: 121.0245 },
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&h=500&fit=crop',
    crackType: 'transverse',
    severity: 'medium',
    detectedAt: '2024-09-02',
    status: 'in-progress',
    createdAt: '2024-09-02',
    updatedAt: '2024-09-02',
  },
];

export default function MapPage() {
  const [selectedCrack, setSelectedCrack] = useState<Crack | null>(null);

  const severityConfig = {
    low: { color: 'bg-green-500', label: 'Low' },
    medium: { color: 'bg-yellow-500', label: 'Medium' },
    high: { color: 'bg-orange-500', label: 'High' },
    critical: { color: 'bg-red-500', label: 'Critical' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Map View</h1>
        <p className="text-gray-600 mt-1">
          Visualize detected cracks across the city
        </p>
      </div>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-3">
          <div className="card p-0 overflow-hidden h-96 lg:h-full flex flex-col">
            {/* Map Background - Placeholder */}
            <div className="relative flex-1 bg-gradient-to-br from-blue-100 to-blue-50">
              {/* Map Note */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <FiInfo className="mx-auto text-blue-400 mb-4" size={48} />
                  <p className="text-gray-600 font-medium">Map view coming soon</p>
                  <p className="text-gray-500 text-sm mt-2">Integrate Leaflet.js for interactive mapping</p>
                </div>
              </div>

              {/* Crack Markers Visualization */}
              <div className="absolute inset-0">
                {mockCracks.map((crack) => {
                  const config = severityConfig[crack.severity];
                  return (
                    <button
                      key={crack.id}
                      onClick={() => setSelectedCrack(crack)}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 focus:outline-none group"
                      style={{
                        left: `${Math.random() * 80 + 10}%`,
                        top: `${Math.random() * 80 + 10}%`,
                      }}
                    >
                      <div
                        className={`w-4 h-4 ${config.color} rounded-full border-2 border-white shadow-lg hover:scale-150 transition-transform`}
                      />
                      <div className="absolute -top-8 -left-12 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                        {crack.location}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
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

        {/* Sidebar - Crack Details */}
        <div className="lg:col-span-1">
          {selectedCrack ? (
            <div className="card h-full flex flex-col">
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">Crack Details</h3>
                <button
                  onClick={() => setSelectedCrack(null)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-4">
                {/* Image */}
                <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={selectedCrack.imageUrl}
                    alt={selectedCrack.location}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Location */}
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                    Location
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {selectedCrack.location}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedCrack.coordinates.lat.toFixed(4)},
                    {selectedCrack.coordinates.lng.toFixed(4)}
                  </p>
                </div>

                {/* Type */}
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                    Type
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-1 capitalize">
                    {selectedCrack.crackType}
                  </p>
                </div>

                {/* Severity */}
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                    Severity
                  </p>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        severityConfig[selectedCrack.severity].color
                      } text-white`}
                    >
                      {severityConfig[selectedCrack.severity].label}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                    Status
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-1 capitalize">
                    {selectedCrack.status}
                  </p>
                </div>

                {/* Detected Date */}
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                    Detected
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {new Date(selectedCrack.detectedAt as string).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full btn-primary mt-4">View Full Details</button>
            </div>
          ) : (
            <div className="card h-full flex items-center justify-center">
              <div className="text-center">
                <FiInfo className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-600 font-medium">Click on a marker to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
