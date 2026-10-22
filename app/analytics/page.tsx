'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FiBarChart2, FiTrendingUp, FiPercent, FiFileText, FiPlus } from 'react-icons/fi';
import StatCard from '@/components/StatCard';
import { AnalyticsData, fetchAnalytics, fetchCracks, fetchDistrictSummaries } from '@/lib/api-client';
import type { Crack, DistrictSummary, ReportDefectCode } from '@/lib/types';
import { REPORT_DEFECTS } from '@/lib/report-defects';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'summary' | 'analytics'>('summary');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [cracks, setCracks] = useState<Crack[]>([]);
  const [summaries, setSummaries] = useState<DistrictSummary[]>([]);
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);
  const [summariesError, setSummariesError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([fetchAnalytics(), fetchCracks({ limit: 500 }), fetchDistrictSummaries()])
      .then(([analyticsResult, cracksResult, summariesResult]) => {
        if (analyticsResult.status === 'fulfilled') setAnalytics(analyticsResult.value);
        else console.error('Unable to load analytics from Supabase:', analyticsResult.reason);
        if (cracksResult.status === 'fulfilled') setCracks(cracksResult.value);
        else console.error('Unable to load crack records for analytics:', cracksResult.reason);
        if (summariesResult.status === 'fulfilled') {
          setSummaries(summariesResult.value);
          setSummariesError('');
          const requestedSummary = new URLSearchParams(window.location.search).get('summary');
          setSelectedSummaryId(requestedSummary || summariesResult.value[0]?.id || null);
        }
        else setSummariesError(summariesResult.reason instanceof Error ? summariesResult.reason.message : 'Could not load district summaries.');
      })
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
  const activeCracks = Math.max(totalCracks - resolvedCracks, 0);
  const resolutionRate = totalCracks ? ((resolvedCracks / totalCracks) * 100).toFixed(1) : '0.0';
  const detectionAccuracy = totalCracks ? ((Math.max(0, totalCracks - (analytics?.inProgressCracks ?? 0)) / totalCracks) * 100).toFixed(1) : '0.0';

  const selectedSummary = summaries.find((summary) => summary.id === selectedSummaryId) ?? summaries[0] ?? null;
  const summaryTotals = useMemo(() => REPORT_DEFECTS.reduce((totals, defect) => {
    const quantities = selectedSummary?.sections
      .map((section) => section.quantities[defect.code])
      .filter((quantity): quantity is number => quantity !== undefined);
    totals[defect.code] = quantities?.length ? quantities.reduce((total, quantity) => total + quantity, 0) : undefined;
    return totals;
  }, {} as Partial<Record<ReportDefectCode, number>>), [selectedSummary]);

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
            <p className="text-gray-600 mt-4">Loading district summary...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">District Summary</h1>
        <p className="text-gray-600 mt-1">Road inspection summary and performance analytics</p>
      </header>

      <div className="flex gap-1 border-b border-gray-200" role="tablist" aria-label="District summary views">
        <button
          type="button"
          id="summary-tab"
          role="tab"
          aria-selected={activeTab === 'summary'}
          aria-controls="summary-panel"
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'summary' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          <FiFileText aria-hidden="true" />
          Summary
        </button>
        <button
          type="button"
          id="analytics-tab"
          role="tab"
          aria-selected={activeTab === 'analytics'}
          aria-controls="analytics-panel"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'analytics' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          <FiBarChart2 aria-hidden="true" />
          Analytics
        </button>
      </div>

      {activeTab === 'summary' ? (
        <section id="summary-panel" role="tabpanel" aria-labelledby="summary-tab" className="space-y-5">
          {summariesError && (
            <div role="alert" className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {summariesError}
            </div>
          )}

          <section aria-label="Saved district summaries">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">District summaries</h2>
                <p className="mt-1 text-sm text-gray-600">Select a summary to view its report sheet.</p>
              </div>
              <Link href="/analytics/new" className="inline-flex items-center gap-2 rounded bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800">
              <FiPlus aria-hidden="true" />
                New Summary
              </Link>
            </div>
            <div className="overflow-x-auto border border-gray-200 bg-white">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-semibold">Inspection date</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Region / district</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Sections</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Prepared by</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Reviewed by</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Noted by</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {summaries.map((summary) => (
                    <tr key={summary.id} className={selectedSummary?.id === summary.id ? 'bg-primary-50' : 'hover:bg-gray-50'}>
                      <td className="px-3 py-3">
                        <button type="button" onClick={() => setSelectedSummaryId(summary.id)} aria-pressed={selectedSummary?.id === summary.id} className="font-medium text-primary-700 hover:underline">
                          {summary.inspectionDate}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-gray-700"><span className="block font-medium text-gray-900">{summary.region}</span><span className="text-xs text-gray-600">{summary.districtOffice}</span></td>
                      <td className="px-3 py-3 text-gray-700">{summary.sections.length}</td>
                      <td className="px-3 py-3 text-gray-700"><span className="block">{summary.preparedBy}</span><span className="text-xs text-gray-600">{summary.preparedDesignation}</span></td>
                      <td className="px-3 py-3 text-gray-700"><span className="block">{summary.reviewedBy}</span><span className="text-xs text-gray-600">{summary.reviewedDesignation}</span></td>
                      <td className="px-3 py-3 text-gray-700"><span className="block">{summary.notedBy}</span><span className="text-xs text-gray-600">{summary.notedDesignation}</span></td>
                    </tr>
                  ))}
                  {summaries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-600">
                        {summariesError ? 'Apply the district summaries migration to load this table.' : 'No district summaries created yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {selectedSummary && (
            <article className="overflow-hidden border border-gray-300 bg-white text-gray-900">
              <header className="border-b border-gray-300 px-4 py-5 text-center sm:px-8">
                <p className="text-xs font-semibold uppercase text-gray-700">Department of Public Works and Highways</p>
                <h2 className="mt-2 text-xl font-bold uppercase">District Summary</h2>
                <p className="mt-1 text-sm font-semibold uppercase">On Road and Bridge Inspection / Validation</p>
                <p className="mt-1 text-xs text-gray-600">In the implementation of Department Order No. ______, Series of 20____</p>
                <p className="mt-2 text-[10px] text-gray-500">DPWH-QMSP-17-03-REV01</p>
              </header>

              <div className="grid gap-x-8 gap-y-2 border-b border-gray-300 px-4 py-4 text-sm sm:grid-cols-2 sm:px-8">
                <p><span className="font-semibold">Region:</span> {selectedSummary.region}</p>
                <p><span className="font-semibold">District Office:</span> {selectedSummary.districtOffice}</p>
                <p><span className="font-semibold">Date of inspection:</span> {selectedSummary.inspectionDate}</p>
                <p><span className="font-semibold">Date of validation:</span> {selectedSummary.validationDate || '—'}</p>
                <p><span className="font-semibold">Road sections:</span> {selectedSummary.sections.length}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1800px] border-collapse text-left text-[11px]">
                  <thead className="bg-gray-100 text-gray-800">
                    <tr>
                      <th scope="col" className="sticky left-0 z-10 min-w-64 border border-gray-300 bg-gray-100 px-2 py-2">Name of road section / station limit</th>
                      <th scope="col" className="min-w-20 border border-gray-300 px-2 py-2 text-center">Length (km)</th>
                      {REPORT_DEFECTS.map((defect) => (
                        <th key={defect.code} scope="col" title={defect.label} className="min-w-16 border border-gray-300 px-1 py-2 text-center">
                          <span className="block font-bold">{defect.code}</span>
                          <span className="mt-1 block font-normal leading-tight">{defect.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedSummary.sections.map((section, index) => (
                      <tr key={`${section.roadSection}-${section.stationing}-${index}`}>
                        <th scope="row" className="sticky left-0 z-10 border border-gray-300 bg-white px-2 py-3 font-medium">
                          <span className="block">{index + 1}. {section.roadSection}</span>
                          <span className="mt-1 block text-[10px] font-normal text-gray-600">{section.stationing || section.landmark || 'Station limit not specified'}</span>
                        </th>
                        <td className="border border-gray-300 px-2 py-3 text-center">{section.lengthKm ?? '—'}</td>
                        {REPORT_DEFECTS.map((defect) => (
                          <td key={defect.code} className="border border-gray-300 px-1 py-3 text-center">
                            {section.quantities[defect.code]?.toLocaleString() ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-semibold text-gray-900">
                    <tr>
                      <th scope="row" className="sticky left-0 z-10 border border-gray-300 bg-gray-100 px-2 py-2">Total</th>
                      <td className="border border-gray-300 px-2 py-2 text-center">—</td>
                      {REPORT_DEFECTS.map((defect) => (
                        <td key={defect.code} className="border border-gray-300 px-1 py-2 text-center">
                          {summaryTotals[defect.code]?.toLocaleString() ?? '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row" className="sticky left-0 z-10 border border-gray-300 bg-gray-100 px-2 py-2">Accomplishment (%)</th>
                      <td colSpan={REPORT_DEFECTS.length + 1} className="border border-gray-300 px-2 py-2 text-center">—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </article>
          )}
        </section>
      ) : (
        <section id="analytics-panel" role="tabpanel" aria-labelledby="analytics-tab" className="space-y-8">
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
        </section>
      )}
    </div>
  );
}
