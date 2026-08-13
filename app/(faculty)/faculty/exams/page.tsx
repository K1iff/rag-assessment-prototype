'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FacultyExamsPage() {
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState<null | number>(null);
  const [examTab, setExamTab] = useState('settings');
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);

  const exams = [
    { id: 1, title: 'Midterm Coverage Quiz', target: 'PSY301', items: 30, status: 'Active', dueDate: '2026-07-20', color: 'bg-emerald-600' },
    { id: 2, title: 'Personality Theories Final', target: 'PSY302', items: 50, status: 'Pending', dueDate: '2026-08-10', color: 'bg-amber-500' },
    { id: 3, title: 'Introductory Concepts Quiz', target: 'PSY301', items: 15, status: 'Inactive', dueDate: '2026-06-15', color: 'bg-slate-600' },
    { id: 4, title: 'Organizational Behavior Check', target: 'PSY303', items: 25, status: 'Active', dueDate: '2026-07-18', color: 'bg-emerald-600' },
  ];

  const aiQuestions = [
    { id: 1, topic: 'Schizophrenia Spectrum', question: 'Which symptom is considered a negative symptom of schizophrenia?', options: ['Delusions', 'Hallucinations', 'Avolition', 'Disorganized speech'], answer: 'Avolition', confidence: 'High', citation: 'Derived from Abnormal_Psych_DSM5_Guidelines.pdf, Page 42' },
    { id: 2, topic: 'Bipolar Disorders', question: 'What is the primary difference between Bipolar I and Bipolar II?', options: ['Presence of major depressive episodes', 'Presence of a full manic episode', 'Age of onset', 'Response to lithium'], answer: 'Presence of a full manic episode', confidence: 'High', citation: 'Derived from Abnormal_Psych_DSM5_Guidelines.pdf, Page 58' },
    { id: 3, topic: 'Depressive Disorders', question: 'Persistent Depressive Disorder requires symptoms to be present for at least how long in adults?', options: ['6 months', '1 year', '2 years', '5 years'], answer: '2 years', confidence: 'Medium', citation: 'Derived from Abnormal_Psych_DSM5_Guidelines.pdf, Page 61' },
  ];

  const studentAnalytics = [
    { id: 101, name: 'Juan Santos', status: 'Completed', takenAt: 'July 15, 2026 10:30 AM', grade: '28/30 (93%)' },
    { id: 102, name: 'Ana Reyes', status: 'Completed', takenAt: 'July 16, 2026 02:15 PM', grade: '22/30 (73%)' },
    { id: 103, name: 'Luis Cruz', status: 'Not Taken', takenAt: 'Pending', grade: 'Pending' },
    { id: 104, name: 'Maria Clara', status: 'Completed', takenAt: 'July 15, 2026 11:45 AM', grade: '29/30 (96%)' },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'Active') return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    if (status === 'Pending') return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    return <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider">{status}</span>;
  };

  const getActionLabel = (status: string) => {
    if (status === 'Pending') return 'Review Questions';
    if (status === 'Inactive') return 'View Results';
    return 'Edit Settings';
  };

  const toggleQuestionSelection = (id: number) => {
    if (selectedQuestions.includes(id)) {
      setSelectedQuestions(selectedQuestions.filter(qId => qId !== id));
    } else {
      setSelectedQuestions([...selectedQuestions, id]);
    }
  };

  const selectAllHighConfidence = () => {
    const highConfIds = aiQuestions.filter(q => q.confidence === 'High').map(q => q.id);
    setSelectedQuestions(highConfIds);
  };

  const currentExam = exams.find(e => e.id === selectedExam);

  if (selectedExam !== null && currentExam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm mb-4">
          <button onClick={() => setSelectedExam(null)} className="text-blue-600 hover:underline font-bold">Exams</button>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600 font-bold">{currentExam.title}</span>
        </div>

        <div className="bg-slate-900 text-white rounded-t-xl flex gap-8 px-8 pt-5 border-b border-slate-700 overflow-x-auto">
          <button 
            onClick={() => setExamTab('settings')} 
            className={`pb-4 border-b-2 text-sm font-bold whitespace-nowrap ${examTab === 'settings' ? 'border-blue-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Exam Settings
          </button>
          <button 
            onClick={() => {
              if (currentExam.status !== 'Active') setExamTab('questions');
            }} 
            className={`pb-4 border-b-2 text-sm font-bold flex items-center gap-2 whitespace-nowrap ${examTab === 'questions' ? 'border-blue-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'} ${currentExam.status === 'Active' ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={currentExam.status === 'Active' ? 'Questions are locked while the exam is active.' : ''}
          >
            {currentExam.status === 'Active' && <span>🔒</span>}
            Question Validation
          </button>
          <button 
            onClick={() => setExamTab('analytics')} 
            className={`pb-4 border-b-2 text-sm font-bold whitespace-nowrap ${examTab === 'analytics' ? 'border-blue-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Analytics
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-b-xl p-8 shadow-sm min-h-[500px]">
          
          {examTab === 'settings' && (
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Edit Exam Details</h2>
              <p className="text-sm text-slate-500 mb-8 font-bold">Manage availability, due dates, and general settings for this assessment.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Assessment Title</label>
                  <input type="text" defaultValue={currentExam.title} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Target Audience</label>
                    <input type="text" defaultValue={currentExam.target} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
                    <input type="date" defaultValue={currentExam.dueDate} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Exam Status</label>
                  <select defaultValue={currentExam.status} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="Active">Active (Available for learners to take)</option>
                    <option value="Pending">Pending (Questions need checking and validation)</option>
                    <option value="Inactive">Inactive / Finished (Deadline passed)</option>
                  </select>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                  <button className="px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {examTab === 'questions' && (
            currentExam.status === 'Active' ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="text-xl font-bold text-slate-800">Validation Locked</h3>
                <p className="text-sm text-slate-500 font-bold mt-2 max-w-md">
                  This exam is currently active. The question validation process is locked because students may already be taking the assessment. Change the status to Pending to unlock.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Pending Question Validations</h2>
                    <p className="text-sm text-slate-500 font-bold mt-1">Review AI generated items before deploying to students.</p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={selectAllHighConfidence} className="flex-1 md:flex-none px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                      Select High-Confidence
                    </button>
                    <button className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50" disabled={selectedQuestions.length === 0}>
                      Batch Approve ({selectedQuestions.length})
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {aiQuestions.map((q) => (
                    <div key={q.id} className={`p-6 border rounded-xl transition-colors ${selectedQuestions.includes(q.id) ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={selectedQuestions.includes(q.id)}
                            onChange={() => toggleQuestionSelection(q.id)}
                            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{q.topic}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${q.confidence === 'High' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {q.confidence} Confidence
                        </span>
                      </div>

                      <div className="mb-5 ml-8">
                        <p className="text-lg font-bold text-slate-900 mb-2">{q.question}</p>
                        <div className="bg-slate-100 border border-slate-200 p-3 rounded-md flex items-start gap-2">
                          <span className="text-lg">🤖</span>
                          <p className="text-xs text-slate-600 font-bold leading-relaxed">{q.citation}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-6 ml-8">
                        {q.options.map((opt, idx) => (
                          <div key={idx} className={`p-4 border rounded-lg text-sm font-bold ${opt === q.answer ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-white border-slate-200 text-slate-600'}`}>
                            {opt} {opt === q.answer && <span className="ml-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">(Correct Answer)</span>}
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex flex-wrap gap-3 pt-5 border-t border-slate-200 ml-8">
                        <button className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">Approve</button>
                        <button className="px-5 py-2.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors shadow-sm">Edit Manually</button>
                        <button className="px-5 py-2.5 border border-purple-300 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-50 transition-colors shadow-sm flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                          Regenerate Question
                        </button>
                        <button className="px-5 py-2.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors shadow-sm ml-auto">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {examTab === 'analytics' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Student Analytics</h2>
                  <p className="text-sm text-slate-500 font-bold mt-1">Review student progress and completion grades for this assessment.</p>
                </div>
                <button className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Export to CSV
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Student Name</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date and Time Taken</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Grade</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {studentAnalytics.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{student.name}</td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${student.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-500">{student.takenAt}</td>
                        <td className="p-4 font-bold text-slate-700">{student.grade}</td>
                        <td className="p-4 text-right">
                          <button disabled={student.status !== 'Completed'} className={`text-xs font-bold ${student.status === 'Completed' ? 'text-blue-600 hover:underline' : 'text-slate-400 cursor-not-allowed'}`}>
                            View Answers
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Exam Management</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">Create, monitor, and validate mock exams for your cohorts.</p>
        </div>
        <button 
          onClick={() => router.push('/faculty/exams/create')}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          + Create New Exam
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
        {exams.map((exam) => (
          <div 
            key={exam.id} 
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col relative"
          >
            <div className={`h-1.5 w-full ${exam.color}`}></div>
            
            <div className="absolute top-4 right-4">
              <button className="text-slate-400 hover:text-slate-700 focus:outline-none" title="Quick Actions">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
              </button>
            </div>

            <div 
              onClick={() => { setSelectedExam(exam.id); setExamTab('settings'); }}
              className="p-6 flex-1 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex justify-between items-start mb-4 pr-6">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{exam.target}</span>
                  {getStatusBadge(exam.status)}
                </div>
                <h3 className="font-bold text-lg text-slate-800 leading-snug">{exam.title}</h3>
                <p className="text-sm text-slate-500 font-bold mt-2">Due: {exam.dueDate}</p>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600">{exam.items} Questions</span>
                <span className="text-sm font-bold text-blue-600 hover:underline">{getActionLabel(exam.status)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}