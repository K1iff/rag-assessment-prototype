'use client';

import React, { useState } from 'react';

export default function AdminPermissionsPage() {
  const [roles, setRoles] = useState([
    { id: 1, name: 'Admin', users: 3, permissions: { manageUsers: true, uploadDocs: true, viewLogs: true } },
    { id: 2, name: 'Teacher / Faculty', users: 12, permissions: { manageUsers: false, uploadDocs: true, viewLogs: false } },
    { id: 3, name: 'Learner / Reviewer', users: 450, permissions: { manageUsers: false, uploadDocs: false, viewLogs: false } },
  ]);

  const togglePermission = (roleId: number, permissionKey: 'manageUsers' | 'uploadDocs' | 'viewLogs') => {
    if (roleId === 1 && permissionKey === 'manageUsers') return;

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
    <>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Role & Permissions Configuration Panel</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">Modify security access levels and system privileges across user categories.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">User Role</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">Active Users</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600 text-center">
                  <div className="flex items-center justify-center gap-1.5 cursor-help" title="Grants the ability to create, edit, invite, or deactivate platform user accounts.">
                    Manage Platform Users
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600 text-center">
                  <div className="flex items-center justify-center gap-1.5 cursor-help" title="Allows uploading, deleting, and managing knowledge base files for the AI generation engine.">
                    Upload RAG Materials
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600 text-center">
                  <div className="flex items-center justify-center gap-1.5 cursor-help" title="Allows access to view historical system audit logs and tracked user activities.">
                    View Security Logs
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{role.name}</td>
                  <td className="p-4 text-slate-500 font-bold">{role.users} accounts</td>
                  
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={role.permissions.manageUsers} 
                      onChange={() => togglePermission(role.id, 'manageUsers')}
                      disabled={role.name === 'Admin'}
                      className={`h-4 w-4 rounded focus:ring-blue-500 ${role.name === 'Admin' ? 'text-blue-400 border-slate-200 cursor-not-allowed opacity-60' : 'text-blue-600 border-slate-300 cursor-pointer'}`}
                      title={role.name === 'Admin' ? 'Core admin permissions cannot be disabled' : ''}
                    />
                  </td>

                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={role.permissions.uploadDocs} 
                      onChange={() => togglePermission(role.id, 'uploadDocs')}
                      className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={role.permissions.viewLogs} 
                      onChange={() => togglePermission(role.id, 'viewLogs')}
                      className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button className="px-5 py-2 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-white transition-colors shadow-sm">
            Reset to Default
          </button>
          <button className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}