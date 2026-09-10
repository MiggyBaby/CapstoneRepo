'use client';

import React, { useEffect, useState } from 'react';
import { FiFilter, FiDownload, FiSearch } from 'react-icons/fi';
import CrackCard from '@/components/CrackCard';
import { Crack, Severity, CrackType } from '@/lib/types';
import { fetchCracks } from '@/lib/api-client';

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

export default function CracksPage() {
  const [cracks, setCracks] = useState<Crack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [selectedType, setSelectedType] = useState<CrackType | 'all'>('all');

  const severities: Severity[] = ['low', 'medium', 'high', 'critical'];
  const crackTypes: CrackType[] = ['longitudinal', 'transverse', 'alligator', 'edge', 'reflection', 'other'];

  useEffect(() => {
    fetchCracks()
      .then(setCracks)
      .catch((error) => console.error('Unable to load cracks from Supabase:', error))
      .finally(() => setLoading(false));
  }, []);

  const filteredCracks = cracks.filter((crack) => {
    const matchesSearch =
      crack.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crack.crackType.includes(searchTerm.toLowerCase());

    const matchesSeverity = selectedSeverity === 'all' || crack.severity === selectedSeverity;
    const matchesType = selectedType === 'all' || crack.crackType === selectedType;

    return matchesSearch && matchesSeverity && matchesType;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crack Detection</h1>
          <p className="text-gray-600 mt-1">
            Total detected: <span className="font-semibold text-primary-600">{cracks.length}</span>
          </p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <FiDownload size={18} />
          <span>Export Report</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by location or crack type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Filter Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity Level
              </label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value as Severity | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="all">All Severities</option>
                {severities.map((sev) => (
                  <option key={sev} value={sev}>
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crack Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as CrackType | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="all">All Types</option>
                {crackTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 pt-2">
            {selectedSeverity !== 'all' && (
              <button
                onClick={() => setSelectedSeverity('all')}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium hover:bg-blue-200 transition"
              >
                Severity: {selectedSeverity} ✕
              </button>
            )}
            {selectedType !== 'all' && (
              <button
                onClick={() => setSelectedType('all')}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium hover:bg-blue-200 transition"
              >
                Type: {selectedType} ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Results: {filteredCracks.length} crack{filteredCracks.length !== 1 ? 's' : ''} found
        </h2>

        {loading ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">Loading crack records...</p>
          </div>
        ) : filteredCracks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCracks.map((crack) => (
              <CrackCard
                key={crack.id}
                id={crack.id}
                imageUrl={crack.imageUrl}
                location={crack.location}
                crackType={crack.crackType}
                severity={crack.severity}
                detectedAt={crack.detectedAt as string}
                coordinates={crack.coordinates}
              />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">No cracks found matching your filters.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSeverity('all');
                setSelectedType('all');
              }}
              className="mt-4 btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
