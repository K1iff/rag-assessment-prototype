'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('cohorts');
  const [selectedCohort, setSelectedCohort] = useState<number | null>(null);

  // Mock data for Roles & Permissions Configuration Panel
  const [roles, setRoles] = useState([
    { id: 1, name: 'Admin', users: 3, permissions: { manageUsers: true, uploadDocs: true, viewLogs: true } },
    { id: 2, name: 'Teacher / Faculty', users: 12, permissions: { manageUsers: false, uploadDocs: true, viewLogs: false } },
    { id: 3, name: 'Learner / Reviewer', users: 450, permissions: { manageUsers: false, uploadDocs: false, viewLogs: false } },
  ]);

  // Mock data for System Audit Logs
  const auditLogs = [
    { id: 'LOG-8821', user: 'prof.marquez@univ.edu', role: 'Teacher', action: 'Uploaded document: Industrial_Psychology_Reviewer.pdf', timestamp: '2026-07-10 10:14 AM' },
    { id: 'LOG-8820', user: 'system_rag', role: 'AI Engine', action: 'Generated 50 mock questions for Cohort Alpha', timestamp: '2026-07-10 09:30 AM' },
    { id: 'LOG-8819', user: 'student.santos@stud.edu', role: 'Learner', action: 'Completed Mock Exam: Abnormal Psychology Simulation', timestamp: '2026-07-10 08:45 AM' },
    { id: 'LOG-8818', user: 'admin.mark@system.com', role: 'Admin', action: 'Updated security access permissions for Teacher role', timestamp: '2026-07-09 04:15 PM' },
  ];

  // Mock data for Cohorts
  const [cohorts, setCohorts] = useState([
    { 
      id: 1, 
      name: 'Cohort Alpha 2026', 
      description: 'First batch of psychology reviewers.', 
      color: 'bg-indigo-600',
      teachers: [{ id: 101, name: 'Dr. Maria Marquez', email: 'prof.marquez@univ.edu' }],
      students: [{ id: 201, name: 'Juan Santos', email: 'student.santos@stud.edu' }, { id: 202, name: 'Ana Reyes', email: 'ana.reyes@stud.edu' }]
    },
    { 
      id: 2, 
      name: 'Cohort Beta 2026', 
      description: 'Evening session reviewers.', 
      color: 'bg-teal-600',
      teachers: [],
      students: [{ id: 203, name: 'Luis Cruz', email: 'luis.cruz@stud.edu' }]
    },
    { 
      id: 3, 
      name: 'Accelerated Program', 
      description: 'Intensive weekend review class.', 
      color: 'bg-rose-600',
      teachers: [{ id: 102, name: 'Prof. Carlos Lim', email: 'carlos.lim@univ.edu' }],
      students: []
    },
  ]);

  const togglePermission = (roleId: number, permissionKey: 'manageUsers' | 'uploadDocs' | 'viewLogs') => {
    setRoles(roles.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [permissionKey]: !role.permissions[permissionKey]
          }
        };
      }
      return role;
    }));
  };

  const handleCreateCohort = () => {
    const newCohort = {
      id: Date.now(),
      name: 'New Assigned Cohort',
      description: 'Pending details and schedule setup.',
      color: 'bg-blue-600',
      teachers: [],
      students: []
    };
    setCohorts([...cohorts, newCohort]);
  };

  const currentCohort = cohorts.find(c => c.id === selectedCohort);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-bold text-lg tracking-tight text-blue-400">RPLE Admin Portal</h2>
          <p className="text-xs text-slate-400 mt-1">System Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('cohorts'); setSelectedCohort(null); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'cohorts' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Cohort Management
          </button>
          <button 
            onClick={() => { setActiveTab('permissions'); setSelectedCohort(null); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'permissions' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Roles & Permissions
          </button>
          <button 
            onClick={() => { setActiveTab('logs'); setSelectedCohort(null); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'logs' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            System Audit Logs
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => router.push('/login')}
            className="w-full text-center bg-slate-800 hover:bg-slate-700 text-xs py-2 rounded-md font-medium transition-colors text-slate-300"
          >
            Sign Out to Login
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* Mobile Header Tabs */}
        <div className="flex md:hidden bg-slate-200 p-1 rounded-lg mb-6">
          <button 
            onClick={() => { setActiveTab('cohorts'); setSelectedCohort(null); }}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-md ${activeTab === 'cohorts' ? 'bg-white text-blue-600' : 'text-slate-600'}`}
          >
            Cohorts
          </button>
          <button 
            onClick={() => { setActiveTab('permissions'); setSelectedCohort(null); }}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-md ${activeTab === 'permissions' ? 'bg-white text-blue-600' : 'text-slate-600'}`}
          >
            Permissions
          </button>
          <button 
            onClick={() => { setActiveTab('logs'); setSelectedCohort(null); }}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-md ${activeTab === 'logs' ? 'bg-white text-blue-600' : 'text-slate-600'}`}
          >
            Audit Logs
          </button>
        </div>

        {/* Dynamic Panel Header */}
        {selectedCohort === null && (
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {activeTab === 'cohorts' ? 'Cohort Workspace Management' : 
                 activeTab === 'permissions' ? 'Role & Permissions Configuration Panel' : 
                 'System Audit Logs & User Activity Tracker'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {activeTab === 'cohorts' 
                  ? 'Organize learning groups and assign dedicated faculty members to specific student batches.' 
                  : activeTab === 'permissions' 
                  ? 'Modify security access levels and system privileges across user categories.' 
                  : 'Review automated background updates, RAG data generation milestones, and portal security events.'}
              </p>
            </div>
            {activeTab === 'cohorts' && (
              <button 
                onClick={handleCreateCohort}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Create Cohort
              </button>
            )}
          </div>
        )}

        {/* Content Area 1: Cohorts Grid View */}
        {activeTab === 'cohorts' && selectedCohort === null && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cohorts.map((cohort) => (
              <div 
                key={cohort.id} 
                onClick={() => setSelectedCohort(cohort.id)}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-48"
              >
                <div className={`h-12 ${cohort.color} flex items-center px-4`}>
                  <div className="h-8 w-8 bg-white/20 rounded flex items-center justify-center text-white font-bold text-lg">
                    {cohort.name.charAt(0)}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 truncate">{cohort.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cohort.description}</p>
                  </div>
                  <div className="flex gap-4 text-xs font-medium text-slate-600 border-t border-slate-100 pt-3">
                    <span>{cohort.teachers.length} Teachers</span>
                    <span>{cohort.students.length} Students</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content Area 2: Single Cohort Detail View */}
        {activeTab === 'cohorts' && selectedCohort !== null && currentCohort && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={() => setSelectedCohort(null)} 
                className="text-slate-500 hover:text-blue-600 font-medium text-sm flex items-center gap-1"
              >
                &larr; Back to Cohorts
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-inner ${currentCohort.color}`}>
                  {currentCohort.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">{currentCohort.name}</h1>
                  <p className="text-sm text-slate-500">{currentCohort.description}</p>
                </div>
              </div>
              <button className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors">
                Edit Cohort Details
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Teachers List */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700">Assigned Teachers / Examiners</h3>
                  <button className="text-xs font-bold text-blue-600 hover:underline">Assign Teacher</button>
                </div>
                <div className="p-2">
                  {currentCohort.teachers.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">No teachers assigned yet.</div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {currentCohort.teachers.map(teacher => (
                        <li key={teacher.id} className="p-3 flex justify-between items-center hover:bg-slate-50 rounded-lg transition-colors">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{teacher.name}</p>
                            <p className="text-xs text-slate-500">{teacher.email}</p>
                          </div>
                          <button className="text-xs text-red-500 font-medium hover:underline">Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Students List */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700">Enrolled Students</h3>
                  <button className="text-xs font-bold text-blue-600 hover:underline">Add Students</button>
                </div>
                <div className="p-2">
                  {currentCohort.students.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">No students enrolled yet.</div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {currentCohort.students.map(student => (
                        <li key={student.id} className="p-3 flex justify-between items-center hover:bg-slate-50 rounded-lg transition-colors">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.email}</p>
                          </div>
                          <button className="text-xs text-red-500 font-medium hover:underline">Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Content Area 3: Role & Permissions Configuration Panel */}
        {activeTab === 'permissions' && selectedCohort === null && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">User Role</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">Active Users</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600 text-center">Manage Platform Users</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600 text-center">Upload RAG Materials</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600 text-center">View Security Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-800">{role.name}</td>
                      <td className="p-4 text-slate-500">{role.users} accounts</td>
                      
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={role.permissions.manageUsers} 
                          onChange={() => togglePermission(role.id, 'manageUsers')}
                          className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                      </td>

                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={role.permissions.uploadDocs} 
                          onChange={() => togglePermission(role.id, 'uploadDocs')}
                          className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                      </td>

                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={role.permissions.viewLogs} 
                          onChange={() => togglePermission(role.id, 'viewLogs')}
                          className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Content Area 4: System Audit Logs */}
        {activeTab === 'logs' && selectedCohort === null && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">Event ID</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">User Account</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">Role</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">Action Performed</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-600">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs md:text-sm text-slate-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono text-slate-500">{log.id}</td>
                      <td className="p-4 font-medium text-slate-800">{log.user}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          log.role === 'Admin' ? 'bg-red-50 text-red-700 border border-red-100' :
                          log.role === 'Teacher' ? 'bg-green-50 text-green-700 border border-green-100' :
                          log.role === 'AI Engine' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{log.action}</td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}