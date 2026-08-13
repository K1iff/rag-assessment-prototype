'use client';

import React from 'react';

export default function PerformancePage() {
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Historical Performance View</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6 font-bold">Track your overall scores, test trends, and past simulation milestones over time.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulations Completed</span>
          <p className="text-4xl font-bold text-slate-800 mt-2">{performanceStats.examsCompleted}</p>
        </div>
        <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Scale Score</span>
          <p className="text-4xl font-bold text-blue-600 mt-2">{performanceStats.averageScore}</p>
        </div>
        <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Standing</span>
          <p className="text-4xl font-bold text-emerald-600 mt-2">{performanceStats.globalRank}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-base text-slate-700">Historical Exam History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="p-6">Simulation ID</th>
                <th className="p-6">Exam Module Title</th>
                <th className="p-6">Achieved Score</th>
                <th className="p-6">Date Completed</th>
                <th className="p-6">Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {performanceStats.recentExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-6 font-mono text-xs text-slate-400">{exam.id}</td>
                  <td className="p-6 font-bold text-slate-800">{exam.name}</td>
                  <td className="p-6 font-bold text-slate-700">{exam.score}</td>
                  <td className="p-6 text-slate-500 font-bold">{exam.date}</td>
                  <td className="p-6">
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
    </div>
  );
}