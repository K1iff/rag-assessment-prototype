'use client';

import React from 'react';

export default function FacultyAnalyticsPage() {
  const cohortAnalytics = [
    { id: 1, cohort: 'Cohort Alpha 2026', averageScore: '84%', completionRate: '92%', status: 'On Track' },
    { id: 2, cohort: 'Cohort Beta 2026', averageScore: '71%', completionRate: '68%', status: 'Needs Attention' },
  ];

  const itemAnalysis = [
    { id: 'Q-402', exam: 'Midterm Coverage Quiz', topic: 'Neurotransmitters', failedBy: '65%' },
    { id: 'Q-411', exam: 'Midterm Coverage Quiz', topic: 'Brain Anatomy', failedBy: '42%' },
    { id: 'Q-108', exam: 'Organizational Behavior Check', topic: 'Motivation Theories', failedBy: '58%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Analytics & Grades</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl font-bold">Inspect overall cohort performance, view item discrimination analysis, and export class grades.</p>
        </div>
        <button className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export Cohort Grades (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Cohort Performance Overview</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Cohort Name</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Average Score</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Completion Rate</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {cohortAnalytics.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{record.cohort}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{record.averageScore}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{record.completionRate}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        record.status === 'On Track' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-700">Item Discrimination</h3>
            <p className="text-xs text-slate-500 mt-1 font-bold">Questions frequently failed by students.</p>
          </div>
          <div className="p-2">
            <ul className="flex flex-col">
              {itemAnalysis.map(item => (
                <li key={item.id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Failed by {item.failedBy}</span>
                    <span className="text-xs font-bold text-slate-400">{item.id}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-1">{item.topic}</p>
                  <p className="text-xs font-bold text-slate-500 mb-1">{item.exam}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}