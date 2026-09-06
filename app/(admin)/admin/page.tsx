'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminOverviewPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [usageData, setUsageData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSystemStats({
          activeStudents: 450,
          activeFaculty: 12,
          systemHealth: 'All Systems Operational',
          storageUsage: { used: 45.2, total: 100, unit: 'GB' },
          apiQuota: { used: 1.2, total: 5, unit: 'M Tokens' }
        });

        setUsageData([
          { day: 'Mon', tokens: 120 },
          { day: 'Tue', tokens: 190 },
          { day: 'Wed', tokens: 150 },
          { day: 'Thu', tokens: 220 },
          { day: 'Fri', tokens: 280 },
          { day: 'Sat', tokens: 110 },
          { day: 'Sun', tokens: 90 },
        ]);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Global System Overview</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">Monitor platform health and resource consumption.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => router.push('/admin/users/add')}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Add New User
          </button>
          <button 
            onClick={() => router.push('/admin/rag')}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            Upload Document
          </button>
        </div>
      </div>

      {isLoading || !systemStats ? (
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-500 font-bold">Loading dashboard metrics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active Students</span>
              <p className="text-4xl font-bold text-slate-800 mt-2">{systemStats.activeStudents}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Faculty</span>
              <p className="text-4xl font-bold text-blue-600 mt-2">{systemStats.activeFaculty}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Health Status</span>
                <p className="text-2xl font-bold text-slate-800 mt-1">{systemStats.systemHealth}</p>
                <p className="text-xs text-slate-500 mt-1 font-bold">If degraded impacted operations include Document Indexing and AI Exam Generation delays.</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-50 shrink-0">
                <div className="h-6 w-6 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col h-80">
              <div className="mb-4">
                <h3 className="font-bold text-slate-800">Weekly AI Token Consumption</h3>
                <p className="text-xs text-slate-500 font-bold">Displayed in thousands of tokens processed.</p>
              </div>
              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                    <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="tokens" name="Tokens (k)" stroke="#9333ea" strokeWidth={3} dot={{ r: 4, fill: '#9333ea', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6 flex flex-col">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Storage Usage</h3>
                  <span className="text-sm font-bold text-slate-600">{systemStats.storageUsage.used} / {systemStats.storageUsage.total} {systemStats.storageUsage.unit}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden border border-slate-200">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${(systemStats.storageUsage.used / systemStats.storageUsage.total) * 100}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 font-bold">Includes raw PDFs and vectorized embeddings.</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">API Generation Quota</h3>
                  <span className="text-sm font-bold text-slate-600">{systemStats.apiQuota.used} / {systemStats.apiQuota.total} {systemStats.apiQuota.unit}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden border border-slate-200">
                  <div className="bg-purple-600 h-3 rounded-full" style={{ width: `${(systemStats.apiQuota.used / systemStats.apiQuota.total) * 100}%` }}></div>
                </div>
                <p className="text-xs text-slate-500 font-bold">Current billing cycle resets in 14 days.</p>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}