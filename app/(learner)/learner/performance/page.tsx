'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function PerformancePage() {
  const router = useRouter();

  const performanceStats = {
    examsCompleted: 8,
    averageScore: '76.5%',
    globalRank: 'Top 12%',
    recentExams: [
      { id: 'EX902', name: 'Comprehensive Mock Exam Area A', score: '82%', date: 'July 8, 2026', status: 'Passed' },
      { id: 'EX884', name: 'Abnormal Psychology Specialized Drill', score: '71%', date: 'July 2, 2026', status: 'Passed' },
      { id: 'EX851', name: 'Theories of Personality Diagnostic', score: '64%', date: 'June 25, 2026', status: 'Needs Review' },
    ]
  };

  const categories = [
    { name: 'Theories of Personality', acc: '88%', status: 'STRONG MASTERY', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { name: 'Abnormal Psychology', acc: '74%', status: 'PROFICIENT', color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { name: 'Industrial Psychology', acc: '62%', status: 'REVIEW RECOMMENDED', color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { name: 'Psychological Assessment', acc: '80%', status: 'STRONG MASTERY', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Historical Performance View</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6 font-bold">Track your metrics, check core competency mastery, and start targeted reviews.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulations Completed</span>
          <p className="text-4xl font-bold text-slate-800 mt-2">{performanceStats.examsCompleted}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Accuracy Score</span>
          <p className="text-4xl font-bold text-blue-600 mt-2">{performanceStats.averageScore}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1 leading-tight">Measures raw correct option totals over aggregate items attempted across all environments.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Standing</span>
          <p className="text-4xl font-bold text-emerald-600 mt-2">{performanceStats.globalRank}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1 leading-tight">Calculated comparatively across the totality of active system takers and learners.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-base text-slate-700">Historical History Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                  <th className="p-4">Simulation ID</th>
                  <th className="p-4">Exam Module Title</th>
                  <th className="p-4">Achieved Score</th>
                  <th className="p-4">Date Completed</th>
                  <th className="p-4">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {performanceStats.recentExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-400">{exam.id}</td>
                    <td className="p-4 font-bold text-slate-800">{exam.name}</td>
                    <td className="p-4 font-bold text-slate-700">{exam.score}</td>
                    <td className="p-4 text-slate-500 font-bold">{exam.date}</td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${exam.status === 'Passed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {exam.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-6">
          <div>
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 mb-4">Competency Area Performance</h3>
            <div className="space-y-4">
              {categories.map((cat, idx) => (
                <div key={idx} className="flex flex-col gap-1 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-sm font-bold text-slate-800">{cat.name}</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-500 font-bold">Accuracy: {cat.acc}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${cat.color}`}>{cat.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
            <h4 className="text-sm font-bold text-amber-800 mb-2">Remediation Action Plan</h4>
            <p className="text-xs text-amber-900 leading-relaxed font-bold mb-4">Prioritize Industrial Psychology resources to optimize target metrics before launching structural simulations[cite: 290, 291, 292].</p>
            <button 
              onClick={() => router.push('/learner/exams')}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Practice Industrial Psychology Drills Now [cite: 293]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}