'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateExamPage() {
  const router = useRouter();
  
  const [materials, setMaterials] = useState([
    { id: 'mat1', title: 'Chapter 1: Introduction to Abnormal Behavior (PDF)', checked: true },
    { id: 'mat2', title: 'Week 2 Presentation Slides (PPTX)', checked: true },
    { id: 'mat3', title: 'Diagnostic Criteria Reference Guide (DOCX)', checked: false },
    { id: 'mat4', title: 'Case Study Requirements (DOCX)', checked: false },
  ]);

  const toggleMaterial = (id: string) => {
    setMaterials(materials.map(mat => 
      mat.id === id ? { ...mat, checked: !mat.checked } : mat
    ));
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/faculty/exams');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className="flex items-center gap-3 mb-2">
        <button 
          onClick={() => router.push('/faculty/exams')} 
          className="text-slate-500 hover:text-blue-600 font-bold text-sm flex items-center gap-1"
        >
          &larr; Back to Exam Management
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Create New Exam</h1>
        <p className="text-sm text-slate-500 mt-1 font-bold">Configure the AI parameters and select reference materials to generate a new mock exam.</p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6">1. General Exam Details</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Exam Title</label>
              <input 
                type="text" 
                placeholder="e.g. Midterm Coverage Quiz" 
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Audience / Cohort</label>
                <input 
                  type="text" 
                  placeholder="e.g. PSY301" 
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6">2. AI Generation Parameters</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-2">Primary Topic</label>
              <select className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-700">
                <option value="" disabled>Select a specific topic</option>
                <option value="abnormal">Abnormal Psychology</option>
                <option value="industrial">Industrial Psychology</option>
                <option value="clinical">Clinical Psychology</option>
                <option value="personality">Theories of Personality</option>
                <option value="assessment">Psychological Assessment</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-2">Number of Items</label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                defaultValue="30"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">3. Reference Materials Scope</h2>
            <p className="text-sm text-slate-500 font-bold mt-1">Select the specific indexed materials the AI should use to generate these questions.</p>
          </div>
          
          <div className="space-y-3">
            {materials.map((mat) => (
              <label key={mat.id} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${mat.checked ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-300 hover:bg-slate-50'}`}>
                <input 
                  type="checkbox" 
                  checked={mat.checked}
                  onChange={() => toggleMaterial(mat.id)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className={`ml-4 text-sm font-bold ${mat.checked ? 'text-blue-900' : 'text-slate-700'}`}>
                  {mat.title}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button 
            type="button"
            onClick={() => router.push('/faculty/exams')}
            className="px-6 py-3 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            Generate Exam
          </button>
        </div>

      </form>
    </div>
  );
}