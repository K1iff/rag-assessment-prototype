'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-72 bg-slate-900 text-white flex flex-col hidden md:flex shrink-0 transition-all duration-300">
        
        <div className="p-6 border-b border-slate-800 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden mb-4 border-2 border-purple-500 shadow-lg">
            <svg className="w-12 h-12 text-slate-400 mt-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="font-bold text-lg text-white">Mark Admin</h2>
          <p className="text-xs text-slate-400 mt-1">admin.mark@system.com</p>
          <span className="mt-3 px-3 py-1 bg-purple-900 bg-opacity-50 text-purple-400 text-[10px] rounded uppercase font-bold tracking-wider">
            System Administrator
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link 
            href="/admin"
            className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname === '/admin' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            System Overview
          </Link>
          <Link 
            href="/admin/users"
            className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname.startsWith('/admin/users') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Global User Directory
          </Link>
          <Link 
            href="/admin/rag"
            className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname.startsWith('/admin/rag') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            RAG / AI Engine
          </Link>
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Access & Structure</p>
          </div>
          <Link 
            href="/admin/cohorts"
            className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname.startsWith('/admin/cohorts') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Cohort Management
          </Link>
          <Link 
            href="/admin/permissions"
            className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname.startsWith('/admin/permissions') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Roles & Permissions
          </Link>
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Security</p>
          </div>
          <Link 
            href="/admin/logs"
            className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname.startsWith('/admin/logs') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            System Audit Logs
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => router.push('/login')}
            className="w-full text-center bg-slate-800 hover:bg-slate-700 text-xs py-3 rounded-md font-bold transition-colors text-slate-300"
          >
            Sign Out Securely
          </button>
        </div>
      </aside>

      <main className="flex-1 flex justify-center w-full">
        <div className="w-full max-w-7xl p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}