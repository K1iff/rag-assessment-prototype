'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upload');

  // Module: Document Library Portal State
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Theories_of_Personality_Reviewer.pdf', size: '4.2 MB', uploadedBy: 'Carl Abel', date: '2026-07-10' },
    { id: 2, name: 'Abnormal_Psychology_DSM5_Notes.pdf', size: '8.7 MB', uploadedBy: 'Carl Abel', date: '2026-07-09' },
    { id: 3, name: 'Industrial_Organization_Principles.docx', size: '1.5 MB', uploadedBy: 'System Admin', date: '2026-07-05' },
  ]);

  // Module: Exam Parameter Configuration Panel State
  const [config, setConfig] = useState({
    subject: 'Theories of Personality',
    questionCount: '50',
    difficulty: 'Moderate',
    timeLimit: '60',
  });

  // Module: AI Question Review, Validation, & Editing Interface State
  const [aiQuestions, setAiQuestions] = useState([
    {
      id: 1,
      question: 'According to Sigmund Freud, which component of personality operates strictly on the pleasure principle?',
      options: ['Id', 'Ego', 'Superego', 'Libido'],
      correctAnswer: 'Id',
      status: 'Pending Review',
    },
    {
      id: 2,
      question: 'Which of the following is characterized by a pervasive and unjustified distrust and suspicion of others?',
      options: ['Schizoid Personality Disorder', 'Borderline Personality Disorder', 'Paranoid Personality Disorder', 'Antisocial Personality Disorder'],
      correctAnswer: 'Paranoid Personality Disorder',
      status: 'Approved',
    },
  ]);

  const handleStatusChange = (id: number, newStatus: string) => {
    setAiQuestions(aiQuestions.map(q => q.id === id ? { ...q, status: newStatus } : q));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-bold text-lg tracking-tight text-emerald-400">RPLE Faculty Portal</h2>
          <p className="text-xs text-slate-400 mt-1">AI Exam Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'upload' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Material & Library
          </button>
          <button 
            onClick={() => setActiveTab('configure')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'configure' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Exam Generator
          </button>
          <button 
            onClick={() => setActiveTab('review')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'review' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            AI Question Review
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

      {/* Main Workspace */}
      <main className="flex-1 p-6 md:p-10">
        
        {/* Dynamic Section Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            {activeTab === 'upload' && 'Reference Material Upload & Document Library'}
            {activeTab === 'configure' && 'Exam Parameter Configuration Panel'}
            {activeTab === 'review' && 'AI Question Review, Validation, & Editing Interface'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeTab === 'upload' && 'Upload core psychometrician learning materials to expand the RAG architectural knowledge base.'}
            {activeTab === 'configure' && 'Set targeted parameters for the AI engine to generate specific board exam simulation sets.'}
            {activeTab === 'review' && 'Verify, adjust, and approve AI generated assessment materials prior to student delivery.'}
          </p>
        </div>

        {/* Tab Content 1: Reference Material Upload & Document Library */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-dashed border-slate-200 text-center hover:border-emerald-500 transition-colors cursor-pointer">
              <p className="text-sm font-medium text-slate-700">Drag and drop your board exam reviewers here</p>
              <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, and TXT format up to 50MB</p>
              <button className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors">
                Browse Files
              </button>
            </div>

            {/* Document Library Portal Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-sm text-slate-700">Knowledge Base Library Portal</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500 tracking-wider">
                    <th className="p-4">Document Title</th>
                    <th className="p-4">Size</th>
                    <th className="p-4">Contributor</th>
                    <th className="p-4">Upload Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-medium text-slate-800">{doc.name}</td>
                      <td className="p-4 text-slate-500">{doc.size}</td>
                      <td className="p-4 text-slate-600">{doc.uploadedBy}</td>
                      <td className="p-4 text-slate-500">{doc.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 2: Exam Parameter Configuration Panel */}
        {activeTab === 'configure' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 max-w-2xl">
            <form onSubmit={(e) => { e.preventDefault(); setActiveTab('review'); }} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Target Subject Matter Area</label>
                <select 
                  value={config.subject} 
                  onChange={(e) => setConfig({...config, subject: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option>Theories of Personality</option>
                  <option>Abnormal Psychology</option>
                  <option>Industrial Psychology</option>
                  <option>Psychological Assessment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Number of AI Generated Questions</label>
                <input 
                  type="number" 
                  value={config.questionCount}
                  onChange={(e) => setConfig({...config, questionCount: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Complexity Level</label>
                  <select 
                    value={config.difficulty}
                    onChange={(e) => setConfig({...config, difficulty: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option>Easy</option>
                    <option>Moderate</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Duration Allocation (Minutes)</label>
                  <input 
                    type="number" 
                    value={config.timeLimit}
                    onChange={(e) => setConfig({...config, timeLimit: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm mt-4">
                Initiate AI RAG Generation Engine
              </button>
            </form>
          </div>
        )}

        {/* Tab Content 3: AI Question Review, Validation, & Editing Interface */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            {aiQuestions.map((q) => (
              <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between items-start">
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold ${q.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                    {q.status}
                  </span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleStatusChange(q.id, 'Approved')}
                      className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-medium rounded transition-colors text-slate-600"
                    >
                      Approve Question
                    </button>
                    <button 
                      onClick={() => handleStatusChange(q.id, 'Needs Adjustment')}
                      className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-xs font-medium rounded transition-colors text-slate-600"
                    >
                      Flag for Edit
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Generated Prompt</label>
                  <textarea 
                    defaultValue={q.question}
                    className="w-full p-3 text-sm font-medium text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((option, idx) => (
                    <div key={idx} className={`flex items-center p-2.5 rounded-lg border text-sm ${option === q.correctAnswer ? 'border-emerald-200 bg-emerald-50/50 font-semibold text-emerald-800' : 'border-slate-100 text-slate-600'}`}>
                      <span className="w-6 text-xs text-slate-400 font-bold">{String.fromCharCode(65 + idx)}.</span>
                      <span>{option}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}