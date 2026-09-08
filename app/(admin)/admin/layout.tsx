'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [adminName, setAdminName] = useState('Loading...');
  const [adminEmail, setAdminEmail] = useState('Loading...');

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (user) {
        setAdminEmail(user.email ?? 'Email not available');

        const { data: profileData, error: profileError } = await supabase
          .from('Users')
          .select('name')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setAdminName(`${profileData.name}`);
        }
      } else {
        router.push('/login'); 
      }
    };

    fetchUserProfile();
  }, [router]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-x-hidden">
      
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-40 relative shadow-md">
        <span className="font-bold text-lg text-purple-400">RPLE Admin</span>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <aside 
        className={`bg-slate-900 text-white flex flex-col shrink-0 transition-all duration-300 overflow-hidden fixed inset-y-0 left-0 z-50 w-72 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}
      >
        <div className="w-72 flex flex-col h-full bg-slate-900">
          <div className="p-6 border-b border-slate-800 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden mb-4 border-2 border-purple-500 shadow-lg">
              <svg className="w-12 h-12 text-slate-400 mt-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="font-bold text-lg text-white">{adminName}</h2>
            <p className="text-xs text-slate-400 mt-1">{adminEmail}</p>
            <span className="mt-3 px-3 py-1 bg-purple-900 bg-opacity-50 text-purple-400 text-[10px] rounded uppercase font-bold tracking-wider">
              System Administrator
            </span>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <Link 
              href="/admin"
              onClick={closeMobileMenu}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname === '/admin' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              System Overview
            </Link>
            <Link 
              href="/admin/users"
              onClick={closeMobileMenu}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname.startsWith('/admin/users') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Global User Directory
            </Link>
            <Link 
              href="/admin/rag"
              onClick={closeMobileMenu}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname.startsWith('/admin/rag') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Knowledge Base
            </Link>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Access & Structure</p>
            </div>
            <Link 
              href="/admin/cohorts"
              onClick={closeMobileMenu}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname.startsWith('/admin/cohorts') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Cohort Management
            </Link>
            <Link 
              href="/admin/permissions"
              onClick={closeMobileMenu}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname.startsWith('/admin/permissions') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Roles & Permissions
            </Link>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Security</p>
            </div>
            <Link 
              href="/admin/logs"
              onClick={closeMobileMenu}
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
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}

      <main className="flex-1 flex justify-center w-full transition-all duration-300">
        <div className="w-full max-w-7xl p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}