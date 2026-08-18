'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isExamActive = pathname.includes('/active_exam');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-72 bg-slate-900 text-white flex flex-col shrink-0 transition-all duration-300">
        
        <div className="p-6 border-b border-slate-800 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden mb-4 border-2 border-blue-500 shadow-lg">
            <svg className="w-12 h-12 text-slate-400 mt-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="font-bold text-lg text-white">Juan Dela Cruz</h2>
          <p className="text-xs text-slate-400 mt-1">learner@university.edu</p>
          <span className="mt-3 px-3 py-1 bg-blue-900 bg-opacity-50 text-blue-400 text-[10px] rounded uppercase font-bold tracking-wider">
            Learner Account
          </span>
        </div>

        {isExamActive ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="font-bold text-rose-400 text-lg mb-2">Workspace Locked</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Navigation is disabled while an exam is in progress. Please finish your attempt to unlock the menu.
            </p>
          </div>
        ) : (
          <>
            <nav className="flex-1 p-4 space-y-2">
              <Link 
                href="/learner"
                className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname === '/learner' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                Weekly Activity
              </Link>
              <Link 
                href="/learner/exams"
                className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname.startsWith('/learner/exams') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                Scheduled Mock Exams
              </Link>
              <Link 
                href="/learner/summary"
                className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname === '/learner/summary' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                Latest Exam Summary
              </Link>
              <Link 
                href="/learner/performance"
                className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname === '/learner/performance' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                Historical Performance
              </Link>
              <Link 
                href="/learner/roadmap"
                className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${pathname === '/learner/roadmap' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                PRC Progress Roadmap
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
          </>
        )}
      </aside>

      <main className="flex-1 flex justify-center w-full">
        <div className="w-full max-w-7xl p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}