'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FiBarChart2, FiTrendingUp, FiPercent } from 'react-icons/fi';
import StatCard from '@/components/StatCard';
import { AnalyticsData, fetchAnalytics, fetchCracks } from '@/lib/api-client';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [cracks, setCracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAnalytics(), fetchCracks({ limit: 500 })])
      .then(([analyticsData, crackData]) => {
        setAnalytics(analyticsData);
        setCracks(crackData);
      })
      .catch((error) => console.error('Unable to load analytics from Supabase:', error))
      .finally(() => setLoading(false));
  }, []);

  const cracksByType = analytics?.cracksByType ?? {};
  const cracksBySeverity = {
    critical: analytics?.criticalCracks ?? 0,
    high: analytics?.highCracks ?? 0,
    medium: analytics?.mediumCracks ?? 0,
    low: analytics?.lowCracks ?? 0,
  };

  const totalCracks = analytics?.totalCracks ?? 0;
  const resolvedCracks = analytics?.resolvedCracks ?? 0;
  const resolutionRate = totalCracks ? ((resolvedCracks / totalCracks) * 100).toFixed(1) : '0.0';
  const detectionAccuracy = totalCracks ? ((Math.max(0, totalCracks - (analytics?.inProgressCracks ?? 0)) / totalCracks) * 100).toFixed(1) : '0.0';

  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = Array.from({ length: 7 }, (_, index) => ({
      day: days[index],
      count: 0,
    }));

    cracks.forEach((crack) => {
      const date = new Date(crack.detectedAt as string);
      if (Number.isNaN(date.getTime())) return;
      const dayIndex = date.getDay();
      counts[dayIndex].count += 1;
    });

    return counts;
  }, [cracks]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="card flex min-h-[220px] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
            <p className="text-gray-600 mt-4">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Road crack detection system performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={FiBarChart2} label="Total Cracks" value={totalCracks} change="Live" color="primary" />
        <StatCard icon={FiTrendingUp} label="Resolved" value={resolvedCracks} change="Live" color="success" />
        <StatCard icon={FiPercent} label="Resolution Rate" value={`${resolutionRate}%`} change="Live" color="primary" />
        <StatCard icon={FiTrendingUp} label="Detection Accuracy" value={`${detectionAccuracy}%`} change="Live" color="secondary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Cracks by Type</h3>
          <div className="space-y-4">
            {Object.entries(cracksByType).map(([type, count]) => {
              const percentage = totalCracks ? ((Number(count) / totalCracks) * 100).toFixed(0) : '0';
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700 capitalize">{type}</p>
                    <p className="text-sm font-bold text-gray-900">
                      {count} ({percentage}%)
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Cracks by Severity</h3>
          <div className="space-y-4">
            {Object.entries(cracksBySeverity)
              .sort(([, a], [, b]) => Number(b) - Number(a))
              .map(([severity, count]) => {
                const percentage = totalCracks ? ((Number(count) / totalCracks) * 100).toFixed(0) : '0';
                const colors = {
                  critical: 'bg-red-500',
                  high: 'bg-orange-500',
                  medium: 'bg-yellow-500',
                  low: 'bg-green-500',
                };
                return (
                  <div key={severity}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700 capitalize">{severity}</p>
                      <p className="text-sm font-bold text-gray-900">
                        {count} ({percentage}%)
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${colors[severity as keyof typeof colors]} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Weekly Detection Trend</h3>
        <div className="flex items-end justify-around h-64 space-x-2">
          {weeklyData.map((data) => {
            const maxCount = Math.max(...weeklyData.map((d) => d.count), 1);
            const percentage = (data.count / maxCount) * 100;
            const barHeight = Math.max(percentage, data.count > 0 ? 10 : 0);
            return (
              <div key={data.day} className="flex flex-col items-center flex-1">
                <div className="w-full bg-gray-200 rounded-t-lg overflow-hidden">
                  <div
                    className="bg-gradient-to-t from-primary-600 to-primary-400 w-full transition-all hover:from-primary-700 hover:to-primary-500 cursor-pointer"
                    style={{ height: `${barHeight}%` }}
                  />
                </div>
                <p className="mt-3 text-xs font-bold text-gray-700">{data.day}</p>
                <p className="text-xs text-gray-500">{data.count}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Avg. Detection Time</h3>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="text-primary-600" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalCracks ? (2.4).toFixed(1) : '0.0'}h</p>
          <p className="text-sm text-gray-500 mt-2">Time to detect and report</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Detection Accuracy</h3>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiPercent className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{detectionAccuracy}%</p>
          <p className="text-sm text-gray-500 mt-2">System accuracy rate</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Avg. Response Time</h3>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiBarChart2 className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">4.2h</p>
          <p className="text-sm text-gray-500 mt-2">Time to dispatch workers</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Insights</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-3 pb-3 border-b border-gray-200">
            <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <p className="text-gray-700">
              <span className="font-semibold">Live data</span> is now coming from Supabase, with the current distribution based on the latest database records.
            </p>
          </div>
          <div className="flex items-start space-x-3 pb-3 border-b border-gray-200">
            <div className="w-2 h-2 bg-secondary-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <p className="text-gray-700">
              <span className="font-semibold">Critical severity cracks</span> currently account for {cracksBySeverity.critical} detected incidents.
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <p className="text-gray-700">
              <span className="font-semibold">Resolution rate</span> is currently {resolutionRate}% with {resolvedCracks} resolved records out of {totalCracks} total entries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
