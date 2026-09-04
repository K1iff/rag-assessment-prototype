'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function FacultyAnalyticsPage() {
  const [sortKey, setSortKey] = useState<'cohort' | 'averageScoreNum' | 'completionRateNum'>('averageScoreNum');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedCohort, setExpandedCohort] = useState<number | null>(null);

  const initialCohortAnalytics = [
    { id: 1, cohort: 'Cohort Alpha 2026', averageScoreNum: 84, completionRateNum: 92, status: 'On Track' },
    { id: 2, cohort: 'Cohort Beta 2026', averageScoreNum: 71, completionRateNum: 68, status: 'Needs Attention' },
    { id: 3, cohort: 'Cohort Gamma 2026', averageScoreNum: 88, completionRateNum: 95, status: 'On Track' },
  ];

  const itemAnalysis = [
    { id: 'Q-402', exam: 'Midterm Coverage Quiz', topic: 'Neurotransmitters', failedBy: '65%' },
    { id: 'Q-411', exam: 'Midterm Coverage Quiz', topic: 'Brain Anatomy', failedBy: '42%' },
    { id: 'Q-108', exam: 'Organizational Behavior Check', topic: 'Motivation Theories', failedBy: '58%' },
  ];

  const handleSort = (key: 'cohort' | 'averageScoreNum' | 'completionRateNum') => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedCohorts = [...initialCohortAnalytics].sort((a, b) => {
    if (a[sortKey] < b[sortKey]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortKey] > b[sortKey]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleExpand = (id: number) => {
    if (expandedCohort === id) {
      setExpandedCohort(null);
    } else {
      setExpandedCohort(id);
    }
  };

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

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80 mb-6 flex flex-col">
        <h3 className="font-bold text-slate-700 mb-4">Visual Cohort Comparison</h3>
        <div className="flex-1 w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={initialCohortAnalytics} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="cohort" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} domain={[0, 100]} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 'bold' }} />
              <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
              <Bar dataKey="averageScoreNum" name="Average Score (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completionRateNum" name="Completion Rate (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-fit">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Cohort Performance Roster</h3>
            <span className="text-xs font-bold text-slate-400">Click a row to view student details</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200">
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('cohort')}
                  >
                    Cohort Name {sortKey === 'cohort' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('averageScoreNum')}
                  >
                    Average Score {sortKey === 'averageScoreNum' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-800 transition-colors"
                    onClick={() => handleSort('completionRateNum')}
                  >
                    Completion Rate {sortKey === 'completionRateNum' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedCohorts.map((record) => (
                  <React.Fragment key={record.id}>
                    <tr onClick={() => toggleExpand(record.id)} className={`transition-colors cursor-pointer ${expandedCohort === record.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{record.cohort}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{record.averageScoreNum}%</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{record.completionRateNum}%</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          record.status === 'On Track' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                    {expandedCohort === record.id && (
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <td colSpan={4} className="p-6">
                          <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Student Roster</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="bg-white border border-slate-200 p-3 rounded text-sm font-bold flex justify-between items-center shadow-sm">
                              <span className="text-slate-700">Juan Santos</span>
                              <span className="text-emerald-600">88%</span>
                            </div>
                            <div className="bg-white border border-slate-200 p-3 rounded text-sm font-bold flex justify-between items-center shadow-sm">
                              <span className="text-slate-700">Ana Reyes</span>
                              <span className="text-emerald-600">92%</span>
                            </div>
                            <div className="bg-white border border-slate-200 p-3 rounded text-sm font-bold flex justify-between items-center shadow-sm">
                              <span className="text-slate-700">Luis Cruz</span>
                              <span className="text-amber-600">65%</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
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
          
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
            <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
              <span className="text-lg">🤖</span> AI Instructional Suggestion
            </h4>
            <p className="text-xs text-blue-950 leading-relaxed font-bold mb-4">
              Students are struggling heavily with Neurotransmitters and Motivation Theories. Consider uploading supplementary reading materials or generating a targeted diagnostic drill for these specific topics.
            </p>
            <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
              Generate Targeted Drill
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}