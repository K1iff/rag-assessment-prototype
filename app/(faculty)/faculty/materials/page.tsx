'use client';

import React from 'react';

export default function FacultyMaterialsPage() {
  const materials = [
    { id: 1, title: 'Chapter 1: Introduction to Abnormal Behavior', type: 'PDF', size: '2.4 MB', uploadDate: '2026-07-01', tags: ['PSY301', 'Cohort Alpha'], status: 'Approved & Indexed' },
    { id: 2, title: 'Week 2 Presentation Slides', type: 'PPTX', size: '5.1 MB', uploadDate: '2026-07-05', tags: ['PSY302'], status: 'Pending Admin Approval' },
    { id: 3, title: 'Case Study Requirements', type: 'DOCX', size: '1.2 MB', uploadDate: '2026-07-08', tags: ['General'], status: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reference Materials Request</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">Request syllabus, reading materials, and rubrics to be added to the AI knowledge base.</p>
        </div>
        <button className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
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
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      file.status === 'Approved & Indexed' ? 'bg-emerald-100 text-emerald-800' : 
                      file.status === 'Pending Admin Approval' ? 'bg-amber-100 text-amber-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {file.status}
                    </span>
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
    </div>
  );
}