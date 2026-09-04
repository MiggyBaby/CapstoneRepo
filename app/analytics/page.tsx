'use client';

import React from 'react';
import { FiBarChart2, FiTrendingUp, FiPercent } from 'react-icons/fi';
import StatCard from '@/components/StatCard';

export default function AnalyticsPage() {
  // Mock analytics data
  const cracksByType = {
    longitudinal: 24,
    transverse: 18,
    alligator: 32,
    edge: 12,
    reflection: 8,
    other: 6,
  };

  const cracksBySeverity = {
    critical: 15,
    high: 28,
    medium: 35,
    low: 22,
  };

  const weeklyData = [
    { day: 'Mon', count: 12 },
    { day: 'Tue', count: 19 },
    { day: 'Wed', count: 14 },
    { day: 'Thu', count: 22 },
    { day: 'Fri', count: 18 },
    { day: 'Sat', count: 11 },
    { day: 'Sun', count: 9 },
  ];

  const totalCracks = 100;
  const resolvedCracks = 35;
  const resolutionRate = ((resolvedCracks / totalCracks) * 100).toFixed(1);
  const avgDetectionTime = 2.4; // hours
  const detectionAccuracy = 94.2; // percent

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Road crack detection system performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiBarChart2}
          label="Total Cracks"
          value={totalCracks}
          change="+15"
          color="primary"
        />
        <StatCard
          icon={FiTrendingUp}
          label="Resolved"
          value={resolvedCracks}
          change="+8"
          color="success"
        />
        <StatCard
          icon={FiPercent}
          label="Resolution Rate"
          value={`${resolutionRate}%`}
          change="+2.3%"
          color="primary"
        />
        <StatCard
          icon={FiTrendingUp}
          label="Detection Accuracy"
          value={`${detectionAccuracy}%`}
          change="+1.2%"
          color="secondary"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cracks by Type */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Cracks by Type</h3>
          <div className="space-y-4">
            {Object.entries(cracksByType).map(([type, count]) => {
              const percentage = ((count / totalCracks) * 100).toFixed(0);
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

        {/* Cracks by Severity */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Cracks by Severity</h3>
          <div className="space-y-4">
            {Object.entries(cracksBySeverity)
              .sort(([, a], [, b]) => b - a)
              .map(([severity, count]) => {
                const percentage = ((count / totalCracks) * 100).toFixed(0);
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

      {/* Weekly Trend */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Weekly Detection Trend</h3>
        <div className="flex items-end justify-around h-64 space-x-2">
          {weeklyData.map((data) => {
            const maxCount = Math.max(...weeklyData.map((d) => d.count));
            const percentage = ((data.count / maxCount) * 100).toFixed(0);
            return (
              <div key={data.day} className="flex flex-col items-center flex-1">
                <div className="w-full bg-gray-200 rounded-t-lg overflow-hidden">
                  <div
                    className="bg-gradient-to-t from-primary-600 to-primary-400 w-full transition-all hover:from-primary-700 hover:to-primary-500 cursor-pointer"
                    style={{ height: `${percentage}%` }}
                  />
                </div>
                <p className="mt-3 text-xs font-bold text-gray-700">{data.day}</p>
                <p className="text-xs text-gray-500">{data.count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Avg. Detection Time</h3>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="text-primary-600" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{avgDetectionTime}h</p>
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

      {/* Recent Insights */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Insights</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-3 pb-3 border-b border-gray-200">
            <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <p className="text-gray-700">
              <span className="font-semibold">Alligator cracking</span> is the most common type detected (32% of total),
              mainly found in high-traffic areas.
            </p>
          </div>
          <div className="flex items-start space-x-3 pb-3 border-b border-gray-200">
            <div className="w-2 h-2 bg-secondary-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <p className="text-gray-700">
              <span className="font-semibold">Critical severity cracks</span> require immediate attention and represent 15%
              of detected cracks.
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <p className="text-gray-700">
              <span className="font-semibold">Resolution rate</span> has improved to {resolutionRate}%, showing improved
              response efficiency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
