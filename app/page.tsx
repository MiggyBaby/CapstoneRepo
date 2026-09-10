'use client';

import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiClock, FiTrendingUp } from 'react-icons/fi';
import StatCard from '@/components/StatCard';
import CrackCard from '@/components/CrackCard';
import { Crack } from '@/lib/types';
import { fetchCracks } from '@/lib/api-client';

// Mock data for demonstration
const mockCracks: Crack[] = [
  {
    id: '1',
    location: 'Gen. Luna St, Manila',
    coordinates: { lat: 14.5994, lng: 120.9842 },
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&h=500&fit=crop',
    crackType: 'alligator',
    severity: 'critical',
    detectedAt: '2024-09-04',
    width: 2.5,
    length: 150,
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
    width: 1.8,
    length: 200,
    status: 'assigned',
    assignedTo: 'John Doe',
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
    width: 1.2,
    length: 80,
    status: 'in-progress',
    assignedTo: 'Jane Smith',
    createdAt: '2024-09-02',
    updatedAt: '2024-09-02',
  },
  {
    id: '4',
    location: 'Commonwealth Ave, Quezon City',
    coordinates: { lat: 14.6321, lng: 121.0456 },
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&h=500&fit=crop',
    crackType: 'edge',
    severity: 'low',
    detectedAt: '2024-08-31',
    width: 0.8,
    length: 45,
    status: 'resolved',
    createdAt: '2024-08-31',
    updatedAt: '2024-09-04',
  },
];

export default function Dashboard() {
  const [cracks, setCracks] = useState<Crack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCracks({ limit: 6 })
      .then(setCracks)
      .catch((error) => console.error('Unable to load cracks from Supabase:', error))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: cracks.length,
    critical: cracks.filter((c) => c.severity === 'critical').length,
    resolved: cracks.filter((c) => c.status === 'resolved').length,
    inProgress: cracks.filter((c) => c.status === 'in-progress').length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to DPWH Road Crack Detection System</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiAlertCircle}
          label="Total Cracks Detected"
          value={stats.total}
          change={`+${Math.floor(stats.total * 0.15)}`}
          color="primary"
        />
        <StatCard
          icon={FiTrendingUp}
          label="Critical Issues"
          value={stats.critical}
          change={`+${Math.floor(stats.critical * 0.2)}`}
          color="secondary"
        />
        <StatCard
          icon={FiClock}
          label="In Progress"
          value={stats.inProgress}
          change="-2"
          color="warning"
        />
        <StatCard
          icon={FiCheckCircle}
          label="Resolved"
          value={stats.resolved}
          change={`+${Math.floor(stats.resolved * 0.1)}`}
          color="success"
        />
      </div>

      {/* Recent Detections */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-900">Recent Detections</h2>
          <a href="/cracks" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All →
          </a>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cracks.slice(0, 6).map((crack) => (
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
        )}
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-600">Operational</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-600">Connected</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Camera Feed</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-xs font-medium text-yellow-600">Standby</span>
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Latest Activity</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-gray-900 font-medium">New critical crack detected</p>
                <p className="text-gray-500 text-xs">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-gray-900 font-medium">Crack repair completed</p>
                <p className="text-gray-500 text-xs">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">Detection Rate</p>
              <div className="flex items-end space-x-2">
                <p className="text-2xl font-bold text-primary-600">94%</p>
                <p className="text-xs text-green-600">+2% today</p>
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">Avg. Response Time</p>
              <p className="text-lg font-bold text-gray-900">2.4 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
