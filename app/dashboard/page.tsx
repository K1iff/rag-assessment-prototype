'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LearnerDashboard() {
  const router = useRouter();
  const [activeView, setActiveView] = useState('calendar');
  const [selectedExam, setSelectedExam] = useState<null | number>(null);

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

  const roadmapSteps = [
    { step: 1, title: 'Diagnostic Baseline', description: 'Establish foundational knowledge metrics.', completed: true },
    { step: 2, title: 'Core Subject Drills', description: 'Complete dedicated modules for all major board topics.', completed: true },
    { step: 3, title: 'Adaptive Simulation', description: 'Surpass a passing threshold on dynamic exams.', completed: false, current: true },
    { step: 4, title: 'Full Length Board Simulation', description: 'Simulate the exact timing and constraints of the actual PRC exam.', completed: false },
    { step: 5, title: 'PRC Board Readiness Certified', description: 'Final clearance badge achieved.', completed: false },
  ];

  const weeklySchedule = [
    { day: 'Monday', date: 'July 13', task: 'Theories of Personality Mock Exam', time: '10:00 AM', status: 'Completed' },
    { day: 'Wednesday', date: 'July 15', task: 'Abnormal Psychology Diagnostic', time: '2:00 PM', status: 'Pending' },
    { day: 'Friday', date: 'July 17', task: 'Comprehensive Mock Exam Area A', time: '9:00 AM', status: 'Upcoming' },
  ];

  const scheduledExamsList = [
    { id: 1, title: 'Abnormal Psychology Diagnostic', scope: 'Entire Subject Abnormal Psychology', rules: 'Specific Time July 15, 2026 at 2:00 PM', duration: '60 minutes', status: 'Upcoming', color: 'bg-rose-900' },
    { id: 2, title: 'Theories of Personality Drill', scope: 'Specific Topics Psychoanalytic and Neopsychoanalytic Theories', rules: 'Take Anytime', duration: '45 minutes', status: 'Available', color: 'bg-blue-900' },
    { id: 3, title: 'Comprehensive Mock Exam Area A', scope: 'Combined Subjects Area A', rules: 'Specific Time July 17, 2026 at 9:00 AM', duration: '120 minutes', status: 'Upcoming', color: 'bg-emerald-900' },
    { id: 4, title: 'Industrial Psychology Baseline', scope: 'Entire Subject Industrial Psychology', rules: 'Take Anytime', duration: '60 minutes', status: 'Available', color: 'bg-purple-900' },
  ];

  const handleStartExam = () => {
    setActiveView('exam');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-bold text-lg tracking-tight text-blue-400">RPLE Learner Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Mock Exam Workspace</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveView('calendar')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Weekly Calendar
          </button>
          <button 
            onClick={() => { setActiveView('exams'); setSelectedExam(null); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'exams' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Scheduled Mock Exams
          </button>
          <button 
            onClick={() => setActiveView('summary')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'summary' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Latest Exam Summary
          </button>
          <button 
            onClick={() => setActiveView('performance')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'performance' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Historical Performance
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

      <main className="flex-1 p-6 md:p-10">
        
        {activeView === 'calendar' && (
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
                    <div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        schedule.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 
                        schedule.status === 'Pending' ? 'bg-blue-100 text-blue-800' : 
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {schedule.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Weekly Goals Tracker</h3>
                  <ul className="space-y-3 text-sm text-slate-600">
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
                  <p className="text-sm text-blue-900">Consistency is important. Make sure to log in every day to keep your review habits intact and monitor new mock exam schedules.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'exams' && selectedExam === null && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Scheduled Mock Exams</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">Select a mock exam to view details and start your session.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduledExamsList.map((exam) => (
                <div 
                  key={exam.id} 
                  onClick={() => setSelectedExam(exam.id)}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                >
                  <div className={`h-24 ${exam.color} relative`}>
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <span className="text-white font-bold text-lg opacity-80 px-4 text-center">{exam.title}</span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Scope</p>
                      <p className="text-sm text-slate-800 font-medium mb-4">{exam.scope}</p>
                      
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Schedule</p>
                      <p className="text-sm text-slate-800 font-medium">{exam.rules}</p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${exam.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {exam.status}
                      </span>
                      <span className="text-xs font-bold text-blue-600 hover:underline">View Details</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'exams' && selectedExam !== null && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm mb-4">
              <button onClick={() => setSelectedExam(null)} className="text-blue-600 hover:underline font-medium">Scheduled Mock Exams</button>
              <span className="text-slate-400">/</span>
              <span className="text-slate-600 font-semibold">Exam Details</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-3xl">
              <div className="bg-slate-900 p-8 text-white">
                <h2 className="text-2xl font-bold">{scheduledExamsList.find(e => e.id === selectedExam)?.title}</h2>
                <p className="text-slate-400 mt-2 text-sm">Review the details below before starting your attempt.</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Exam Scope</h4>
                    <p className="text-slate-800 font-medium">{scheduledExamsList.find(e => e.id === selectedExam)?.scope}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</h4>
                    <p className="text-slate-800 font-medium">{scheduledExamsList.find(e => e.id === selectedExam)?.duration}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scheduling Rules</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-blue-600 text-lg">🕒</span>
                      <p className="text-slate-800 font-medium">{scheduledExamsList.find(e => e.id === selectedExam)?.rules}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mt-6">
                  <h4 className="text-sm font-bold text-blue-800 mb-1">Important Instructions</h4>
                  <ul className="text-sm text-blue-900 space-y-1 list-disc pl-4">
                    <li>Ensure you have a stable internet connection.</li>
                    <li>The timer cannot be paused once the exam starts.</li>
                    <li>Do not refresh the page during the exam.</li>
                  </ul>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={handleStartExam}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Start Mock Exam
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'exam' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Active Examination Environment</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">Take your assigned assessments powered by the AI generation engine.</p>
            
            <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm max-w-4xl mx-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-lg font-bold text-slate-800">Abnormal Psychology Quiz</h2>
                <div className="text-red-500 font-mono font-bold bg-red-50 px-3 py-1 rounded-md">Time Remaining 44:12</div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Question 1 of 50</p>
                <h3 className="text-xl font-medium text-slate-900 leading-relaxed">
                  Which of the following personality disorders is characterized by a pervasive and unjustified distrust and suspicion of others?
                </h3>
              </div>

              <div className="space-y-3 mb-8">
                {['Schizoid Personality Disorder', 'Borderline Personality Disorder', 'Paranoid Personality Disorder', 'Antisocial Personality Disorder'].map((option, idx) => (
                  <label key={idx} className="flex items-center p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors">
                    <input type="radio" name="answer" className="h-5 w-5 text-blue-600 border-slate-300 focus:ring-blue-500" />
                    <span className="ml-3 text-sm font-medium text-slate-700">{option}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-6">
                <button className="px-6 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors">
                  Previous Item
                </button>
                <button 
                  onClick={() => setActiveView('summary')}
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Submit and Next
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'performance' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Historical Performance View</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">Track your overall scores, test trends, and past simulation milestones over time.</p>

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

        {activeView === 'summary' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Learner Post Exam Summary View</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">Examine structural analytics and AI driven architectural remediation feedback from your last test.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
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

                <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
                  <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                    🤖 Automated AI Remediation Insights
                  </h4>
                  <p className="text-sm text-blue-950 mt-2 leading-relaxed">
                    {postExamSummary.aiRagFeedback}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                  <h4 className="font-bold text-sm text-slate-700 mb-4">Competency Area Performance</h4>
                  <div className="space-y-4">
                    {postExamSummary.categoryAnalysis.map((item, idx) => (
                      <div key={idx} className="flex flex-col border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                        <p className="text-sm font-semibold text-slate-800">{item.category}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-slate-500">Accuracy {item.proficiency}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${item.status === 'Strong Mastery' ? 'bg-emerald-50 text-emerald-700' : item.status === 'Proficient' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl">
                  <h4 className="text-sm font-bold text-amber-800">Action Plan</h4>
                  <p className="text-sm text-amber-900 mt-2">Based on your summary, prioritize Industrial Psychology resources before taking another simulation.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'roadmap' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Interactive PRC Progress Roadmap Visualization</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">Monitor your macro milestone progression mapped directly against the official board exam syllabus.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-xl border border-slate-100 shadow-sm">
                <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
                  {roadmapSteps.map((step) => (
                    <div key={step.step} className="relative pl-8">
                      <div className={`absolute -left-[11px] top-0.5 h-5 w-5 rounded-full border-4 flex items-center justify-center transition-all ${
                        step.completed ? 'bg-emerald-500 border-emerald-200' : 
                        step.current ? 'bg-blue-600 border-blue-200 animate-pulse' : 
                        'bg-slate-200 border-slate-100'
                      }`} />
                      
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

              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-slate-800">Active Target Requirements</h3>
                  <p className="text-sm text-slate-500 mt-2">To clear Phase 3 you must achieve the following specific goals.</p>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">●</span> 
                      Complete a minimum of 3 dynamic exams.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">●</span> 
                      Secure a score of 75 percent or higher on each assessment.
                    </li>
                  </ul>
                </div>
                
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl">
                  <h3 className="font-bold text-emerald-800 mb-2">Progress Update</h3>
                  <p className="text-sm text-emerald-900">You are currently on track with the recommended schedule. Keep maintaining your momentum to hit Phase 4 early.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}