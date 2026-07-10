'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('permissions');

  // Mock data for Roles & Permissions Configuration Panel
  const [roles, setRoles] = useState([
    { id: 1, name: 'Admin', users: 3, permissions: { manageUsers: true, uploadDocs: true, viewLogs: true } },
    { id: 2, name: 'Teacher / Faculty', users: 12, permissions: { manageUsers: false, uploadDocs: true, viewLogs: false } },
    { id: 3, name: 'Learner / Reviewer', users: 450, permissions: { manageUsers: false, uploadDocs: false, viewLogs: false } },
  ]);

  // Mock data for System Audit Logs & User Activity Tracker
  const auditLogs = [
    { id: 'LOG-8821', user: 'prof.marquez@univ.edu', role: 'Teacher', action: 'Uploaded document: Industrial_Psychology_Reviewer.pdf', timestamp: '2026-07-10 10:14 AM' },
    { id: 'LOG-8820', user: 'system_rag', role: 'AI Engine', action: 'Generated 50 mock questions for Cohort Alpha', timestamp: '2026-07-10 09:30 AM' },
    { id: 'LOG-8819', user: 'student.santos@stud.edu', role: 'Learner', action: 'Completed Mock Exam: Abnormal Psychology Simulation', timestamp: '2026-07-10 08:45 AM' },
    { id: 'LOG-8818', user: 'admin.mark@system.com', role: 'Admin', action: 'Updated security access permissions for Teacher role', timestamp: '2026-07-09 04:15 PM' },
  ];

  const togglePermission = (roleId: number, permissionKey: 'manageUsers' | 'uploadDocs' | 'viewLogs') => {
    setRoles(roles.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [permissionKey]: !role.permissions[permissionKey]
          }
        };
      }
      return role;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-bold text-lg tracking-tight text-blue-400">RPLE Admin Portal</h2>
          <p className="text-xs text-slate-400 mt-1">System Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('permissions')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'permissions' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Roles & Permissions
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'logs' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            System Audit Logs
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

      {/* Main Content Workspace */}
      <main className="flex-1 p-6 md:p-10">
        
        {/* Mobile Header Tabs */}
        <div className="flex md:hidden bg-slate-200 p-1 rounded-lg mb-6">
          <button 
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-md ${activeTab === 'permissions' ? 'bg-white text-blue-600' : 'text-slate-600'}`}
          >
            Permissions
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-md ${activeTab === 'logs' ? 'bg-white text-blue-600' : 'text-slate-600'}`}
          >
            Audit Logs
          </button>
        </div>

        {/* Dynamic Panel Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            {activeTab === 'permissions' ? 'Role & Permissions Configuration Panel' : 'System Audit Logs & User Activity Tracker'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeTab === 'permissions' 
              ? 'Modify security access levels and system privileges across user categories.' 
              : 'Review automated background updates, RAG data generation milestones, and portal security events.'}
          </p>
        </div>

        {/* Content Area 1: Role & Permissions Configuration Panel */}
        {activeTab === 'permissions' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">User Role</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">Active Users</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600 text-center">Manage Platform Users</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600 text-center">Upload RAG Materials</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600 text-center">View Security Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-800">{role.name}</td>
                      <td className="p-4 text-slate-500">{role.users} accounts</td>
                      
                      {/* Permission Checkbox 1 */}
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={role.permissions.manageUsers} 
                          onChange={() => togglePermission(role.id, 'manageUsers')}
                          className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                      </td>

                      {/* Permission Checkbox 2 */}
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={role.permissions.uploadDocs} 
                          onChange={() => togglePermission(role.id, 'uploadDocs')}
                          className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                      </td>

                      {/* Permission Checkbox 3 */}
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={role.permissions.viewLogs} 
                          onChange={() => togglePermission(role.id, 'viewLogs')}
                          className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Content Area 2: System Audit Logs & User Activity Tracker */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">Event ID</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">User Account</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">Role</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">Action Performed</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs md:text-sm text-slate-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono text-slate-500">{log.id}</td>
                      <td className="p-4 font-medium text-slate-800">{log.user}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          log.role === 'Admin' ? 'bg-red-50 text-red-700 border border-red-100' :
                          log.role === 'Teacher' ? 'bg-green-50 text-green-700 border border-green-100' :
                          log.role === 'AI Engine' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{log.action}</td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
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