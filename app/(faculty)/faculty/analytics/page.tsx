'use client';

import React from 'react';

export default function FacultyAnalyticsPage() {
  const gradebook = [
    { id: 1, student: 'Juan Santos', email: 'student.santos@stud.edu', exam: 'Midterm Coverage Quiz', score: '28/30', percentage: '93%', status: 'Passed' },
    { id: 2, student: 'Ana Reyes', email: 'ana.reyes@stud.edu', exam: 'Midterm Coverage Quiz', score: '22/30', percentage: '73%', status: 'Failed' },
    { id: 3, student: 'Luis Cruz', email: 'luis.cruz@stud.edu', exam: 'Organizational Behavior Check', score: '24/25', percentage: '96%', status: 'Passed' },
    { id: 4, student: 'Juan Santos', email: 'student.santos@stud.edu', exam: 'Introductory Concepts Quiz', score: '15/15', percentage: '100%', status: 'Passed' },
  ];

  const itemAnalysis = [
    { id: 'Q-402', exam: 'Midterm Coverage Quiz', topic: 'Neurotransmitters', failedBy: '65%', action: 'Review Concept' },
    { id: 'Q-411', exam: 'Midterm Coverage Quiz', topic: 'Brain Anatomy', failedBy: '42%', action: 'Monitor' },
    { id: 'Q-108', exam: 'Organizational Behavior Check', topic: 'Motivation Theories', failedBy: '58%', action: 'Review Concept' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Analytics & Grades</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl font-bold">Inspect class scores, view item discrimination analysis, and export grades.</p>
        </div>
        <button className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export Grades (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gradebook View */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Recent Exam Submissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Student Details</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Assessment</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Score</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {gradebook.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{record.student}</p>
                      <p className="text-xs font-bold text-slate-500">{record.email}</p>
                    </td>
                    <td className="p-4 font-bold text-slate-600">{record.exam}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{record.score}</p>
                      <p className="text-xs font-bold text-slate-500">{record.percentage}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        record.status === 'Passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
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

        {/* Item Discrimination View */}
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
                  <p className="text-xs font-bold text-slate-500 mb-3">{item.exam}</p>
                  <button className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-md hover:bg-slate-200 transition-colors shadow-sm">
                    {item.action}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}