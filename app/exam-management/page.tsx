'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExamManagementDashboard() {
  const router = useRouter();
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedExam, setSelectedExam] = useState<null | number>(null);
  const [examTab, setExamTab] = useState('settings');

  const dashboardStats = {
    totalExams: 24,
    activeExams: 5,
    pendingReviews: 12,
    overallCompletion: '92%'
  };

  const exams = [
    { id: 1, title: 'Midterm Coverage Quiz', target: 'PSY301', items: 30, status: 'Active', dueDate: '2026-07-20', color: 'bg-emerald-600' },
    { id: 2, title: 'Personality Theories Final', target: 'PSY302', items: 50, status: 'Pending', dueDate: '2026-08-10', color: 'bg-amber-500' },
    { id: 3, title: 'Introductory Concepts Quiz', target: 'PSY301', items: 15, status: 'Inactive/Finished', dueDate: '2026-06-15', color: 'bg-slate-600' },
    { id: 4, title: 'Organizational Behavior Check', target: 'PSY303', items: 25, status: 'Active', dueDate: '2026-07-18', color: 'bg-emerald-600' },
  ];

  const materials = [
    { id: 1, title: 'Chapter 1: Introduction to Abnormal Behavior', type: 'PDF', size: '2.4 MB', uploadDate: '2026-07-01' },
    { id: 2, title: 'Week 2 Presentation Slides', type: 'PPTX', size: '5.1 MB', uploadDate: '2026-07-05' },
    { id: 3, title: 'Case Study Requirements', type: 'DOCX', size: '1.2 MB', uploadDate: '2026-07-08' },
  ];

  const aiQuestions = [
    { id: 1, topic: 'Schizophrenia Spectrum', question: 'Which symptom is considered a negative symptom of schizophrenia?', options: ['Delusions', 'Hallucinations', 'Avolition', 'Disorganized speech'], answer: 'Avolition', status: 'Pending' },
    { id: 2, topic: 'Bipolar Disorders', question: 'What is the primary difference between Bipolar I and Bipolar II?', options: ['Presence of major depressive episodes', 'Presence of a full manic episode', 'Age of onset', 'Response to lithium'], answer: 'Presence of a full manic episode', status: 'Pending' },
  ];

  const renderSidebarButton = (viewName: string, label: string) => (
    <button 
      onClick={() => {
        setActiveView(viewName);
        if (viewName !== 'exams') setSelectedExam(null);
      }}
      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === viewName && selectedExam === null ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
    >
      {label}
    </button>
  );

  const getStatusBadge = (status: string) => {
    if (status === 'Active') return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-bold uppercase tracking-wider">{status}</span>;
    if (status === 'Pending') return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-bold uppercase tracking-wider">{status}</span>;
    return <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold uppercase tracking-wider">{status}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-bold text-lg tracking-tight text-blue-400">RPLE Faculty Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Exam Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {renderSidebarButton('dashboard', 'Dashboard Overview')}
          {renderSidebarButton('exams', 'Exam Management')}
          {renderSidebarButton('materials', 'Reference Materials')}
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
        
        {activeView === 'dashboard' && selectedExam === null && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Welcome Back, Instructor</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">Here is a summary of your upcoming exams and pending validations for this week.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Exams</span>
                <p className="text-3xl font-bold text-slate-800 mt-1">{dashboardStats.totalExams}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Exams</span>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{dashboardStats.activeExams}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Validations</span>
                <p className="text-3xl font-bold text-amber-600 mt-1">{dashboardStats.pendingReviews}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Completion</span>
                <p className="text-3xl font-bold text-blue-600 mt-1">{dashboardStats.overallCompletion}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mt-8">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-sm text-slate-700">Exam Overview</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500 tracking-wider">
                    <th className="p-4">Exam Title</th>
                    <th className="p-4">Target Audience</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{exam.title}</td>
                      <td className="p-4 text-slate-500">{exam.target}</td>
                      <td className="p-4 text-slate-700">{exam.items}</td>
                      <td className="p-4">{getStatusBadge(exam.status)}</td>
                      <td className="p-4 text-slate-600">{exam.dueDate}</td>
                      <td className="p-4">
                        <button 
                          onClick={() => { setActiveView('exams'); setSelectedExam(exam.id); setExamTab('settings'); }}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'exams' && selectedExam === null && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-slate-800">Exam Management</h1>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition-colors">
                Create New Exam
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => (
                <div 
                  key={exam.id} 
                  onClick={() => { setSelectedExam(exam.id); setExamTab('settings'); }}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                >
                  <div className={`h-4 ${exam.color}`}></div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500">{exam.target}</span>
                        {getStatusBadge(exam.status)}
                      </div>
                      <h3 className="font-bold text-lg text-slate-800 leading-tight">{exam.title}</h3>
                      <p className="text-sm text-slate-500 mt-2">Due: {exam.dueDate}</p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">{exam.items} Questions</span>
                      <span className="text-sm font-bold text-blue-600">Edit Details</span>
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
              <button onClick={() => setSelectedExam(null)} className="text-blue-600 hover:underline font-medium">Exams</button>
              <span className="text-slate-400">/</span>
              <span className="text-slate-600 font-semibold">{exams.find(e => e.id === selectedExam)?.title}</span>
            </div>

            <div className="bg-slate-900 text-white rounded-t-lg flex gap-6 px-6 pt-4 border-b border-slate-700">
              <button onClick={() => setExamTab('settings')} className={`pb-3 border-b-2 text-sm font-medium ${examTab === 'settings' ? 'border-blue-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Exam Settings</button>
              <button onClick={() => setExamTab('questions')} className={`pb-3 border-b-2 text-sm font-medium ${examTab === 'questions' ? 'border-blue-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Question Validation</button>
            </div>

            <div className="bg-white border border-slate-200 rounded-b-lg p-6 shadow-sm min-h-[500px]">
              
              {examTab === 'settings' && (
                <div className="max-w-2xl">
                  <h2 className="text-lg font-bold text-slate-800 mb-2">Edit Exam Details</h2>
                  <p className="text-sm text-slate-500 mb-6">Manage availability, due dates, and general settings for this assessment.</p>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Assessment Title</label>
                      <input type="text" defaultValue={exams.find(e => e.id === selectedExam)?.title} className="w-full px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500" />
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Target Audience</label>
                        <input type="text" defaultValue={exams.find(e => e.id === selectedExam)?.target} className="w-full px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                        <input type="date" defaultValue={exams.find(e => e.id === selectedExam)?.dueDate} className="w-full px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Exam Status</label>
                      <select defaultValue={exams.find(e => e.id === selectedExam)?.status} className="w-full px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500">
                        <option value="Active">Active (Available for learners to take)</option>
                        <option value="Pending">Pending (Questions need checking and validation)</option>
                        <option value="Inactive/Finished">Inactive / Finished (Deadline passed or already answered)</option>
                      </select>
                    </div>

                    <button className="mt-4 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors w-full">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {examTab === 'questions' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-800">Pending Question Validations</h2>
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
                          <button className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded hover:bg-slate-300 transition-colors">Edit Question</button>
                          <button className="px-4 py-2 bg-red-100 text-red-700 text-xs font-bold rounded hover:bg-red-200 transition-colors">Reject Question</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {activeView === 'materials' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Reference Materials</h1>
                <p className="text-sm text-slate-500 mt-1">Upload syllabus, reading materials, and rubrics for AI exam generation.</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition-colors">
                Upload New File
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500 tracking-wider">
                    <th className="p-4">File Name</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Size</th>
                    <th className="p-4">Date Uploaded</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {materials.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-800">{file.title}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">{file.type}</span>
                      </td>
                      <td className="p-4 text-slate-500">{file.size}</td>
                      <td className="p-4 text-slate-500">{file.uploadDate}</td>
                      <td className="p-4 flex gap-3">
                        <button className="text-blue-600 hover:underline font-medium text-xs">Download</button>
                        <button className="text-red-500 hover:underline font-medium text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}