'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LearnerCalendarPage() {
  const router = useRouter();

  const weeklySchedule = [
    { day: 'Monday', date: 'July 13', task: 'Theories of Personality Mock Exam', time: '10:00 AM', status: 'Completed' },
    { day: 'Wednesday', date: 'July 15', task: 'Abnormal Psychology Diagnostic', time: '2:00 PM', status: 'Pending' },
    { day: 'Friday', date: 'July 17', task: 'Comprehensive Mock Exam Area A', time: '9:00 AM', status: 'Upcoming' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Student Weekly Schedule and Tasks</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">View your upcoming mock exams and mandatory simulations.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {weeklySchedule.map((schedule, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{schedule.task}</h3>
                <p className="text-sm text-slate-500 mt-1">Scheduled for {schedule.day}, {schedule.date} at {schedule.time}</p>
              </div>
              <div className="flex flex-row items-center gap-3 mt-2 md:mt-0 w-full md:w-auto">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  schedule.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 
                  schedule.status === 'Pending' ? 'bg-blue-100 text-blue-800' : 
                  'bg-slate-100 text-slate-600'
                }`}>
                  {schedule.status}
                </span>
                
                {schedule.status === 'Completed' && (
                  <button onClick={() => router.push('/learner/summary')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex-1 md:flex-none text-center">
                    View Results
                  </button>
                )}
                {schedule.status === 'Pending' && (
                  <button onClick={() => router.push('/learner/exams')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex-1 md:flex-none text-center">
                    Start Exam
                  </button>
                )}
                {schedule.status === 'Upcoming' && (
                  <button disabled className="px-4 py-2 bg-slate-50 text-slate-400 border border-slate-100 text-xs font-bold rounded-lg cursor-not-allowed flex-1 md:flex-none text-center">
                    Scheduled
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Weekly Goals Tracker</h3>
            <ul className="space-y-3 text-sm text-slate-600 font-bold">
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>Complete the Theories of Personality Mock Exam.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">○</span>
                <span>Score above 80 percent on the upcoming Abnormal Psychology Diagnostic.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-slate-300 mt-0.5">○</span>
                <span>Review last week exam errors.</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-2">Study Tip</h3>
            <p className="text-sm text-blue-900 leading-relaxed font-bold">Consistency is important. Make sure to log in every day to keep your review habits intact and monitor new mock exam schedules.</p>
          </div>
        </div>
      </div>
    </div>
  );
}