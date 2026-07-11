'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState('Learner');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === 'Admin') {
      router.push('/admin');
    } else if (selectedRole === 'Teacher') {
      router.push('/exam-management');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        
        {/* Header section */}
        <div className="p-6 bg-slate-900 text-center">
          <h1 className="text-2xl font-bold text-blue-400">RPLE Platform</h1>
          <p className="text-sm text-slate-300 mt-1">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <div className="p-6">
          {/* Role Selection */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            {['Learner', 'Teacher', 'Admin'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`flex-1 text-sm font-semibold py-2 rounded-md transition-colors ${
                  selectedRole === role ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Enter your full name" 
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-slate-400"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                placeholder="name@university.edu" 
                required
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                placeholder="Enter your password" 
                required
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-slate-400"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2"
            >
              {isLogin ? 'Sign In Securely' : 'Create Account'}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}