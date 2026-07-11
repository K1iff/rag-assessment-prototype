'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LearnerDashboard() {
  const router = useRouter();
  const [activeView, setActiveView] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState<null | number>(null);

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

  const roadmapSteps = [
    { step: 1, title: 'Diagnostic Baseline', description: 'Establish foundational knowledge metrics.', completed: true },
    { step: 2, title: 'Core Subject Drills', description: 'Complete dedicated modules for all 4 major board topics.', completed: true },
    { step: 3, title: 'AI-Generated Adaptive Simulation', description: 'Surpass a 75% threshold on RAG dynamic exams.', completed: false, current: true },
    { step: 4, title: 'Full Length Board Simulation', description: 'Simulate the exact timing and constraints of the actual PRC exam.', completed: false },
    { step: 5, title: 'PRC Board Readiness Certified', description: 'Final clearance badge achieved.', completed: false },
  ];

  const weeklySchedule = [
    { day: 'Monday', date: 'July 13', task: 'Review Theories of Personality', time: '10:00 AM', status: 'Completed' },
    { day: 'Wednesday', date: 'July 15', task: 'Abnormal Psychology Quiz', time: '2:00 PM', status: 'Pending' },
    { day: 'Friday', date: 'July 17', task: 'Comprehensive Mock Exam Area A', time: '9:00 AM', status: 'Upcoming' },
  ];

  const loadedCourses = [
    { id: 1, code: 'PSY301', title: 'ABNORMAL PSYCHOLOGY', section: 'Section A1', instructor: 'Dr. Sarah Jenkins', status: 'Open', color: 'bg-rose-900' },
    { id: 2, code: 'PSY302', title: 'THEORIES OF PERSONALITY', section: 'Section A1', instructor: 'Prof. Mark Davis', status: 'Open', color: 'bg-blue-900' },
    { id: 3, code: 'PSY303', title: 'INDUSTRIAL PSYCHOLOGY', section: 'Section B2', instructor: 'Dr. Emily Chen', status: 'Open', color: 'bg-emerald-900' },
    { id: 4, code: 'PSY304', title: 'PSYCHOLOGICAL ASSESSMENT', section: 'Section B2', instructor: 'Multiple Instructors', status: 'Open', color: 'bg-purple-900' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-bold text-lg tracking-tight text-blue-400">RPLE Learner Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Reviewer Workspace</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setActiveView('courses'); setSelectedCourse(null); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'courses' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            My Courses
          </button>
          <button 
            onClick={() => setActiveView('calendar')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Weekly Calendar
          </button>
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

      <main className="flex-1 p-6 md:p-10">
        
        {activeView === 'courses' && selectedCourse === null && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Courses</h1>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input 
                type="text" 
                placeholder="Search your courses" 
                className="flex-1 px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
              />
              <select className="px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500">
                <option>All Terms</option>
                <option>1st Term AY2026-2027</option>
              </select>
              <select className="px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500">
                <option>All courses</option>
                <option>Open courses</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loadedCourses.map((course) => (
                <div 
                  key={course.id} 
                  onClick={() => setSelectedCourse(course.id)}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                >
                  <div className={`h-32 ${course.color} relative`}>
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <span className="text-white font-bold text-xl opacity-50">{course.code}</span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 leading-tight">{course.code} {course.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{course.section}</p>
                      <p className="text-xs font-semibold text-emerald-600 mt-2">{course.status}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs text-blue-600">{course.instructor}</span>
                      <button className="text-slate-400 hover:text-slate-600">☆</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'courses' && selectedCourse !== null && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm mb-4">
              <button onClick={() => setSelectedCourse(null)} className="text-blue-600 hover:underline font-medium">Courses</button>
              <span className="text-slate-400">/</span>
              <span className="text-slate-600 font-semibold">{loadedCourses.find(c => c.id === selectedCourse)?.title}</span>
            </div>

            <div className="bg-slate-900 text-white rounded-t-lg flex gap-6 px-6 pt-4 border-b border-slate-700">
              <button className="pb-3 border-b-2 border-blue-400 font-medium text-sm">Content</button>
              <button className="pb-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 text-sm">Calendar</button>
              <button className="pb-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 text-sm">Announcements</button>
              <button className="pb-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 text-sm">Discussions</button>
              <button className="pb-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 text-sm">Gradebook</button>
            </div>

            <div className="bg-white border border-slate-200 rounded-b-lg p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-8">
                <div className="h-16 w-16 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-xs text-center p-2">
                  Module 3
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-800">Module 3: Core Concepts</h2>
                  <p className="text-sm text-slate-600 mt-1">In this module, we delve deeper into the fundamental theories and their direct application to psychological assessment and diagnosis.</p>
                  
                  <div className="mt-4 flex items-center justify-end gap-3">
                    <span className="text-xs text-slate-500">5 of 15 completed</span>
                    <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="w-1/3 bg-emerald-500 h-full"></div>
                      <div className="w-2/3 bg-transparent h-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-md cursor-pointer text-sm text-slate-700">
                  <span className="text-slate-400">📄</span>
                  <span>Lesson 13: Fundamentals of Assessment</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-md cursor-pointer text-sm text-slate-700">
                  <span className="text-slate-400">📄</span>
                  <span>Lesson 14: Analysis of Clinical Data</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-md cursor-pointer text-sm text-slate-700">
                  <span className="text-slate-400">📄</span>
                  <span>Lesson 15: Interpretation of Results</span>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-800">
                    <span>📁</span> Module 3: Assessments
                  </div>
                  
                  <div className="ml-6 space-y-4">
                    <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-md bg-slate-50">
                      <span className="mt-0.5 text-slate-400">💬</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">Exercise 13 (Coverage: Fundamentals)</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 border border-blue-200 rounded-md bg-blue-50">
                      <span className="mt-0.5 text-emerald-500">📝</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">Quiz 13 (Coverage: Clinical Data Analysis)</p>
                        <p className="text-xs text-slate-500 mt-1">Due date: 7/15/26, 11:59 PM (UTC+8) | Time limit: 45 minutes</p>
                        <p className="text-xs text-slate-500 mt-0.5">Multiple Choice & True or False</p>
                        <button 
                          onClick={() => setActiveView('exam')}
                          className="mt-3 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors"
                        >
                          Start Attempt
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'calendar' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Student Weekly Schedule & Tasks</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">View your upcoming reviews, scheduled quizzes, and mandatory simulations.</p>
            
            <div className="space-y-4 max-w-4xl">
              {weeklySchedule.map((schedule, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{schedule.task}</h3>
                    <p className="text-sm text-slate-500 mt-1">Scheduled for {schedule.day}, {schedule.date} at {schedule.time}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      schedule.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 
                      schedule.status === 'Pending' ? 'bg-blue-100 text-blue-800 animate-pulse' : 
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {schedule.status}
                    </span>
                    {schedule.status === 'Pending' && (
                      <button 
                        onClick={() => setActiveView('exam')}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Start Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
                <div className="text-red-500 font-mono font-bold bg-red-50 px-3 py-1 rounded-md">Time Remaining: 44:12</div>
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
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-2xl font-bold text-slate-800">Learner Post Exam Summary View</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">Examine structural analytics and AI-driven architectural remediation feedback from your last test.</p>

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
                🤖 Automated RAG Remediation Insights
              </h4>
              <p className="text-sm text-blue-950 mt-2 leading-relaxed">
                {postExamSummary.aiRagFeedback}
              </p>
            </div>

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

        {activeView === 'roadmap' && (
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-slate-800">Interactive PRC Progress Roadmap Visualization</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">Monitor your macro milestone progression mapped directly against the official board exam syllabus.</p>

            <div className="bg-white p-6 md:p-10 rounded-xl border border-slate-100 shadow-sm">
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
          </div>
        )}

      </main>
    </div>
  );
}