'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiClock, FiTrendingUp } from 'react-icons/fi';
import StatCard from '@/components/StatCard';
import CrackCard from '@/components/CrackCard';
import type { Crack } from '@/lib/types';
import { AnalyticsData, checkApiHealth, fetchAnalytics, fetchCracks, type HealthStatus } from '@/lib/api-client';
import { useLiveRefresh } from '@/lib/use-live-refresh';

export default function Dashboard() {
  const [cracks, setCracks] = useState<Crack[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [crackResult, analyticsResult, healthResult] = await Promise.allSettled([
      fetchCracks({ limit: 500 }),
      fetchAnalytics(),
      checkApiHealth(),
    ]);
    const errors: string[] = [];
    if (crackResult.status === 'fulfilled') setCracks(crackResult.value);
    else {
      console.error('Unable to load dashboard cracks:', crackResult.reason);
      errors.push('Could not load detection records.');
    }
    if (analyticsResult.status === 'fulfilled') setAnalytics(analyticsResult.value);
    else {
      console.error('Unable to load dashboard analytics:', analyticsResult.reason);
      errors.push('Could not load database analytics.');
    }
    if (healthResult.status === 'fulfilled') setHealth(healthResult.value);
    else {
      console.error('Unable to check database connection:', healthResult.reason);
      setHealth({ status: 'down', message: 'Health check failed', timestamp: new Date().toISOString(), version: '' });
    }
    setError(errors.join(' '));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useLiveRefresh(() => { void load(true); });

  const stats = {
    total: analytics?.totalCracks ?? 0,
    critical: analytics?.criticalCracks ?? 0,
    resolved: analytics?.resolvedCracks ?? 0,
    inProgress: analytics?.inProgressCracks ?? 0,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to DPWH Road Crack Detection System</p>
      </div>

      {/* Statistics Grid */}
      {error ? <p role="alert" className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiAlertCircle}
          label="Total Road Defects"
          value={stats.total}
          color="primary"
        />
        <StatCard
          icon={FiTrendingUp}
          label="Critical Issues"
          value={stats.critical}
          color="secondary"
        />
        <StatCard
          icon={FiClock}
          label="In Progress"
          value={stats.inProgress}
          color="warning"
        />
        <StatCard
          icon={FiCheckCircle}
          label="Resolved"
          value={stats.resolved}
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
            {!cracks.length && !loading ? <p className="col-span-full py-8 text-center text-sm text-gray-600">No detection records are currently in the database.</p> : null}
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
                <div className={`w-2 h-2 rounded-full ${health?.status === 'operational' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-xs font-medium ${health?.status === 'operational' ? 'text-green-600' : 'text-red-600'}`}>{health?.status === 'operational' ? 'Operational' : 'Unavailable'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${health?.status === 'operational' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-xs font-medium ${health?.status === 'operational' ? 'text-green-600' : 'text-red-600'}`}>{health?.status === 'operational' ? 'Connected' : 'Unavailable'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Camera Feed</span>
              <span className="text-xs font-medium text-gray-500">Not connected</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Latest Activity</h3>
          <div className="space-y-3 text-sm">
            {cracks.slice(0, 4).map(crack => (
              <div key={crack.id} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="min-w-0">
                  <p className="text-gray-900 font-medium">{crack.crackType} detected · {crack.severity} · {crack.location}</p>
                  <p className="text-gray-500 text-xs">{new Date(crack.detectedAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {!cracks.length ? <p className="text-gray-500">No detection activity recorded.</p> : null}
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">Open records</p>
              <div className="flex items-end space-x-2">
                <p className="text-2xl font-bold text-primary-600">{analytics?.openCracks ?? 0}</p>
                <p className="text-xs text-gray-500">from database</p>
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">Average time to resolve</p>
              <p className="text-lg font-bold text-gray-900">{analytics?.averageResolutionHours == null ? 'No resolved records' : `${analytics.averageResolutionHours.toFixed(1)} hours`}</p>
            </div>
            <div><p className="text-gray-600 text-xs uppercase tracking-wide mb-1">Records with evidence images</p><p className="text-lg font-bold text-gray-900">{analytics?.evidenceCracks ?? 0}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
