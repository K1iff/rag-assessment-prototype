'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ScheduledExamsPage() {
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState<null | number>(null);

  const scheduledExamsList = [
    { id: 1, title: 'Abnormal Psychology Diagnostic', scope: 'Entire Subject Abnormal Psychology', rules: 'Specific Time July 15, 2026 at 2:00 PM', duration: '60 minutes', status: 'Upcoming', accent: 'bg-rose-500' },
    { id: 2, title: 'Theories of Personality Drill', scope: 'Specific Topics Psychoanalytic and Neopsychoanalytic Theories', rules: 'Take Anytime', duration: '45 minutes', status: 'Available', accent: 'bg-blue-500' },
    { id: 3, title: 'Comprehensive Mock Exam Area A', scope: 'Combined Subjects Area A', rules: 'Specific Time July 17, 2026 at 9:00 AM', duration: '120 minutes', status: 'Upcoming', accent: 'bg-emerald-500' },
    { id: 4, title: 'Industrial Psychology Baseline', scope: 'Entire Subject Industrial Psychology', rules: 'Take Anytime', duration: '60 minutes', status: 'Available', accent: 'bg-purple-500' },
  ];

  const handleStartExam = () => {
    router.push('/learner/active_exam');
  };

  if (selectedExam !== null) {
    const examDetails = scheduledExamsList.find(e => e.id === selectedExam);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm mb-4">
          <button onClick={() => setSelectedExam(null)} className="text-blue-600 hover:underline font-bold">Scheduled Mock Exams</button>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600 font-bold">Exam Details</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full max-w-4xl">
          <div className="bg-slate-50 border-b border-slate-200 p-8 md:p-10">
            <h2 className="text-3xl font-bold text-slate-800">{examDetails?.title}</h2>
            <p className="text-slate-500 mt-3 text-sm font-bold">Review the details below before starting your attempt.</p>
          </div>
          
          <div className="p-8 md:p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Exam Scope</h4>
                <p className="text-slate-800 font-bold text-lg">{examDetails?.scope}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Duration</h4>
                <p className="text-slate-800 font-bold text-lg">{examDetails?.duration}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Scheduling Rules</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-blue-600 text-2xl">🕒</span>
                  <p className="text-slate-800 font-bold text-lg">{examDetails?.rules}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg mt-8">
              <h4 className="text-base font-bold text-blue-800 mb-2">Important Instructions</h4>
              <ul className="text-sm text-blue-900 space-y-2 font-bold list-disc pl-5">
                <li>Ensure you have a stable internet connection.</li>
                <li>The timer cannot be paused once the exam starts.</li>
                <li>Do not refresh the page during the exam.</li>
              </ul>
            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleStartExam}
                className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-lg"
              >
                Start Mock Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Scheduled Mock Exams</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6 font-bold">Select a mock exam to view details and start your session.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
        {scheduledExamsList.map((exam) => (
          <div 
            key={exam.id} 
            onClick={() => setSelectedExam(exam.id)}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col relative"
          >
            <div className={`h-1.5 w-full ${exam.accent}`}></div>
            
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-slate-800 leading-snug pr-3">{exam.title}</h3>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${exam.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                    {exam.status}
                  </span>
                </div>
                
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scope</p>
                <p className="text-sm text-slate-700 font-bold mb-4">{exam.scope}</p>
                
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Schedule</p>
                <p className="text-sm text-slate-700 font-bold">{exam.rules}</p>
              </div>
              
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center">
                {exam.status === 'Available' ? (
                  <button className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    Take Exam
                  </button>
                ) : (
                  <button className="w-full py-2.5 bg-slate-50 text-slate-600 border border-slate-200 text-sm font-bold rounded-lg hover:bg-slate-100 transition-colors">
                    View Details
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}