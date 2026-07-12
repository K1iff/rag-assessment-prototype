'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FacultyDashboard() {
  const router = useRouter();
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<null | number>(null);
  const [courseTab, setCourseTab] = useState('materials');

  const facultyCourses = [
    { id: 1, code: 'PSY301', title: 'ABNORMAL PSYCHOLOGY', section: 'Section A1', students: 45, avgScore: '82%', color: 'bg-rose-900' },
    { id: 2, code: 'PSY302', title: 'THEORIES OF PERSONALITY', section: 'Section A1', students: 45, avgScore: '78%', color: 'bg-blue-900' },
    { id: 3, code: 'PSY303', title: 'INDUSTRIAL PSYCHOLOGY', section: 'Section B2', students: 38, avgScore: '71%', color: 'bg-emerald-900' },
  ];

  const dashboardStats = {
    totalStudents: 128,
    activeCourses: 3,
    pendingReviews: 12,
    overallPassRate: '88%'
  };

  const [schedules, setSchedules] = useState([
    { id: 1, course: 'PSY301', date: '2026-07-15', time: '10:00 AM', title: 'Synchronous Lecture: DSM-5 Updates', type: 'Lecture' },
    { id: 2, course: 'PSY302', date: '2026-07-16', time: '02:00 PM', title: 'Mock Exam 1 Availability', type: 'Exam' },
  ]);

  const materials = [
    { id: 1, title: 'Chapter 1: Introduction to Abnormal Behavior', type: 'PDF', size: '2.4 MB' },
    { id: 2, title: 'Week 2 Presentation Slides', type: 'PPTX', size: '5.1 MB' },
    { id: 3, title: 'Case Study Requirements', type: 'DOCX', size: '1.2 MB' },
  ];

  const aiQuestions = [
    { id: 1, topic: 'Schizophrenia Spectrum', question: 'Which symptom is considered a negative symptom of schizophrenia?', options: ['Delusions', 'Hallucinations', 'Avolition', 'Disorganized speech'], answer: 'Avolition', status: 'Pending' },
    { id: 2, topic: 'Bipolar Disorders', question: 'What is the primary difference between Bipolar I and Bipolar II?', options: ['Presence of major depressive episodes', 'Presence of a full manic episode', 'Age of onset', 'Response to lithium'], answer: 'Presence of a full manic episode', status: 'Pending' },
  ];

  const renderSidebarButton = (viewName: string, label: string) => (
    <button 
      onClick={() => {
        setActiveView(viewName);
        if (viewName !== 'courses') setSelectedCourse(null);
      }}
      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === viewName && selectedCourse === null ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-bold text-lg tracking-tight text-blue-400">RPLE Faculty Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Instructor Workspace</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {renderSidebarButton('dashboard', 'Dashboard Overview')}
          {renderSidebarButton('courses', 'My Courses')}
          {renderSidebarButton('calendar', 'Schedule & Calendar')}
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

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {activeView === 'dashboard' && selectedCourse === null && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Welcome Back, Instructor</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">Here is a summary of your classes and pending tasks for this week.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Students</span>
                <p className="text-3xl font-bold text-slate-800 mt-1">{dashboardStats.totalStudents}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Courses</span>
                <p className="text-3xl font-bold text-blue-600 mt-1">{dashboardStats.activeCourses}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Item Reviews</span>
                <p className="text-3xl font-bold text-amber-600 mt-1">{dashboardStats.pendingReviews}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Pass Rate</span>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{dashboardStats.overallPassRate}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mt-8">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-sm text-slate-700">Course Performance Summary</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500 tracking-wider">
                    <th className="p-4">Course Code</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">Section</th>
                    <th className="p-4">Enrolled Students</th>
                    <th className="p-4">Average Score</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {facultyCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-blue-600">{course.code}</td>
                      <td className="p-4 font-medium text-slate-800">{course.title}</td>
                      <td className="p-4 text-slate-500">{course.section}</td>
                      <td className="p-4 text-slate-700">{course.students}</td>
                      <td className="p-4 font-semibold text-emerald-600">{course.avgScore}</td>
                      <td className="p-4">
                        <button 
                          onClick={() => { setActiveView('courses'); setSelectedCourse(course.id); setCourseTab('materials'); }}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Manage Course
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'courses' && selectedCourse === null && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">My Courses</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facultyCourses.map((course) => (
                <div 
                  key={course.id} 
                  onClick={() => { setSelectedCourse(course.id); setCourseTab('materials'); }}
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
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-600">{course.students} Students</span>
                      <span className="text-xs font-bold text-blue-600">Manage Course</span>
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
              <span className="text-slate-600 font-semibold">{facultyCourses.find(c => c.id === selectedCourse)?.title}</span>
            </div>

            <div className="bg-slate-900 text-white rounded-t-lg flex gap-6 px-6 pt-4 border-b border-slate-700">
              <button onClick={() => setCourseTab('materials')} className={`pb-3 border-b-2 text-sm font-medium ${courseTab === 'materials' ? 'border-blue-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Material & Library</button>
              <button onClick={() => setCourseTab('exam-gen')} className={`pb-3 border-b-2 text-sm font-medium ${courseTab === 'exam-gen' ? 'border-blue-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Exam Generator</button>
              <button onClick={() => setCourseTab('ai-review')} className={`pb-3 border-b-2 text-sm font-medium ${courseTab === 'ai-review' ? 'border-blue-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>AI Question Review</button>
            </div>

            <div className="bg-white border border-slate-200 rounded-b-lg p-6 shadow-sm min-h-[500px]">
              
              {courseTab === 'materials' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-800">Course Materials</h2>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition-colors">Upload New File</button>
                  </div>
                  <div className="space-y-3">
                    {materials.map((file) => (
                      <div key={file.id} className="flex justify-between items-center p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 text-blue-700 rounded flex items-center justify-center font-bold text-xs">{file.type}</div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{file.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{file.size}</p>
                          </div>
                        </div>
                        <button className="text-slate-400 hover:text-red-500 transition-colors text-sm font-medium">Delete</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {courseTab === 'exam-gen' && (
                <div className="max-w-2xl">
                  <h2 className="text-lg font-bold text-slate-800 mb-2">AI Exam Generator</h2>
                  <p className="text-sm text-slate-500 mb-6">Create customized assessments based on your uploaded syllabus and library materials.</p>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Assessment Title</label>
                      <input type="text" placeholder="e.g. Midterm Coverage Quiz" className="w-full px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Select Topics / Source Materials</label>
                      <select className="w-full px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500">
                        <option>Chapter 1: Introduction to Abnormal Behavior</option>
                        <option>Week 2 Presentation Slides</option>
                        <option>Entire Course Repository</option>
                      </select>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Number of Items</label>
                        <input type="number" defaultValue={20} className="w-full px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Difficulty Level</label>
                        <select className="w-full px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500">
                          <option>Easy (Recall)</option>
                          <option>Moderate (Analysis)</option>
                          <option>Hard (Application)</option>
                        </select>
                      </div>
                    </div>

                    <button className="mt-4 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors w-full">
                      Generate Exam Draft
                    </button>
                  </div>
                </div>
              )}

              {courseTab === 'ai-review' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-800">Pending AI Question Reviews</h2>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">{aiQuestions.length} Items Pending</span>
                  </div>
                  
                  <div className="space-y-6">
                    {aiQuestions.map((q) => (
                      <div key={q.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{q.topic}</span>
                        </div>
                        <p className="text-base font-semibold text-slate-900 mb-4">{q.question}</p>
                        
                        <div className="space-y-2 mb-5">
                          {q.options.map((opt, idx) => (
                            <div key={idx} className={`p-3 border rounded-md text-sm ${opt === q.answer ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}>
                              {opt} {opt === q.answer && <span className="ml-2 text-xs font-bold text-emerald-600">(Correct Answer)</span>}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-3 pt-4 border-t border-slate-200">
                          <button className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition-colors">Approve Question</button>
                          <button className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded hover:bg-slate-300 transition-colors">Edit</button>
                          <button className="px-4 py-2 bg-red-100 text-red-700 text-xs font-bold rounded hover:bg-red-200 transition-colors">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {activeView === 'calendar' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Schedule & Calendar</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">Manage synchronous lectures, deadlines, and exam schedules for your cohorts.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-sm text-slate-700">Upcoming Events</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-blue-600">{schedule.course}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${schedule.type === 'Exam' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{schedule.type}</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800">{schedule.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{schedule.date} at {schedule.time}</p>
                        </div>
                        <button className="text-slate-400 hover:text-blue-600 text-sm font-medium">Edit</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Add New Schedule</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Target Course</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500">
                        {facultyCourses.map(c => <option key={c.id}>{c.code}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title</label>
                      <input type="text" placeholder="Event Name" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                        <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                        <input type="time" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                    <button className="w-full mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors">
                      Save Schedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}