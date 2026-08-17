'use client';

import React, { useState } from 'react';

export default function AdminLogsPage() {
  const [logSearch, setLogSearch] = useState('');
  const [logDateFilter, setLogDateFilter] = useState('All Time');
  const [logTypeFilter, setLogTypeFilter] = useState('All Events');

  const auditLogs = [
    { id: 'LOG-8822', user: 'unknown_ip', role: 'System', action: 'Failed login attempt (5x) for admin account', timestamp: '2026-07-10 11:05 AM', type: 'Security', severity: 'Critical' },
    { id: 'LOG-8821', user: 'prof.marquez@univ.edu', role: 'Teacher', action: 'Uploaded document: Industrial_Psychology_Reviewer.pdf', timestamp: '2026-07-10 10:14 AM', type: 'Document Uploads', severity: 'Info' },
    { id: 'LOG-8820', user: 'system_rag', role: 'AI Engine', action: 'Generated 50 mock questions for Cohort Alpha', timestamp: '2026-07-10 09:30 AM', type: 'AI Engine', severity: 'Info' },
    { id: 'LOG-8819', user: 'student.santos@stud.edu', role: 'Learner', action: 'Completed Mock Exam: Abnormal Psychology Simulation', timestamp: '2026-07-10 08:45 AM', type: 'User Activity', severity: 'Info' },
    { id: 'LOG-8818', user: 'admin.mark@system.com', role: 'Admin', action: 'Updated security access permissions for Teacher role', timestamp: '2026-07-09 04:15 PM', type: 'Security', severity: 'Warning' },
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(logSearch.toLowerCase()) || log.id.toLowerCase().includes(logSearch.toLowerCase());
    const matchesType = logTypeFilter === 'All Events' || log.type === logTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Audit Logs & Activity Tracker</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Event History</h3>
            <button className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded hover:bg-white transition-colors shadow-sm flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export Logs (CSV / JSON)
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Search by User Email or Event ID..." 
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" 
              />
            </div>
            <select 
              value={logDateFilter}
              onChange={(e) => setLogDateFilter(e.target.value)}
              className="text-xs font-bold px-3 py-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-700"
            >
              <option value="All Time">All Time</option>
              <option value="Last 24 Hours">Last 24 Hours</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
            <select 
              value={logTypeFilter}
              onChange={(e) => setLogTypeFilter(e.target.value)}
              className="text-xs font-bold px-3 py-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-700"
            >
              <option value="All Events">All Event Types</option>
              <option value="Security">Security Events</option>
              <option value="Document Uploads">Document Uploads</option>
              <option value="AI Engine">AI Engine</option>
              <option value="User Activity">User Activity</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Event ID</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Severity</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">User Account</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Action Performed</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs md:text-sm text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-bold text-slate-500">No logs found matching your filters.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-500">{log.id}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        log.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                        log.severity === 'Warning' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">{log.user}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        log.role === 'Admin' ? 'bg-purple-50 text-purple-700' :
                        log.role === 'Teacher' ? 'bg-emerald-50 text-emerald-700' :
                        log.role === 'AI Engine' ? 'bg-indigo-50 text-indigo-700' :
                        log.role === 'System' ? 'bg-rose-50 text-rose-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-600">{log.action}</td>
                    <td className="p-4 font-bold text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}