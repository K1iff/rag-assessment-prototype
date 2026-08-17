'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddUserPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Learner / Reviewer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/admin/users');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <button 
          onClick={() => router.push('/admin/users')} 
          className="text-slate-500 hover:text-blue-600 font-bold text-sm flex items-center gap-1"
        >
          &larr; Back to Directory
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Add New User</h1>
        <p className="text-sm text-slate-500 mt-1">Provide general information to manually register a user to the platform.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Dela Cruz" 
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="juan@university.edu" 
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Platform Role</label>
          <select 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-700"
          >
            <option value="Learner / Reviewer">Learner / Reviewer</option>
            <option value="Teacher / Faculty">Teacher / Faculty</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        <div className="pt-4 flex justify-end gap-4 border-t border-slate-100">
          <button 
            type="button"
            onClick={() => router.push('/admin/users')}
            className="px-6 py-3 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Add User
          </button>
        </div>
      </form>
    </div>
  );
}