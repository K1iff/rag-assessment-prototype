'use client';

import React, { useState } from 'react';

export default function AdminCohortsPage() {
  const [selectedCohort, setSelectedCohort] = useState<number | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [cohortTab, setCohortTab] = useState('active');

  const [cohorts, setCohorts] = useState([
    { 
      id: 1, 
      name: 'Cohort Alpha 2026', 
      description: 'First batch of psychology reviewers.', 
      color: 'bg-indigo-600',
      status: 'Active',
      dateRange: 'Aug 2026 to Dec 2026',
      teachers: [{ id: 101, name: 'Dr. Maria Marquez', email: 'prof.marquez@univ.edu' }],
      students: [{ id: 201, name: 'Juan Santos', email: 'student.santos@stud.edu' }, { id: 202, name: 'Ana Reyes', email: 'ana.reyes@stud.edu' }]
    },
    { 
      id: 2, 
      name: 'Cohort Beta 2026', 
      description: 'Evening session reviewers.', 
      color: 'bg-teal-600',
      status: 'Active',
      dateRange: 'Sep 2026 to Jan 2027',
      teachers: [],
      students: [{ id: 203, name: 'Luis Cruz', email: 'luis.cruz@stud.edu' }]
    },
    { 
      id: 3, 
      name: 'Accelerated Program 2025', 
      description: 'Intensive weekend review class.', 
      color: 'bg-slate-600',
      status: 'Archived',
      dateRange: 'Jan 2025 to May 2025',
      teachers: [{ id: 102, name: 'Prof. Carlos Lim', email: 'carlos.lim@univ.edu' }],
      students: []
    },
  ]);

  const handleCreateCohort = () => {
    const newCohort = {
      id: Date.now(),
      name: 'New Assigned Cohort',
      description: 'Pending details and schedule setup.',
      color: 'bg-blue-600',
      status: 'Active',
      dateRange: 'TBD',
      teachers: [],
      students: []
    };
    setCohorts([...cohorts, newCohort]);
  };

  const currentCohort = cohorts.find(c => c.id === selectedCohort);

  const filteredStudents = currentCohort?.students.filter(student =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    student.email.toLowerCase().includes(studentSearch.toLowerCase())
  ) || [];

  const displayedCohorts = cohorts.filter(c => 
    cohortTab === 'active' ? c.status === 'Active' : c.status === 'Archived'
  );

  if (selectedCohort !== null && currentCohort) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={() => setSelectedCohort(null)} 
            className="text-slate-500 hover:text-blue-600 font-bold text-sm flex items-center gap-1"
          >
            &larr; Back to Cohorts
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-inner shrink-0 ${currentCohort.color}`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{currentCohort.name}</h1>
              <p className="text-sm text-slate-500 font-bold">{currentCohort.description}</p>
              <div className="flex gap-2 mt-2">
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  currentCohort.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                 }`}>
                  {currentCohort.status}
                 </span>
                 <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase tracking-wider">
                   {currentCohort.dateRange}
                 </span>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors">
            Edit Cohort Details
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700">Assigned Teachers / Examiners</h3>
              <button className="text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded hover:bg-blue-700 shadow-sm flex items-center gap-1">
                + Assign
              </button>
            </div>
            <div className="p-2">
              {currentCohort.teachers.length === 0 ? (
                <div className="p-6 text-center text-sm font-bold text-slate-500">No teachers assigned yet.</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {currentCohort.teachers.map(teacher => (
                    <li key={teacher.id} className="p-3 flex justify-between items-center hover:bg-slate-50 rounded-lg transition-colors">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{teacher.name}</p>
                        <p className="text-xs font-bold text-slate-500">{teacher.email}</p>
                      </div>
                      <button className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h3 className="font-bold text-slate-700">Enrolled Students ({currentCohort.students.length})</h3>
                <div className="flex gap-2">
                  <button className="text-xs font-bold text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 shadow-sm flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Batch Import CSV
                  </button>
                  <button className="text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded hover:bg-blue-700 shadow-sm flex items-center gap-1">
                    + Add
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center gap-4">
                <div className="relative w-full">
                  <input 
                    type="text" 
                    placeholder="Search enrolled students..." 
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <button className="text-xs text-slate-500 font-bold whitespace-nowrap hover:text-slate-700 flex items-center gap-1">
                  Bulk Actions 
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-2">
              {filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-sm font-bold text-slate-500">No students found matching your search.</div>
              ) : (
                <ul className="flex flex-col">
                  {filteredStudents.map(student => (
                    <li key={student.id} className="p-3 flex justify-between items-center hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{student.name}</p>
                          <p className="text-xs font-bold text-slate-500">{student.email}</p>
                        </div>
                      </div>
                      <button className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Showing 1 to {filteredStudents.length} of {currentCohort.students.length}</span>
              <div className="flex gap-1.5">
                <button className="px-3 py-1.5 border border-slate-200 rounded bg-white text-slate-400 cursor-not-allowed font-bold shadow-sm">Prev</button>
                <button className="px-3 py-1.5 border border-slate-200 rounded bg-white text-slate-400 cursor-not-allowed font-bold shadow-sm">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cohort Workspace Management</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">Needs Clarification: Validate cohort data model (Annual Batch vs. Semester-based) prior to finalizing filters.</p>
        </div>
        <button 
          onClick={handleCreateCohort}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          + Create Cohort
        </button>
      </div>

      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-6">
          <button 
            onClick={() => setCohortTab('active')} 
            className={`pb-3 border-b-2 text-sm font-bold ${cohortTab === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Active Cohorts
          </button>
          <button 
            onClick={() => setCohortTab('archived')} 
            className={`pb-3 border-b-2 text-sm font-bold ${cohortTab === 'archived' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Archived
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayedCohorts.map((cohort) => (
          <div 
            key={cohort.id} 
            onClick={() => setSelectedCohort(cohort.id)}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-48 relative"
          >
            <div className={`h-14 ${cohort.color} flex items-center justify-between px-4`}>
              <span className="text-white font-bold text-xs bg-black/20 px-2.5 py-1 rounded-md flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cohort.dateRange}
              </span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                cohort.status === 'Active' ? 'bg-emerald-400 text-emerald-950' : 'bg-slate-100 text-slate-600'
              }`}>
                {cohort.status}
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 truncate">{cohort.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-bold">{cohort.description}</p>
              </div>
              <div className="flex gap-4 text-xs font-bold text-slate-600 border-t border-slate-100 pt-3">
                <span>{cohort.teachers.length} {cohort.teachers.length === 1 ? 'Teacher' : 'Teachers'}</span>
                <span>{cohort.students.length} {cohort.students.length === 1 ? 'Student' : 'Students'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}