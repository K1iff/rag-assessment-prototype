'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const fillDemoAccount = (role: 'learner' | 'teacher' | 'admin') => {
    setPassword('DemoAccount123!');
    if (role === 'learner') setEmail('learner@university.edu');
    if (role === 'teacher') setEmail('teacher@university.edu');
    if (role === 'admin') setEmail('admin@university.edu');
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    if (email === 'admin@university.edu') {
      router.push('/admin');
    } else if (email === 'teacher@university.edu') {
      router.push('/exam-management');
    } else {
      router.push('/learner');
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 bg-cover bg-center bg-no-repeat flex flex-col justify-center items-center p-4"
      style={{ backgroundImage: "url('/background.svg')" }}
    >
      <div className="max-w-md w-full bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        
        <div className="p-6 bg-slate-900 text-center">
          <h1 className="text-2xl font-bold text-blue-400">RPLE Platform</h1>
          <p className="text-sm text-slate-300 mt-1">Sign in to your account</p>
        </div>

        <div className="p-6">
          
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-500 mb-2 text-center uppercase tracking-wider">Demo Accounts</p>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => fillDemoAccount('learner')} 
                className="flex-1 text-xs py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold transition-colors"
              >
                Learner
              </button>
              <button 
                type="button" 
                onClick={() => fillDemoAccount('teacher')} 
                className="flex-1 text-xs py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold transition-colors"
              >
                Teacher
              </button>
              <button 
                type="button" 
                onClick={() => fillDemoAccount('admin')} 
                className="flex-1 text-xs py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold transition-colors"
              >
                Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu" 
                className={`w-full px-4 py-3 bg-white border-2 text-slate-900 rounded-lg focus:outline-none focus:ring-1 placeholder-slate-400 ${
                  errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600'
                }`}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1 font-bold">{errors.email}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" 
                  className={`w-full px-4 py-3 bg-white border-2 text-slate-900 rounded-lg focus:outline-none focus:ring-1 pr-12 placeholder-slate-400 ${
                    errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none text-sm font-bold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="mt-2 flex justify-end">
                <a href="#" className="text-xs font-bold text-blue-600 hover:underline">Forgot Password?</a>
              </div>
              
              {errors.password && <p className="text-xs text-red-600 mt-1 font-bold">{errors.password}</p>}
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2"
            >
              Login
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="px-3 text-xs font-bold text-slate-400 uppercase">Or continue with</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" className="flex justify-center items-center py-2.5 px-4 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors">
              Google
            </button>
            <button type="button" className="flex justify-center items-center py-2.5 px-4 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors">
              Microsoft
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link href="/signup" className="text-sm font-bold text-blue-600 hover:text-blue-800">
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}