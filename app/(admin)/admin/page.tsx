'use client';

import React from 'react';

export default function AdminOverviewPage() {
  const systemStats = {
    activeStudents: 450,
    activeFaculty: 12,
    systemHealth: 'All Systems Operational',
    storageUsage: { used: 45.2, total: 100, unit: 'GB' },
    apiQuota: { used: 1.2, total: 5, unit: 'M Tokens' }
  };

  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Global System Overview</h1>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active Students</span>
            <p className="text-4xl font-bold text-slate-800 mt-2">{systemStats.activeStudents}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Faculty</span>
            <p className="text-4xl font-bold text-blue-600 mt-2">{systemStats.activeFaculty}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Health Status</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">{systemStats.systemHealth}</p>
              <p className="text-xs text-slate-500 mt-1">If degraded, impacted operations include Document Indexing and AI Exam Generation delays.</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-50 shrink-0">
              <div className="h-6 w-6 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">RAG Document Storage Usage</h3>
              <span className="text-sm font-bold text-slate-600">{systemStats.storageUsage.used} / {systemStats.storageUsage.total} {systemStats.storageUsage.unit}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 mb-2 overflow-hidden border border-slate-200">
              <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${(systemStats.storageUsage.used / systemStats.storageUsage.total) * 100}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 font-bold">Includes raw PDFs and vectorized embeddings.</p>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">AI API Generation Quota</h3>
              <span className="text-sm font-bold text-slate-600">{systemStats.apiQuota.used} / {systemStats.apiQuota.total} {systemStats.apiQuota.unit}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 mb-2 overflow-hidden border border-slate-200">
              <div className="bg-purple-600 h-4 rounded-full" style={{ width: `${(systemStats.apiQuota.used / systemStats.apiQuota.total) * 100}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 font-bold">Current billing cycle resets in 14 days.</p>
          </div>
        </div>
      </div>
    </>
  );
}