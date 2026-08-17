'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateExamPage() {
  const router = useRouter();
  
  // General Configuration State
  const [subject, setSubject] = useState('Abnormal Psychology');
  const [generationMode, setGenerationMode] = useState<'strict' | 'custom'>('strict');
  
  // Custom Mode State
  const [customItems, setCustomItems] = useState(30);
  const [customTopic, setCustomTopic] = useState('');
  const [selectedBlooms, setSelectedBlooms] = useState<string[]>([]);

  const [materials, setMaterials] = useState([
    { id: 'mat1', title: 'Barlow Abnormal Psychology Textbook (PDF)', uploader: 'System Default', checked: true },
    { id: 'mat2', title: 'Kaplan Clinical Psychiatry Guide (PDF)', uploader: 'System Default', checked: true },
    { id: 'mat3', title: 'Gregory Psychological Testing (DOCX)', uploader: 'System Default', checked: false },
    { id: 'mat4', title: 'Week 2 Presentation Slides (PPTX)', uploader: 'Dr. Marquez', checked: false },
  ]);

  const bloomLevels = [
    'Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'
  ];

  const isAllSelected = materials.every(mat => mat.checked);

  const toggleMaterial = (id: string) => {
    setMaterials(materials.map(mat => 
      mat.id === id ? { ...mat, checked: !mat.checked } : mat
    ));
  };

  const toggleSelectAll = () => {
    const newState = !isAllSelected;
    setMaterials(materials.map(mat => ({ ...mat, checked: newState })));
  };

  const toggleBloom = (level: string) => {
    if (selectedBlooms.includes(level)) {
      setSelectedBlooms(selectedBlooms.filter(b => b !== level));
    } else {
      setSelectedBlooms([...selectedBlooms, level]);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/faculty/exams');
  };

  const strictItemCount = subject === 'Psychological Assessment' ? 130 : 100;

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
          
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Target Subject</label>
              <select 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value="Abnormal Psychology">Abnormal Psychology</option>
                <option value="Developmental Psychology">Developmental Psychology</option>
                <option value="Industrial-Organizational Psychology">Industrial-Organizational Psychology</option>
                <option value="Psychological Assessment">Psychological Assessment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Generation Mode</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className={`flex-1 flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${generationMode === 'strict' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                  <input 
                    type="radio" 
                    name="generationMode" 
                    checked={generationMode === 'strict'}
                    onChange={() => setGenerationMode('strict')}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer" 
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-slate-800">Strict Board Exam Mode</span>
                    <span className="block text-xs font-bold text-slate-500 mt-0.5">TOS Compliant distribution</span>
                  </div>
                </label>
                <label className={`flex-1 flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${generationMode === 'custom' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                  <input 
                    type="radio" 
                    name="generationMode" 
                    checked={generationMode === 'custom'}
                    onChange={() => setGenerationMode('custom')}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer" 
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-slate-800">Custom Diagnostic Quiz Mode</span>
                    <span className="block text-xs font-bold text-slate-500 mt-0.5">Manual parameter control</span>
                  </div>
                </label>
              </div>
            </div>

            {generationMode === 'strict' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🔒</span>
                  <h3 className="font-bold text-slate-800 text-sm">System Locked Parameters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 border border-slate-200 rounded-md">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Items</span>
                    <span className="block text-lg font-bold text-slate-800">{strictItemCount} Items</span>
                  </div>
                  <div className="bg-white p-4 border border-slate-200 rounded-md md:col-span-2">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cognitive Level (Bloom's Taxonomy)</span>
                    <span className="block text-sm font-bold text-slate-800">30% Easy, 40% Moderate, 30% Difficult</span>
                  </div>
                  <div className="bg-white p-4 border border-slate-200 rounded-md md:col-span-3">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Topic Coverage</span>
                    <span className="block text-sm font-bold text-slate-800">Automatically sweeps across all competencies listed in the syllabus</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Topic / Competency Filter</label>
                    <select 
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-700"
                    >
                      <option value="">All Topics</option>
                      <option value="Topic A">Specific Topic A</option>
                      <option value="Topic B">Specific Topic B</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Total Item Count</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="150" 
                      value={customItems}
                      onChange={(e) => setCustomItems(Number(e.target.value))}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Target Bloom's Taxonomy</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {bloomLevels.map(level => (
                      <label key={level} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedBlooms.includes(level) ? 'border-blue-500 bg-white shadow-sm' : 'border-slate-200 bg-white/50 hover:border-blue-300'}`}>
                        <input 
                          type="checkbox" 
                          checked={selectedBlooms.includes(level)}
                          onChange={() => toggleBloom(level)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className={`ml-3 text-xs font-bold ${selectedBlooms.includes(level) ? 'text-blue-900' : 'text-slate-700'}`}>
                          {level}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">3. Source References</h2>
              <p className="text-sm text-slate-500 font-bold mt-1">Select the ingested textbooks the AI should use.</p>
            </div>
            <button 
              type="button" 
              onClick={toggleSelectAll}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </button>
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
                  {mat.title} <span className="text-xs text-slate-400 font-bold ml-2">(Uploaded by {mat.uploader})</span>
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