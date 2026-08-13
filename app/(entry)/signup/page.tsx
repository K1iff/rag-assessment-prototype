'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; terms?: string }>({});

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; email?: string; password?: string; terms?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    }

    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (!(hasMinLength && hasUppercase && hasSpecialChar)) {
      newErrors.password = 'Please meet all password requirements.';
    }

    if (!agreedTerms) {
      newErrors.terms = 'You must agree to the terms and privacy policy.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    router.push('/dashboard');
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 bg-cover bg-center bg-no-repeat flex flex-col justify-center items-center p-4"
      style={{ backgroundImage: "url('/background.svg')" }}
    >
      <div className="max-w-md w-full bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        
        <div className="p-6 bg-slate-900 text-center">
          <h1 className="text-2xl font-bold text-blue-400">RPLE Platform</h1>
          <p className="text-sm text-slate-300 mt-1">Create a new account</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name" 
                className={`w-full px-4 py-3 bg-white border-2 text-slate-900 rounded-lg focus:outline-none focus:ring-1 placeholder-slate-400 ${
                  errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600'
                }`}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1 font-bold">{errors.name}</p>}
            </div>
            
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

              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs font-bold text-slate-600 mb-2">Password Requirements:</p>
                <ul className="text-xs space-y-1 font-bold">
                  <li className={hasMinLength ? 'text-green-600' : 'text-slate-500'}>
                    {hasMinLength ? '✓' : '○'} At least 8 characters
                  </li>
                  <li className={hasUppercase ? 'text-green-600' : 'text-slate-500'}>
                    {hasUppercase ? '✓' : '○'} At least one uppercase letter
                  </li>
                  <li className={hasSpecialChar ? 'text-green-600' : 'text-slate-500'}>
                    {hasSpecialChar ? '✓' : '○'} At least one special character
                  </li>
                </ul>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1 font-bold">{errors.password}</p>}
            </div>

            <div>
              <label className="flex items-start gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span className="text-xs text-slate-600 font-bold">
                  I accept the <a href="#" className="font-bold text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="font-bold text-blue-600 hover:underline">Privacy Policy</a>.
                </span>
              </label>
              {errors.terms && <p className="text-xs text-red-600 mt-1 font-bold">{errors.terms}</p>}
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2"
            >
              Create Account
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
            <Link href="/login" className="text-sm font-bold text-blue-600 hover:text-blue-800">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}