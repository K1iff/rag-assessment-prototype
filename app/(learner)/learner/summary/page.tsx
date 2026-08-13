'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function SummaryPage() {
  const router = useRouter();

  const postExamSummary = {
    examName: 'Comprehensive Mock Exam Area A',
    completionDate: 'July 8, 2026',
    scoreBreakdown: { correct: 82, incorrect: 18, total: 100 },
    categoryAnalysis: [
      { category: 'Theories of Personality', proficiency: '88%', status: 'Strong Mastery' },
      { category: 'Abnormal Psychology', proficiency: '74%', status: 'Proficient' },
      { category: 'Industrial Psychology', proficiency: '62%', status: 'Review Recommended' },
      { category: 'Psychological Assessment', proficiency: '80%', status: 'Strong Mastery' },
    ],
    aiRagFeedback: 'Your performance indicates an excellent grasp of clinical diagnostic criteria under the DSM 5 framework. However, you consistently dropped marks on organizational behavior models within the Industrial Psychology segment. Focus your next AI generation session on workplace motivation theories.'
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Learner Post Exam Summary View</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6 font-bold">Examine structural analytics and AI driven architectural remediation feedback from your last test.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="font-bold text-2xl text-slate-800">{postExamSummary.examName}</h3>
              <p className="text-sm text-slate-400 mt-1 font-bold">Attempt evaluated on {postExamSummary.completionDate}</p>
            </div>
            <div className="text-left md:text-right bg-slate-50 p-4 rounded-lg">
              <span className="text-3xl font-black text-emerald-600">{postExamSummary.scoreBreakdown.correct}% Mark</span>
              <p className="text-xs font-bold text-slate-500 mt-1">{postExamSummary.scoreBreakdown.correct} correct out of {postExamSummary.scoreBreakdown.total} items</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-8 rounded-xl">
            <h4 className="text-base font-bold text-blue-800 flex items-center gap-2 mb-3">
              <span className="text-xl">🤖</span> Automated AI Remediation Insights
            </h4>
            <p className="text-base text-blue-950 leading-relaxed font-bold">
              {postExamSummary.aiRagFeedback}
            </p>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8">
            <h4 className="font-bold text-base text-slate-700 mb-6">Competency Area Performance</h4>
            <div className="space-y-5">
              {postExamSummary.categoryAnalysis.map((item, idx) => (
                <div key={idx} className="flex flex-col border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm font-bold text-slate-800">{item.category}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-bold text-slate-500">Accuracy {item.proficiency}</span>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'Strong Mastery' ? 'bg-emerald-50 text-emerald-700' : item.status === 'Proficient' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-8 rounded-xl">
            <h4 className="text-base font-bold text-amber-800 mb-2">Action Plan</h4>
            <p className="text-sm text-amber-900 leading-relaxed mb-6 font-bold">Based on your summary, prioritize Industrial Psychology resources before taking another simulation.</p>
            <button 
              onClick={() => router.push('/learner/exams')}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
            >
              Practice Industrial Psychology Drills Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}