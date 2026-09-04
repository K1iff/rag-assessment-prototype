'use client';

import React, { useState } from 'react';

export default function FacultyMaterialsPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const materials = [
    { id: 1, title: 'Chapter 1: Introduction to Abnormal Behavior', type: 'PDF', size: '2.4 MB', uploadDate: '2026-07-01', tags: ['PSY301', 'Cohort Alpha'], status: 'Approved & Indexed', rejectReason: null },
    { id: 2, title: 'Week 2 Presentation Slides', type: 'PPTX', size: '5.1 MB', uploadDate: '2026-07-05', tags: ['PSY302'], status: 'Pending Admin Approval', rejectReason: null },
    { id: 3, title: 'Case Study Requirements', type: 'DOCX', size: '1.2 MB', uploadDate: '2026-07-08', tags: ['General'], status: 'Rejected', rejectReason: 'File contains corrupted text encoding formatting. Please re-save as PDF and upload again.' },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // Placeholder for actual file upload logic
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reference Materials Request</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">Request syllabus, reading materials, and rubrics to be added to the AI knowledge base.</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          Request File Upload
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700">Requested Documents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">File Name & Details</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Tags / Scope</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date Requested</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Admin Status</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {materials.map((file) => (
                <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{file.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">{file.type}</span>
                      <span className="text-xs font-bold text-slate-500">{file.size}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {file.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 font-bold">{file.uploadDate}</td>
                  <td className="p-4">
                    <div className="relative group inline-block">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-default ${
                        file.status === 'Approved & Indexed' ? 'bg-emerald-100 text-emerald-800' : 
                        file.status === 'Pending Admin Approval' ? 'bg-amber-100 text-amber-800' : 
                        'bg-red-100 text-red-800 cursor-help'
                      }`}>
                        {file.status}
                      </span>
                      
                      {file.status === 'Rejected' && file.rejectReason && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-slate-800 text-white text-[10px] rounded p-2 text-center shadow-lg z-10 font-bold">
                          {file.rejectReason}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 flex justify-end gap-4 mt-2">
                    <button className="text-slate-600 hover:text-blue-600 font-bold text-xs">Edit Tags</button>
                    <button className="text-red-500 hover:underline font-bold text-xs">Cancel Request</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-800">Request New File Upload</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); setShowUploadModal(false); }}>
              <div className="space-y-5">
                
                <div 
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors relative ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Drag and drop your file here</h4>
                  <p className="text-xs font-bold text-slate-500 mb-4">Supports PDF, PPTX, and DOCX up to 50MB</p>
                  
                  <div className="flex items-center justify-center">
                    <span className="px-2 bg-slate-50 text-xs font-bold text-slate-400 uppercase relative z-10">Or</span>
                    <div className="absolute left-10 right-10 top-auto h-px bg-slate-200"></div>
                  </div>
                  
                  <button type="button" className="mt-4 px-5 py-2 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg bg-white hover:bg-slate-50 transition-colors shadow-sm relative z-20">
                    Browse Files
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Apply Tags / Scope</label>
                  <input type="text" placeholder="e.g. PSY301, Midterms, General" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  <p className="text-[10px] text-slate-500 font-bold mt-1">Separate multiple tags with commas.</p>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                  >
                    Submit for Approval
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}