'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function FacultyDashboardPage() {
  const router = useRouter();

  const dashboardStats = {
    totalExams: 24,
    activeExams: 5,
    pendingReviews: 12,
    overallCompletion: '92%'
  };

  const exams = [
    { id: 1, title: 'Midterm Coverage Quiz', target: 'PSY301', items: 30, status: 'Active', dueDate: '2026-07-20' },
    { id: 2, title: 'Personality Theories Final', target: 'PSY302', items: 50, status: 'Pending', dueDate: '2026-08-10' },
    { id: 3, title: 'Introductory Concepts Quiz', target: 'PSY301', items: 15, status: 'Inactive', dueDate: '2026-06-15' },
    { id: 4, title: 'Organizational Behavior Check', target: 'PSY303', items: 25, status: 'Active', dueDate: '2026-07-18' },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'Active') return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    if (status === 'Pending') return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    return <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider">{status}</span>;
  };

  const getActionLabel = (status: string) => {
    if (status === 'Pending') return 'Review Questions';
    if (status === 'Inactive') return 'View Results';
    return 'Edit Settings';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Welcome Back, Instructor</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6 font-bold">Here is a summary of your upcoming exams and pending validations for this week.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => router.push('/faculty/exams')}
          className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Total Exams</span>
          <p className="text-4xl font-bold text-slate-800 mt-2 group-hover:text-blue-700 transition-colors">{dashboardStats.totalExams}</p>
        </div>
        <div 
          onClick={() => router.push('/faculty/exams')}
          className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
        >
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Active Exams</span>
          <p className="text-4xl font-bold text-emerald-600 mt-2 group-hover:text-emerald-700 transition-colors">{dashboardStats.activeExams}</p>
        </div>
        <div 
          onClick={() => router.push('/faculty/exams')}
          className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center cursor-pointer hover:shadow-md hover:border-amber-200 transition-all group"
        >
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-amber-600 transition-colors">Pending Validations</span>
          <p className="text-4xl font-bold text-amber-600 mt-2 group-hover:text-amber-700 transition-colors">{dashboardStats.pendingReviews}</p>
        </div>
        <div 
          onClick={() => router.push('/faculty/analytics')}
          className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider group-hover:text-blue-800 transition-colors">Overall Completion</span>
          <p className="text-4xl font-bold text-blue-700 mt-2 group-hover:text-blue-800 transition-colors">{dashboardStats.overallCompletion}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold leading-tight">Calculated as the percentage of enrolled students who have submitted all active exams. Adding new exams adjusts this metric dynamically.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-base text-slate-700">Exam Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="p-6">Exam Title</th>
                <th className="p-6">Target Audience</th>
                <th className="p-6">Items</th>
                <th className="p-6">Status</th>
                <th className="p-6">Due Date</th>
                <th className="p-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-6 font-bold text-slate-800">{exam.title}</td>
                  <td className="p-6 font-bold text-slate-500">{exam.target}</td>
                  <td className="p-6 font-bold text-slate-700">{exam.items}</td>
                  <td className="p-6">{getStatusBadge(exam.status)}</td>
                  <td className="p-6 font-bold text-slate-600">{exam.dueDate}</td>
                  <td className="p-6">
                    <button 
                      onClick={() => router.push('/faculty/exams')}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      {getActionLabel(exam.status)}
                    </button>
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