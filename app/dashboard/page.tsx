'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LearnerDashboard() {
  const router = useRouter();
  const [activeView, setActiveView] = useState('performance');

  // Module: Historical Performance View Data
  const performanceStats = {
    examsCompleted: 8,
    averageScore: '76.5%',
    globalRank: 'Top 12%',
    recentExams: [
      { id: 'EX-902', name: 'Comprehensive Mock Exam Area A', score: '82%', date: '2026-07-08', status: 'Passed' },
      { id: 'EX-884', name: 'Abnormal Psychology Specialized Drill', score: '71%', date: '2026-07-02', status: 'Passed' },
      { id: 'EX-851', name: 'Theories of Personality Diagnostic', score: '64%', date: '2026-06-25', status: 'Needs Review' },
    ]
  };

  // Module: Learner Post-Exam Summary View Data (Most Recent Exam Analysis)
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
    aiRagFeedback: 'Your performance indicates an excellent grasp of clinical diagnostic criteria under the DSM-5 framework. However, you consistently dropped marks on organizational behavior models within the Industrial Psychology segment. Focus your next AI generation session on workplace motivation theories.'
  };

  // Module: Interactive PRC Progress Roadmap Visualization Data
  const roadmapSteps = [
    { step: 1, title: 'Diagnostic Baseline', description: 'Establish foundational knowledge metrics.', completed: true },
    { step: 2, title: 'Core Subject Drills', description: 'Complete dedicated modules for all 4 major board topics.', completed: true },
    { step: 3, title: 'AI-Generated Adaptive Simulation', description: 'Surpass a 75% threshold on RAG dynamic exams.', completed: false, current: true },
    { step: 4, title: 'Full Length Board Simulation', description: 'Simulate the exact timing and constraints of the actual PRC exam.', completed: false },
    { step: 5, title: 'PRC Board Readiness Certified', description: 'Final clearance badge achieved.', completed: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-bold text-lg tracking-tight text-blue-400">RPLE Learner Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Reviewer Workspace</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveView('performance')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'performance' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Historical Performance
          </button>
          <button 
            onClick={() => setActiveView('summary')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'summary' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Latest Exam Summary
          </button>
          <button 
            onClick={() => setActiveView('roadmap')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'roadmap' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            PRC Progress Roadmap
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => router.push('/login')}
            className="w-full text-center bg-slate-800 hover:bg-slate-700 text-xs py-2 rounded-md font-medium transition-colors text-slate-300"
          >
            Sign Out to Login
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 p-6 md:p-10">
        
        {/* View Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            {activeView === 'performance' && 'Historical Performance View'}
            {activeView === 'summary' && 'Learner Post-Exam Summary View'}
            {activeView === 'roadmap' && 'Interactive PRC Progress Roadmap Visualization'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeView === 'performance' && 'Track your overall scores, test trends, and past simulation milestones over time.'}
            {activeView === 'summary' && 'Examine structural analytics and AI-driven architectural remediation feedback from your last test.'}
            {activeView === 'roadmap' && 'Monitor your macro milestone progression mapped directly against the official board exam syllabus.'}
          </p>
        </div>

        {/* View 1: Historical Performance View */}
        {activeView === 'performance' && (
          <div className="space-y-6">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Simulations Completed</span>
                <p className="text-3xl font-bold text-slate-800 mt-1">{performanceStats.examsCompleted}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Scale Score</span>
                <p className="text-3xl font-bold text-blue-600 mt-1">{performanceStats.averageScore}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Standing</span>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{performanceStats.globalRank}</p>
              </div>
            </div>

            {/* Past Exams Log Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-sm text-slate-700">Historical Exam History</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500 tracking-wider">
                    <th className="p-4">Simulation ID</th>
                    <th className="p-4">Exam Module Title</th>
                    <th className="p-4">Achieved Score</th>
                    <th className="p-4">Date Completed</th>
                    <th className="p-4">Evaluation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {performanceStats.recentExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono text-xs text-slate-400">{exam.id}</td>
                      <td className="p-4 font-medium text-slate-800">{exam.name}</td>
                      <td className="p-4 font-semibold text-slate-700">{exam.score}</td>
                      <td className="p-4 text-slate-500">{exam.date}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${exam.status === 'Passed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {exam.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View 2: Learner Post-Exam Summary View */}
        {activeView === 'summary' && (
          <div className="space-y-6 max-w-4xl">
            {/* Summary Top Banner */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{postExamSummary.examName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Attempt evaluated on {postExamSummary.completionDate}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-600">{postExamSummary.scoreBreakdown.correct}% Final Mark</span>
                <p className="text-xs text-slate-500 mt-0.5">{postExamSummary.scoreBreakdown.correct} correct out of {postExamSummary.scoreBreakdown.total} items</p>
              </div>
            </div>

            {/* AI-Driven Architecture Feedback Box */}
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
              <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                🤖 Automated RAG Remediation Insights
              </h4>
              <p className="text-sm text-blue-950 mt-2 leading-relaxed">
                {postExamSummary.aiRagFeedback}
              </p>
            </div>

            {/* Subject Area Breakdown */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h4 className="font-bold text-sm text-slate-700 mb-4">Competency Area Performance Profiles</h4>
              <div className="space-y-4">
                {postExamSummary.categoryAnalysis.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.category}</p>
                      <span className="text-xs text-slate-400">Current Accuracy Metric: <b className="text-slate-600">{item.proficiency}</b></span>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold ${item.status === 'Strong Mastery' ? 'bg-emerald-50 text-emerald-700' : item.status === 'Proficient' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View 3: Interactive PRC Progress Roadmap Visualization */}
        {activeView === 'roadmap' && (
          <div className="bg-white p-6 md:p-10 rounded-xl border border-slate-100 shadow-sm max-w-3xl">
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
              {roadmapSteps.map((step) => (
                <div key={step.step} className="relative pl-8">
                  {/* Node Circle Identifier */}
                  <div className={`absolute -left-[11px] top-0.5 h-5 w-5 rounded-full border-4 flex items-center justify-center transition-all ${
                    step.completed ? 'bg-emerald-500 border-emerald-200' : 
                    step.current ? 'bg-blue-600 border-blue-200 animate-pulse' : 
                    'bg-slate-200 border-slate-100'
                  }`} />
                  
                  {/* Step Metadata Card */}
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${step.completed ? 'text-emerald-600' : step.current ? 'text-blue-600' : 'text-slate-400'}`}>
                      Milestone Phase {step.step} {step.current && '(Active Target)'}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 mt-0.5">{step.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-md">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}