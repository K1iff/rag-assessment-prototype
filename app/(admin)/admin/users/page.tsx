'use client';

import React, { useState } from 'react';

export default function AdminUsersPage() {
  const [userSearch, setUserSearch] = useState('');

  const [allUsers] = useState([
    { id: 'U-001', name: 'Dr. Maria Marquez', email: 'prof.marquez@univ.edu', role: 'Teacher / Faculty', status: 'Active', lastLogin: '2026-07-10' },
    { id: 'U-002', name: 'Prof. Carlos Lim', email: 'carlos.lim@univ.edu', role: 'Teacher / Faculty', status: 'Active', lastLogin: '2026-07-09' },
    { id: 'U-003', name: 'Juan Santos', email: 'student.santos@stud.edu', role: 'Learner / Reviewer', status: 'Active', lastLogin: '2026-07-10' },
    { id: 'U-004', name: 'Ana Reyes', email: 'ana.reyes@stud.edu', role: 'Learner / Reviewer', status: 'Inactive', lastLogin: '2026-06-15' },
    { id: 'U-005', name: 'Mark Admin', email: 'admin.mark@system.com', role: 'Admin', status: 'Active', lastLogin: '2026-07-10' },
  ]);

  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Global User Directory</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">Manage all platform accounts, issue invites, and control individual access states.</p>
        </div>
        <button className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap">
          + Invite User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-slate-700">Platform Users ({allUsers.length})</h3>
          <div className="relative w-full md:w-72">
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">User Details</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Last Login</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{user.name}</p>
                    <p className="text-xs font-bold text-slate-500">{user.email}</p>
                  </td>
                  <td className="p-4 font-bold text-slate-600">{user.role}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      user.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 font-bold">{user.lastLogin}</td>
                  <td className="p-4 text-right space-x-3">
                    <button className="text-xs font-bold text-blue-600 hover:underline">Reset Pass</button>
                    <button className={`text-xs font-bold hover:underline ${user.status === 'Active' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}