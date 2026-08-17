'use client';

import React, { useState } from 'react';

export default function AdminRagPage() {
  const [ragFiles] = useState([
    { id: 'DOC-01', filename: 'Industrial_Psychology_Reviewer.pdf', uploadedBy: 'prof.marquez@univ.edu', date: '2026-07-10', size: '4.2 MB', status: 'Embedded' },
    { id: 'DOC-02', filename: 'Abnormal_Psych_DSM5_Guidelines.pdf', uploadedBy: 'admin.mark@system.com', date: '2026-07-08', size: '12.5 MB', status: 'Embedded' },
    { id: 'DOC-03', filename: 'Theories_Of_Personality_Chp1.pdf', uploadedBy: 'carlos.lim@univ.edu', date: '2026-07-11', size: '3.1 MB', status: 'Processing' },
  ]);

  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Knowledge Base</h1>
        </div>
        <button className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
          Upload New Document
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-lg text-slate-800">AI Generation Parameters</h3>
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded font-bold">
              Pending Confirmation: Validate UI exposure and DB persistence for these attributes.
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Creativity (Temperature): 0.3</label>
              <input type="range" min="0" max="1" step="0.1" defaultValue="0.3" className="w-full accent-purple-600" />
              <p className="text-xs text-slate-500 mt-2 font-bold">Lower values strictly ensure factual adherence to RAG materials.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Context Chunk Size: 1024</label>
              <input type="range" min="256" max="2048" step="128" defaultValue="1024" className="w-full accent-purple-600" />
              <p className="text-xs text-slate-500 mt-2 font-bold">Defines the size of text chunks retrieved per generation query.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Retrieval Count (Top-K): 5</label>
              <input type="range" min="1" max="10" step="1" defaultValue="5" className="w-full accent-purple-600" />
              <p className="text-xs text-slate-500 mt-2 font-bold">Specifies the number of relevant chunks injected into the AI context.</p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors">
              Save Configuration
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Knowledge Base Files</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Filename & Size</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Uploaded By</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date Added</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Embedding Status</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {ragFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{file.filename}</p>
                      <p className="text-xs font-bold text-slate-500">{file.size}</p>
                    </td>
                    <td className="p-4 text-slate-600 font-bold">{file.uploadedBy}</td>
                    <td className="p-4 text-slate-500 font-bold">{file.date}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        file.status === 'Embedded' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {file.status === 'Processing' && <span className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></span>}
                        {file.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-xs font-bold text-rose-600 hover:underline">Delete File</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}