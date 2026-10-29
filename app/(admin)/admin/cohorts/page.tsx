'use client';

import FullScreenLoader from '@/components/ui/FullScreenLoader';
import React, { useState, useEffect } from 'react';
import EmptyState from '@/components/ui/EmptyState';
import { usePagination } from '@/hooks/usePagination';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/ToastContext';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Cohort {
  id: string;
  name: string;
  description: string;
  color: string;
  status: 'Active' | 'Archived';
  dateRange: string;
  start_date: string;
  end_date: string;
  teachers: Teacher[];
  students: Student[];
}

interface PendingRemoval {
  type: 'teacher' | 'student';
  id: string;
  name: string;
  email: string;
}

interface PendingTransferStudent {
  id: string;
  name: string;
  email: string;
  currentCohortName: string;
}

interface PendingTransfer {
  students: PendingTransferStudent[];
  allUserIdsToEnroll: string[];
}

export default function AdminCohortsPage() {
  const { addToast } = useToast();
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [cohortTab, setCohortTab] = useState<'active' | 'archived'>('active');
  
  // Dynamic Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');

  // Destructive Confirmation Modal & Timer States
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
  const [countdown, setCountdown] = useState(5);

  // Transfer Confirmation State
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Form State
  const [cohortName, setCohortName] = useState('');
  const [cohortDesc, setCohortDesc] = useState('');
  const [cohortStart, setCohortStart] = useState('');
  const [cohortEnd, setCohortEnd] = useState('');
  const [cohortStatus, setCohortStatus] = useState<'Active' | 'Archived'>('Active');
  const [batchEmails, setBatchEmails] = useState('');

  const [availableStudentSearch, setAvailableStudentSearch] = useState('');

  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [allUsersDB, setAllUsersDB] = useState<any[]>([]);

  // 5-second countdown timer effect for destructive removals
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pendingRemoval && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [pendingRemoval, countdown]);

  const fetchCohortsData = async () => {
    setIsLoading(true);
    setLoadingMessage('Syncing workspace data...');
    
    const [cohortsRes, usersRes, teachersRes] = await Promise.all([
      supabase.from('Cohorts').select('*').order('created_at', { ascending: false }),
      supabase.from('Users').select('user_id, name, email, role_id, cohort_id'),
      supabase.from('Cohort Teachers').select('*')
    ]);

    if (cohortsRes.error) {
      console.error("Error fetching cohorts:", cohortsRes.error);
      addToast('Failed to load cohorts.', 'error');
      setIsLoading(false);
      return;
    }

    const allUsers = usersRes.data || [];
    setAllUsersDB(allUsers);
    const junctionData = teachersRes.data || [];
    const colors = ['bg-indigo-500', 'bg-teal-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500'];

    const mappedCohorts = cohortsRes.data.map((cohort: any, index: number) => {
      // Find Students (role 1, matching cohort_id)
      const enrolledStudents = allUsers
        .filter(u => u.role_id === 1 && u.cohort_id === cohort.cohort_id)
        .map(u => ({ id: u.user_id, name: u.name, email: u.email || 'No email' }));

      // Find Teachers (role 2, using the junction table)
      const assignedTeacherIds = junctionData
        .filter(ct => ct.cohort_id === cohort.cohort_id)
        .map(ct => ct.teacher_id);
        
      const assignedTeachers = allUsers
        .filter(u => u.role_id === 2 && assignedTeacherIds.includes(u.user_id))
        .map(u => ({ id: u.user_id, name: u.name, email: u.email || 'No email' }));

      let displayDate = 'TBD';
      let rawStart = '';
      let rawEnd = '';
      
      if (cohort.start_date && cohort.end_date) {
        rawStart = cohort.start_date.substring(0, 7); // "YYYY-MM"
        rawEnd = cohort.end_date.substring(0, 7);
        const start = new Date(cohort.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const end = new Date(cohort.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        displayDate = `${start} to ${end}`;
      }

      return {
        id: cohort.cohort_id,
        name: cohort.cohort_name,
        description: cohort.description || 'No description provided.',
        color: colors[index % colors.length],
        status: (cohort.status as 'Active' | 'Archived') || 'Active',
        dateRange: displayDate,
        start_date: rawStart,
        end_date: rawEnd,
        teachers: assignedTeachers, 
        students: enrolledStudents
      };
    });

    setCohorts(mappedCohorts);
    setIsLoading(false);
  };

  const logWorkspaceAction = async (actionDesc: string, severity: string = 'Info') => {
    const { data: sessionData } = await supabase.auth.getUser();
    await supabase.from('AuditLogs').insert([{
      user_email: sessionData?.user?.email || 'Unknown Admin',
      role: 'Admin',
      action: actionDesc,
      type: 'Workspace Management',
      severity,
      ip_address: 'Internal',
      user_agent: navigator.userAgent
    }]);
  };

  useEffect(() => {
    fetchCohortsData();
  }, []);

  const handleCreateCohortSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingMessage('Creating new cohort...');
    setIsSubmitting(true);

    const { error } = await supabase
      .from('Cohorts')
      .insert([{
        cohort_name: cohortName,
        description: cohortDesc,
        start_date: `${cohortStart}-01`, 
        end_date: `${cohortEnd}-01`,
        status: 'Active'
      }]);

    if (!error) {
      await logWorkspaceAction(`Created new cohort: ${cohortName} (Active)`);
      addToast('Cohort successfully created.', 'success');
      await fetchCohortsData();
      closeModals();
    } else {
      addToast(`Error creating cohort: ${error.message}`, 'error');
    }
    setIsSubmitting(false);
  };

  const handleEditCohortSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohort) return;

    setLoadingMessage('Saving workspace details...');
    setIsSubmitting(true);

    const { error } = await supabase
      .from('Cohorts')
      .update({
        cohort_name: cohortName,
        description: cohortDesc,
        start_date: `${cohortStart}-01`, 
        end_date: `${cohortEnd}-01`,
        status: cohortStatus
      })
      .eq('cohort_id', selectedCohort);

    if (!error) {
      setCohorts(prev => prev.map(c => c.id === selectedCohort ? {
        ...c,
        name: cohortName,
        description: cohortDesc,
        start_date: cohortStart,
        end_date: cohortEnd,
        status: cohortStatus
      } : c));

      await logWorkspaceAction(`Updated cohort details for ${cohortName} (Status: ${cohortStatus})`);
      addToast(`Cohort updated successfully to ${cohortStatus}.`, 'success');
      setShowEditModal(false);
      fetchCohortsData();
    } else {
      addToast(`Error updating cohort: ${error.message}`, 'error');
    }
    setIsSubmitting(false);
  };

  // --- Teacher Assignment ---
  const handleAssignTeacher = async (teacherId: string) => {
    setLoadingMessage('Assigning faculty to workspace...');
    setIsLoading(true);
    await supabase.from('Cohort Teachers').insert([{ cohort_id: selectedCohort, teacher_id: teacherId }]);
    
    const { data: teacher } = await supabase.from('Users').select('name').eq('user_id', teacherId).single();
    const { data: cohort } = await supabase.from('Cohorts').select('cohort_name').eq('cohort_id', selectedCohort).single();
    
    await logWorkspaceAction(`Assigned teacher ${teacher?.name} to cohort ${cohort?.cohort_name}`);
    addToast('Teacher assigned successfully.', 'success');
    await fetchCohortsData();
    setIsLoading(false);
  };

  const executeRemoveTeacher = async (teacherId: string) => {
    setLoadingMessage('Removing faculty from workspace...');
    setIsLoading(true);
    await supabase.from('Cohort Teachers').delete().eq('cohort_id', selectedCohort).eq('teacher_id', teacherId);
    
    const { data: teacher } = await supabase.from('Users').select('name').eq('user_id', teacherId).single();
    const { data: cohort } = await supabase.from('Cohorts').select('cohort_name').eq('cohort_id', selectedCohort).single();
    
    await logWorkspaceAction(`Removed teacher ${teacher?.name} from cohort ${cohort?.cohort_name}`, 'Warning');
    addToast('Teacher removed from cohort.', 'info');
    await fetchCohortsData();
    setIsLoading(false);
  };

  // --- Student Enrollment & Transfer Execution ---
  const executeEnrollment = async (userIds: string[], transferredStudents: PendingTransferStudent[] = []) => {
    if (!selectedCohort || userIds.length === 0) return;

    setLoadingMessage('Updating student enrollment...');
    setIsSubmitting(true);

    const { error } = await supabase
      .from('Users')
      .update({ cohort_id: selectedCohort })
      .in('user_id', userIds);

    if (error) {
      addToast(`Enrollment failed: ${error.message}`, 'error');
      setIsSubmitting(false);
      return;
    }

    const cohort = cohorts.find(c => c.id === selectedCohort);
    if (transferredStudents.length > 0) {
      const summary = transferredStudents.map(s => `${s.name} (from ${s.currentCohortName})`).join(', ');
      await logWorkspaceAction(`Transferred student(s) into cohort ${cohort?.name}: ${summary}`, 'Warning');
      addToast(`Transferred ${transferredStudents.length} student(s) to ${cohort?.name}.`, 'success');
    } else {
      await logWorkspaceAction(`Enrolled ${userIds.length} student(s) into cohort ${cohort?.name}`);
      addToast(`Successfully enrolled student(s) into ${cohort?.name}.`, 'success');
    }

    setShowAddStudentModal(false);
    setShowBatchModal(false);
    setPendingTransfer(null);
    setBatchEmails('');
    await fetchCohortsData();
    setIsSubmitting(false);
  };

  // Triggered when clicking "Add" or "Transfer" on an individual student
  const handleStudentSelection = (student: any) => {
    if (student.cohort_id && student.cohort_id !== selectedCohort) {
      const sourceCohort = cohorts.find(c => c.id === student.cohort_id);
      setPendingTransfer({
        students: [{
          id: student.user_id,
          name: student.name,
          email: student.email || 'No email',
          currentCohortName: sourceCohort ? sourceCohort.name : 'Another Cohort'
        }],
        allUserIdsToEnroll: [student.user_id]
      });
      return;
    }

    // Direct enrollment if student is unassigned
    executeEnrollment([student.user_id], []);
  };

  const executeRemoveStudent = async (studentId: string) => {
    setLoadingMessage('Removing student...');
    setIsLoading(true);
    await supabase.from('Users').update({ cohort_id: null }).eq('user_id', studentId);
    
    const { data: student } = await supabase.from('Users').select('name').eq('user_id', studentId).single();
    const { data: cohort } = await supabase.from('Cohorts').select('cohort_name').eq('cohort_id', selectedCohort).single();
    
    await logWorkspaceAction(`Removed student ${student?.name} from cohort ${cohort?.cohort_name}`, 'Warning');
    addToast('Student removed from cohort.', 'info');
    await fetchCohortsData();
    setIsLoading(false);
  };

  const handleConfirmRemoval = async () => {
    if (!pendingRemoval || countdown > 0) return;
    const { type, id } = pendingRemoval;
    setPendingRemoval(null);

    if (type === 'teacher') {
      await executeRemoveTeacher(id);
    } else {
      await executeRemoveStudent(id);
    }
  };

  const handleBatchImport = async () => {
    const emailList = batchEmails.split(/[,\n]+/).map(e => e.trim()).filter(e => e !== '');
    const studentsToUpdate = allUsersDB.filter(u => u.role_id === 1 && emailList.includes(u.email));
    const userIds = studentsToUpdate.map(u => u.user_id);

    if (userIds.length === 0) {
      addToast('No matching registered students found for the provided emails.', 'error');
      return;
    }

    // Check if any students in the batch already belong to a different cohort
    const studentsToTransfer: PendingTransferStudent[] = studentsToUpdate
      .filter(u => u.cohort_id && u.cohort_id !== selectedCohort)
      .map(u => {
        const sourceCohort = cohorts.find(c => c.id === u.cohort_id);
        return {
          id: u.user_id,
          name: u.name,
          email: u.email || 'No email',
          currentCohortName: sourceCohort ? sourceCohort.name : 'Another Cohort'
        };
      });

    if (studentsToTransfer.length > 0) {
      setPendingTransfer({
        students: studentsToTransfer,
        allUserIdsToEnroll: userIds
      });
      return;
    }

    // No existing cohort assignments; proceed immediately
    await executeEnrollment(userIds, []);
  };

  const openEditModal = (cohort: Cohort) => {
    setCohortName(cohort.name);
    setCohortDesc(cohort.description);
    setCohortStart(cohort.start_date);
    setCohortEnd(cohort.end_date);
    setCohortStatus(cohort.status);
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setCohortName('');
    setCohortDesc('');
    setCohortStart('');
    setCohortEnd('');
    setCohortStatus('Active');
  };

  const currentCohort = cohorts.find(c => c.id === selectedCohort);

  const filteredStudents = currentCohort?.students.filter(student =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    student.email.toLowerCase().includes(studentSearch.toLowerCase())
  ) || [];

  const {
    currentPage, totalPages, currentItems: currentStudents,
    indexOfFirstItem: indexOfFirstStudent, indexOfLastItem: indexOfLastStudent, totalItems, nextPage, prevPage, resetPage
  } = usePagination(filteredStudents, 5);

  const activeCohortsList = cohorts.filter(c => c.status === 'Active');
  const archivedCohortsList = cohorts.filter(c => c.status === 'Archived');
  const displayedCohorts = cohortTab === 'active' ? activeCohortsList : archivedCohortsList;

  const availableTeachers = allUsersDB.filter(u => u.role_id === 2 && !currentCohort?.teachers.some(t => t.id === u.user_id));
  
  // Available students (everyone not currently enrolled in this specific cohort)
  const availableStudents = allUsersDB.filter(u => u.role_id === 1 && u.cohort_id !== selectedCohort);
  const filteredAvailableStudents = availableStudents.filter(u =>
    u.name.toLowerCase().includes(availableStudentSearch.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(availableStudentSearch.toLowerCase()))
  );

  // Destructive Removal Modal
  const renderRemovalModal = () => {
    if (!pendingRemoval) return null;
    const isTeacher = pendingRemoval.type === 'teacher';

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            {isTeacher ? 'Remove Faculty from Cohort?' : 'Unassign Student from Cohort?'}
          </h3>
          <p className="text-sm text-slate-600 font-bold mb-4">
            Are you sure you want to remove <span className="text-slate-900 font-extrabold">{pendingRemoval.name}</span> ({pendingRemoval.email}) from <span className="text-slate-900 font-extrabold">{currentCohort?.name}</span>?
          </p>
          <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 rounded-lg p-3 mb-6 text-left">
            {isTeacher 
              ? 'This teacher will immediately lose access to evaluate student attempts, view cohort analytics, and oversee mock examinations.'
              : 'This student will immediately lose access to cohort-specific mock exams and will be unassigned until placed into a new cohort.'}
          </p>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setPendingRemoval(null)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRemoval}
              disabled={countdown > 0}
              className="min-w-[170px] px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed"
            >
              {countdown > 0 ? `Confirm in ${countdown}s` : (isTeacher ? 'Confirm Removal' : 'Confirm Unassignment')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Transfer Confirmation Modal
  const renderTransferModal = () => {
    if (!pendingTransfer) return null;
    const isSingle = pendingTransfer.students.length === 1;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h3 className="text-lg font-bold text-slate-800">
            {isSingle ? 'Confirm Student Transfer' : 'Confirm Batch Student Transfer'}
          </h3>
          <p className="text-xs text-slate-500 font-bold mt-1">
            {isSingle 
              ? 'This student is already actively enrolled in another cohort:' 
              : `${pendingTransfer.students.length} student(s) are already actively enrolled in another cohort:`}
          </p>

          <div className="my-4 max-h-44 overflow-y-auto divide-y divide-slate-100 bg-slate-50 rounded-xl p-3 border border-slate-200">
            {pendingTransfer.students.map((student) => (
              <div key={student.id} className="py-2 text-xs first:pt-1 last:pb-1">
                <span className="font-bold text-slate-800 block">{student.name}</span>
                <span className="text-slate-500 block text-[11px]">{student.email}</span>
                <span className="text-amber-700 font-bold text-[11px] mt-0.5 inline-block">
                  Current Cohort: {student.currentCohortName}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs font-bold leading-relaxed mb-6">
            ⚠️ Transferring will move their enrollment to <span className="text-amber-950 font-black">{currentCohort?.name}</span>. They will no longer be able to take tests or access unattempted exams in their previous cohort.
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setPendingTransfer(null)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => executeEnrollment(pendingTransfer.allUserIdsToEnroll, pendingTransfer.students)}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Transferring...' : 'Confirm Transfer'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // VIEW 1: INSIDE A SPECIFIC COHORT
  // ==========================================
  if (selectedCohort !== null && currentCohort) {
    return (
      <div className="space-y-6 relative">
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={() => { setSelectedCohort(null); setStudentSearch(''); }} 
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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-800">{currentCohort.name}</h1>
                {currentCohort.status === 'Archived' && (
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    (Archived)
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 font-bold mt-0.5">{currentCohort.description}</p>
              <div className="flex gap-2 mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  currentCohort.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {currentCohort.status}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase tracking-wider">
                  {currentCohort.dateRange}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => openEditModal(currentCohort)}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Edit Cohort Details
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teachers Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700">Assigned Teachers / Examiners</h3>
              <button 
                onClick={() => setShowAssignTeacherModal(true)}
                className="text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded hover:bg-blue-700 shadow-sm flex items-center gap-1"
              >
                + Assign
              </button>
            </div>
            <div className="p-2">
              {currentCohort.teachers.length === 0 ? (
                <EmptyState title="No Teachers Assigned" message="There are currently no teachers assigned to this cohort workspace." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {currentCohort.teachers.map(teacher => (
                    <li key={teacher.id} className="p-3 flex justify-between items-center hover:bg-slate-50 rounded-lg transition-colors group">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{teacher.name}</p>
                          <p className="text-xs font-bold text-slate-500">{teacher.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setPendingRemoval({
                            type: 'teacher',
                            id: teacher.id,
                            name: teacher.name,
                            email: teacher.email
                          });
                          setCountdown(5);
                        }} 
                        className="text-xs text-red-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Students Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h3 className="font-bold text-slate-700">Enrolled Students ({currentCohort.students.length})</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowBatchModal(true)}
                    className="text-xs font-bold text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 shadow-sm flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Batch Add by Email
                  </button>
                  <button 
                    onClick={() => setShowAddStudentModal(true)}
                    className="text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded hover:bg-blue-700 shadow-sm flex items-center gap-1"
                  >
                    + Add
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center gap-4">
                <input 
                  type="text" 
                  placeholder="Search enrolled students..." 
                  value={studentSearch} 
                  onChange={(e) => { setStudentSearch(e.target.value); resetPage(); }}
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" 
                />
              </div>
            </div>
            
            <div className="flex-1 p-2">
              {currentStudents.length === 0 ? (
                <EmptyState title="No Students Found" message="No enrolled students match your current search query." />
              ) : (
                <ul className="flex flex-col">
                  {currentStudents.map(student => (
                    <li key={student.id} className="p-3 flex justify-between items-center hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{student.name}</p>
                          <p className="text-xs font-bold text-slate-500">{student.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setPendingRemoval({
                            type: 'student',
                            id: student.id,
                            name: student.name,
                            email: student.email
                          });
                          setCountdown(5);
                        }} 
                        className="text-xs text-red-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Showing {filteredStudents.length > 0 ? indexOfFirstStudent + 1 : 0} to {Math.min(indexOfLastStudent, filteredStudents.length)} of {totalItems} students</span>
              <div className="flex gap-1.5">
                <button onClick={prevPage} disabled={currentPage === 1} className="px-3 py-1.5 border rounded border-slate-300 bg-white hover:bg-slate-50 shadow-sm disabled:opacity-50">Prev</button>
                <button onClick={nextPage} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1.5 border rounded border-slate-300 bg-white hover:bg-slate-50 shadow-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        </div>

        {/* --- Workspace Action Modals --- */}
        {showEditModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Edit Cohort Details</h3>
              <form onSubmit={handleEditCohortSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Cohort Name</label>
                  <input type="text" value={cohortName} onChange={(e) => setCohortName(e.target.value)} required className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                  <textarea value={cohortDesc} onChange={(e) => setCohortDesc(e.target.value)} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-1 focus:ring-blue-500 resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Start Month</label>
                    <input type="month" value={cohortStart} onChange={(e) => setCohortStart(e.target.value)} required className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">End Month</label>
                    <input type="month" value={cohortEnd} onChange={(e) => setCohortEnd(e.target.value)} required className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold" />
                  </div>
                </div>

                {/* Cohort Status Selector */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Cohort Status</label>
                  <select
                    value={cohortStatus}
                    onChange={(e) => setCohortStatus(e.target.value as 'Active' | 'Archived')}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs cursor-pointer"
                  >
                    <option value="Active" className="text-slate-900 font-bold py-1">Active (Ongoing Review Cycle)</option>
                    <option value="Archived" className="text-slate-900 font-bold py-1">Archived (Concluded & Frozen)</option>
                  </select>
                  <p className="text-xs text-slate-500 font-bold mt-1.5 leading-relaxed">
                    Archiving freezes student attempts and prevents teachers from assigning new mock exams to this cohort.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAssignTeacherModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-lg font-bold text-slate-800">Assign Teacher</h3>
                <button onClick={() => setShowAssignTeacherModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>
              <div className="overflow-y-auto flex-1 space-y-2">
                {availableTeachers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No available teachers found.</p>
                ) : availableTeachers.map(u => (
                  <div key={u.user_id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg">
                    <div><p className="text-sm font-bold text-slate-800">{u.name}</p><p className="text-xs text-slate-500 font-medium">{u.email}</p></div>
                    <button onClick={() => handleAssignTeacher(u.user_id)} className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700">Assign</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Student Modal with Cohort Badging & Transfer Routing */}
        {showAddStudentModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-2 border-b pb-2">
                <h3 className="text-lg font-bold text-slate-800">Add Student to Cohort</h3>
                <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>
              <div className="mb-4">
                <p className="text-xs text-slate-500 font-bold mb-3">
                  If you want to register a brand new student, go to the <Link href="/admin/users/add" className="text-blue-600 hover:underline">user directory</Link>.
                </p>
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={availableStudentSearch}
                  onChange={(e) => setAvailableStudentSearch(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="overflow-y-auto flex-1 space-y-2">
                {filteredAvailableStudents.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No available students found.</p>
                ) : filteredAvailableStudents.map(u => {
                  const isEnrolledElsewhere = u.cohort_id && u.cohort_id !== selectedCohort;
                  const sourceCohort = isEnrolledElsewhere ? cohorts.find(c => c.id === u.cohort_id) : null;

                  return (
                    <div key={u.user_id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg hover:bg-slate-100/60 transition-colors">
                      <div className="pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-800">{u.name}</p>
                          {isEnrolledElsewhere ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              In: {sourceCohort?.name || 'Another Cohort'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              Unassigned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                      </div>
                      <button 
                        onClick={() => handleStudentSelection(u)} 
                        className={`px-3 py-1.5 text-xs font-bold rounded transition-colors shadow-2xs shrink-0 ${
                          isEnrolledElsewhere 
                            ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isEnrolledElsewhere ? 'Transfer' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showBatchModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Batch Assign Students</h3>
              <p className="text-sm text-slate-500 mb-4 font-bold">Paste a comma-separated or newline-separated list of student emails already registered on the platform.</p>
              <textarea 
                value={batchEmails}
                onChange={(e) => setBatchEmails(e.target.value)}
                placeholder="juan@stud.edu, ana@stud.edu..." 
                rows={5}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-1 focus:ring-blue-500 resize-none mb-4" 
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowBatchModal(false); setBatchEmails(''); }} className="px-5 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={handleBatchImport} disabled={isSubmitting || !batchEmails} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">Assign Users</button>
              </div>
            </div>
          </div>
        )}

        {renderRemovalModal()}
        {renderTransferModal()}

        <FullScreenLoader 
          isOpen={isLoading || isSubmitting} 
          message={loadingMessage} 
        />
      </div>
    );
  }

  // ==========================================
  // VIEW 2: COHORTS LIST (ACTIVE / ARCHIVED)
  // ==========================================
  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cohort Workspace Management</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">Organize user groups and assign teachers for targeted mock exams.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          + Create Cohort
        </button>
      </div>

      {/* Tabs with Dynamic Counts */}
      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-6">
          <button 
            onClick={() => setCohortTab('active')} 
            className={`pb-3 border-b-2 text-sm font-bold flex items-center gap-2 transition-colors ${
              cohortTab === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Active Cohorts</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
              {activeCohortsList.length}
            </span>
          </button>
          <button 
            onClick={() => setCohortTab('archived')} 
            className={`pb-3 border-b-2 text-sm font-bold flex items-center gap-2 transition-colors ${
              cohortTab === 'archived' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Archived</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 border border-slate-200">
              {archivedCohortsList.length}
            </span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-xl border border-slate-200">Loading cohorts...</div>
      ) : displayedCohorts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <EmptyState 
            title={cohortTab === 'active' ? 'No Active Cohorts Found' : 'No Archived Cohorts Found'} 
            message={cohortTab === 'active' ? 'Create a new cohort workspace to start organizing your users.' : 'Archived cohorts will appear here once their review cycles have concluded.'} 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
          {displayedCohorts.map((cohort) => (
            <div key={cohort.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col relative">
              <div className={`h-1.5 w-full ${cohort.color}`}></div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="pr-3">
                      <h3 className="font-bold text-lg text-slate-800 leading-snug">{cohort.name}</h3>
                      {cohort.status === 'Archived' && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                          (Archived)
                        </span>
                      )}
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      cohort.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {cohort.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Schedule</p>
                  <p className="text-sm text-slate-700 font-bold mb-4">{cohort.dateRange}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Teachers</p><p className="text-sm text-slate-700 font-bold">{cohort.teachers.length}</p></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Students</p><p className="text-sm text-slate-700 font-bold">{cohort.students.length}</p></div>
                  </div>
                </div>
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <button onClick={() => setSelectedCohort(cohort.id)} className="w-full py-2.5 text-sm font-bold rounded-lg transition-colors shadow-sm bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200">
                    Manage Workspace
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-800">Create New Cohort</h3>
              <button onClick={closeModals} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreateCohortSubmit} className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 mb-1">Cohort Name</label>
              <input type="text" value={cohortName} onChange={(e) => setCohortName(e.target.value)} placeholder="e.g. Intensive Program 2027" required className="w-full px-4 py-2 border rounded-lg text-sm font-bold focus:ring-blue-500" />
              <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
              <textarea value={cohortDesc} onChange={(e) => setCohortDesc(e.target.value)} rows={3} required className="w-full px-4 py-2 border rounded-lg text-sm font-bold focus:ring-blue-500 resize-none" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Start Month</label>
                  <input type="month" value={cohortStart} onChange={(e) => setCohortStart(e.target.value)} required className="w-full px-4 py-2 border rounded-lg text-sm font-bold focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">End Month</label>
                  <input type="month" value={cohortEnd} onChange={(e) => setCohortEnd(e.target.value)} required className="w-full px-4 py-2 border rounded-lg text-sm font-bold focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t mt-2">
                <button type="button" onClick={closeModals} className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">Create Workspace</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {renderRemovalModal()}
      {renderTransferModal()}

      <FullScreenLoader 
        isOpen={isLoading || isSubmitting} 
        message={loadingMessage} 
      />
    </div>
  );
}