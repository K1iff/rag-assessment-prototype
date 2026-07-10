'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [selectedRole, setSelectedRole] = useState('learner');
  const router = useRouter();

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoginView) {
      if (selectedRole === 'learner') router.push('/dashboard');
      if (selectedRole === 'teacher') router.push('/exam-management');
      if (selectedRole === 'admin') router.push('/admin');
    } else {
      alert('Account created! You can now sign in.');
      setIsLoginView(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md border border-slate-100">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            RPLE Assessment Engine
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isLoginView 
              ? 'Select your role and sign in to continue' 
              : 'Create your new account'}
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
          <button 
            onClick={() => setSelectedRole('learner')}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${selectedRole === 'learner' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Learner
          </button>
          <button 
            onClick={() => setSelectedRole('teacher')}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${selectedRole === 'teacher' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Teacher
          </button>
          <button 
            onClick={() => setSelectedRole('admin')}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${selectedRole === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleAction} className="space-y-5">
          {!isLoginView && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input 
                type="text" 
                placeholder="Juan Dela Cruz" 
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Password
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors shadow-sm mt-2"
          >
            {isLoginView ? `Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}` : 'Register Account'}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-slate-100">
          <button 
            onClick={() => setIsLoginView(!isLoginView)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {isLoginView 
              ? "Don't have an account? Create one here" 
              : 'Already have an account? Sign in instead'}
          </button>
        </div>

      </div>
    </div>
  );
}