'use client';

import FullScreenLoader from '@/components/ui/FullScreenLoader';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/ToastContext';

interface CohortSummary {
  cohort_id: string;
  cohort_name: string;
  description: string | null;
  account_status: string;
  start_date: string | null;
  end_date: string | null;
  student_count: number;
  exam_count: number;
  material_count: number;
}

interface AssignedMaterial {
  id: string; // Cohort_Materials ID
  material_id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size_mb: number;
  subject: string;
  uploaded_by: string;
  created_at: string;
}

interface StudentRecord {
  user_id: string;
  name: string;
  email: string;
  account_status: string;
  created_at: string;
}

interface AssignedExam {
  exam_id: string;
  exam_title: string;
  exam_subject: string;
  global_status: string;
  schedule_start: string | null;
  schedule_end: string | null;
  passing_score: number;
}

interface LibraryItem {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size_mb: number;
  subject: string;
  faculty?: {
    name: string;
    email: string;
  };
}

export default function FacultyCohortsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [cohorts, setCohorts] = useState<CohortSummary[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<CohortSummary | null>(null);

  // Detail View State
  const [activeTab, setActiveTab] = useState<'materials' | 'students' | 'exams'>('materials');
  const [assignedMaterials, setAssignedMaterials] = useState<AssignedMaterial[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [exams, setExams] = useState<AssignedExam[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Assign Material Modal States
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableLibrary, setAvailableLibrary] = useState<LibraryItem[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalSubjectFilter, setModalSubjectFilter] = useState('All');
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);

  // Fetch all cohorts assigned to this teacher
  const fetchTeacherCohorts = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data: userCohorts, error } = await supabase
      .from('Cohort Teachers')
      .select('cohort_id, Cohorts(*)')
      .eq('teacher_id', user.id);

    if (error || !userCohorts) {
      console.error('Failed to load cohorts:', error);
      setIsLoading(false);
      return;
    }

    const cohortList: CohortSummary[] = await Promise.all(
      userCohorts.map(async (row: any) => {
        const c = row.Cohorts;
        
        const { count: studentCount } = await supabase
          .from('Users')
          .select('user_id', { count: 'exact', head: true })
          .eq('cohort_id', c.cohort_id);

        const { count: examCount } = await supabase
          .from('Exam_Cohorts')
          .select('exam_id', { count: 'exact', head: true })
          .eq('cohort_id', c.cohort_id);

        const { count: materialCount } = await supabase
          .from('Cohort_Materials')
          .select('id', { count: 'exact', head: true })
          .eq('cohort_id', c.cohort_id);

        return {
          cohort_id: c.cohort_id,
          cohort_name: c.cohort_name,
          description: c.description,
          account_status: c.account_status || 'Active',
          start_date: c.start_date,
          end_date: c.end_date,
          student_count: studentCount || 0,
          exam_count: examCount || 0,
          material_count: materialCount || 0,
        };
      })
    );

    setCohorts(cohortList);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTeacherCohorts();
  }, []);

  // Fetch details when a cohort is selected
  const fetchCohortDetails = async (cohortId: string) => {
    setIsDetailLoading(true);

    // 1. Fetch assigned materials with uploader details
    const { data: matData } = await supabase
      .from('Cohort_Materials')
      .select(`
        id, 
        material_id, 
        created_at, 
        "Material Requests" (
          id, title, file_name, file_path, file_size_mb, subject, tags,
          faculty:Users ( name, email )
        )
      `)
      .eq('cohort_id', cohortId);

    const formattedMaterials = (matData || []).map((row: any) => {
      const m = row['Material Requests'];
      const uploader = m?.faculty?.name || 'Administrator';
      return {
        id: row.id,
        material_id: row.material_id,
        title: m?.title || 'Unknown Title',
        file_name: m?.file_name || 'file.pdf',
        file_path: m?.file_path || '',
        file_size_mb: m?.file_size_mb || 0,
        subject: m?.subject || (m?.tags && m.tags[0]) || 'General Reference',
        uploaded_by: uploader,
        created_at: row.created_at,
      };
    });
    setAssignedMaterials(formattedMaterials);

    // 2. Fetch enrolled students
    const { data: studentData } = await supabase
      .from('Users')
      .select('user_id, name, email, account_status, created_at')
      .eq('cohort_id', cohortId)
      .order('name', { ascending: true });

    setStudents(studentData || []);

    // 3. Fetch assigned exams
    const { data: examData } = await supabase
      .from('Exam_Cohorts')
      .select('exam_id, Exams(*)')
      .eq('cohort_id', cohortId);

    const formattedExams = (examData || []).map((row: any) => {
      const e = row.Exams;
      return {
        exam_id: row.exam_id,
        exam_title: e?.exam_title || 'Untitled Exam',
        exam_subject: e?.exam_subject || 'General',
        global_status: e?.global_status || 'Pending',
        schedule_start: e?.schedule_start,
        schedule_end: e?.schedule_end,
        passing_score: e?.passing_score || 0,
      };
    });
    setExams(formattedExams);

    setIsDetailLoading(false);
  };

  const handleSelectCohort = (cohort: CohortSummary) => {
    setSelectedCohort(cohort);
    setActiveTab('materials');
    fetchCohortDetails(cohort.cohort_id);
  };

  // Open modal and fetch unassigned approved materials
  const handleOpenAssignModal = async () => {
    if (!selectedCohort) return;
    setModalSearchQuery('');
    setModalSubjectFilter('All');

    const { data: library, error } = await supabase
      .from('Material Requests')
      .select('id, title, file_name, file_path, file_size_mb, subject, tags, faculty:Users(name, email)')
      .eq('status', 'Approved & Indexed')
      .order('title', { ascending: true });

    if (!error && library) {
      const parsedLibrary: LibraryItem[] = library.map((item: any) => ({
        id: item.id,
        title: item.title,
        file_name: item.file_name,
        file_path: item.file_path,
        file_size_mb: item.file_size_mb,
        subject: item.subject || (item.tags && item.tags[0]) || 'General Reference',
        faculty: item.faculty,
      }));

      setAvailableLibrary(parsedLibrary);
      setSelectedMaterialIds(assignedMaterials.map(m => m.material_id));
      setShowAssignModal(true);
    }
  };

  const toggleMaterialSelection = (materialId: string) => {
    setSelectedMaterialIds(prev => 
      prev.includes(materialId) ? prev.filter(id => id !== materialId) : [...prev, materialId]
    );
  };

  // Filtered materials inside the modal
  const filteredLibrary = useMemo(() => {
    return availableLibrary.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
        item.file_name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
        (item.faculty?.name && item.faculty.name.toLowerCase().includes(modalSearchQuery.toLowerCase()));

      const matchesSubject = modalSubjectFilter === 'All' || item.subject === modalSubjectFilter;

      return matchesSearch && matchesSubject;
    });
  }, [availableLibrary, modalSearchQuery, modalSubjectFilter]);

  const handleSaveAssignedMaterials = async () => {
    if (!selectedCohort) return;
    setIsSubmittingAssignment(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentIds = assignedMaterials.map(m => m.material_id);
      
      const toAdd = selectedMaterialIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !selectedMaterialIds.includes(id));

      if (toRemove.length > 0) {
        await supabase
          .from('Cohort_Materials')
          .delete()
          .eq('cohort_id', selectedCohort.cohort_id)
          .in('material_id', toRemove);
      }

      if (toAdd.length > 0) {
        const payload = toAdd.map(matId => ({
          cohort_id: selectedCohort.cohort_id,
          material_id: matId,
          assigned_by: user?.id,
        }));
        await supabase.from('Cohort_Materials').insert(payload);
      }

      addToast('Review materials updated for this cohort.', 'success');
      setShowAssignModal(false);
      fetchCohortDetails(selectedCohort.cohort_id);
      fetchTeacherCohorts();
    } catch (err: any) {
      addToast(err.message || 'Failed to update assigned materials.', 'error');
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const handlePreviewMaterial = async (filePath: string) => {
    const { data, error } = await supabase.storage.from('textbooks').createSignedUrl(filePath, 60);
    if (error || !data) {
      addToast('Could not load file. Storage path may be missing.', 'error');
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const handleUnassignSingle = async (cohortMaterialId: string, title: string) => {
    if (!confirm(`Remove "${title}" from this cohort's available review files?`)) return;

    const { error } = await supabase
      .from('Cohort_Materials')
      .delete()
      .eq('id', cohortMaterialId);

    if (!error) {
      addToast(`"${title}" removed from cohort review files.`, 'success');
      if (selectedCohort) {
        fetchCohortDetails(selectedCohort.cohort_id);
        fetchTeacherCohorts();
      }
    } else {
      addToast('Failed to remove material: ' + error.message, 'error');
    }
  };

  // ==========================================
  // DETAIL VIEW
  // ==========================================
  if (selectedCohort) {
    return (
      <div className="space-y-6 pb-24">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-2">
          <button 
            onClick={() => setSelectedCohort(null)} 
            className="text-blue-600 hover:underline font-bold"
          >
            My Cohorts
          </button>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600 font-bold">{selectedCohort.cohort_name}</span>
        </div>

        {/* Cohort Header Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{selectedCohort.cohort_name}</h1>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold uppercase tracking-wider">
                {selectedCohort.account_status}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-bold mt-1">
              {selectedCohort.description || 'No specific description provided for this cohort.'}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="text-xl font-bold text-slate-800 block leading-tight">{students.length}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Students</span>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="text-center">
              <span className="text-xl font-bold text-slate-800 block leading-tight">{assignedMaterials.length}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Materials</span>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="text-center">
              <span className="text-xl font-bold text-slate-800 block leading-tight">{exams.length}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Exams</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('materials')} 
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'materials' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Review Materials ({assignedMaterials.length})
          </button>
          <button 
            onClick={() => setActiveTab('students')} 
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'students' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Enrolled Students ({students.length})
          </button>
          <button 
            onClick={() => setActiveTab('exams')} 
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'exams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Assigned Exams ({exams.length})
          </button>
        </div>

        {/* TAB 1: REVIEW MATERIALS */}
        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800">Assigned Cohort Textbooks & Outlines</h3>
                <p className="text-xs text-slate-500 font-bold">Students enrolled in this cohort can directly read and download these reference files.</p>
              </div>
              <button 
                onClick={handleOpenAssignModal}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                + Assign Reference Files
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Document Title & Details</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">BLEPP Subject</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Uploaded By</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date Assigned</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {isDetailLoading ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">Loading materials...</td></tr>
                    ) : assignedMaterials.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                          No review materials assigned to this cohort yet. Click &quot;+ Assign Reference Files&quot; to provide textbooks to your students.
                        </td>
                      </tr>
                    ) : (
                      assignedMaterials.map((mat) => (
                        <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-slate-800">{mat.title}</p>
                            <p className="text-xs font-bold text-slate-500">{mat.file_size_mb} MB • {mat.file_name}</p>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-xs font-bold">
                              {mat.subject}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-600 text-xs">
                            {mat.uploaded_by}
                          </td>
                          <td className="p-4 text-xs font-bold text-slate-500">
                            {new Date(mat.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-3 items-center">
                              <button 
                                onClick={() => handlePreviewMaterial(mat.file_path)}
                                className="text-xs font-bold text-blue-600 hover:underline"
                              >
                                View File
                              </button>
                              <div className="w-px h-3 bg-slate-200"></div>
                              <button 
                                onClick={() => handleUnassignSingle(mat.id, mat.title)}
                                className="text-xs font-bold text-red-500 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ENROLLED STUDENTS */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Student Name</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Account Status</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Enrolled Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isDetailLoading ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold">Loading students...</td></tr>
                  ) : students.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold">No students currently enrolled in this cohort.</td></tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.user_id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{student.name}</td>
                        <td className="p-4 font-bold text-slate-600">{student.email}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            {student.account_status || 'Active'}
                          </span>
                        </td>
                        <td className="p-4 text-right text-xs font-bold text-slate-500">
                          {new Date(student.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ASSIGNED EXAMS */}
        {activeTab === 'exams' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Exam Title</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Subject</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Schedule Window</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isDetailLoading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">Loading exams...</td></tr>
                  ) : exams.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No exams currently assigned to this cohort.</td></tr>
                  ) : (
                    exams.map((exam) => (
                      <tr key={exam.exam_id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{exam.exam_title}</td>
                        <td className="p-4 font-bold text-slate-600">{exam.exam_subject}</td>
                        <td className="p-4 text-xs font-bold text-slate-500">
                          {exam.schedule_start ? new Date(exam.schedule_start).toLocaleDateString() : 'N/A'} - {exam.schedule_end ? new Date(exam.schedule_end).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            exam.global_status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                            exam.global_status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {exam.global_status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => router.push(`/faculty/exams?examId=${exam.exam_id}`)}
                            className="text-xs font-bold text-blue-600 hover:underline"
                          >
                            Manage Exam
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ASSIGN MATERIAL MODAL WITH SEARCH & SCROLL */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Assign Reference Materials</h3>
                  <p className="text-xs text-slate-500 font-bold">Select the approved textbooks and outlines to share with {selectedCohort.cohort_name}.</p>
                </div>
                <button 
                  onClick={() => setShowAssignModal(false)} 
                  className="text-slate-400 hover:text-slate-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Search & Subject Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 py-4 border-b border-slate-100 shrink-0">
                <div className="flex-1 relative">
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by title, filename, uploader, or subject..."
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="sm:w-56">
                  <select
                    value={modalSubjectFilter}
                    onChange={(e) => setModalSubjectFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:border-blue-500"
                  >
                    <option value="All">All BLEPP Subjects</option>
                    <option value="Industrial-Organizational Psychology">Industrial-Organizational</option>
                    <option value="Abnormal Psychology">Abnormal Psychology</option>
                    <option value="Psychological Assessment">Psychological Assessment</option>
                    <option value="Developmental Psychology">Developmental Psychology</option>
                  </select>
                </div>
              </div>

              {/* Scrollable List */}
              <div className="overflow-y-auto max-h-[50vh] space-y-2 pr-1 my-3 flex-1">
                {filteredLibrary.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs font-bold">
                    No approved materials match your search or filter criteria.
                  </div>
                ) : (
                  filteredLibrary.map((item) => {
                    const isSelected = selectedMaterialIds.includes(item.id);
                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleMaterialSelection(item.id)}
                        className={`p-3.5 border rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => {}} // Click handler handled by parent div
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <p className="text-sm font-bold text-slate-800">{item.title}</p>
                            <p className="text-xs font-bold text-slate-500">
                              {item.file_size_mb} MB • Uploaded by {item.faculty?.name || 'Administrator'}
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-white text-indigo-700 border border-indigo-100 rounded text-[10px] font-bold shrink-0">
                          {item.subject}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 shrink-0">
                <span className="text-xs font-bold text-slate-500">
                  {selectedMaterialIds.length} file{selectedMaterialIds.length === 1 ? '' : 's'} assigned to cohort
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingAssignment}
                    onClick={handleSaveAssignedMaterials}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingAssignment ? 'Saving...' : 'Save Access'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // MAIN COHORTS OVERVIEW (GRID)
  // ==========================================
  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Cohorts</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">Manage enrolled students, assigned exams, and student review materials by cohort.</p>
        </div>
      </div>

      {isLoading ? (
        <FullScreenLoader isOpen={isLoading} message="Loading your assigned cohorts..." />
      ) : cohorts.length === 0 ? (
        <div className="p-12 text-center text-sm font-bold text-slate-500 bg-white rounded-xl border border-slate-200">
          You are not currently assigned to any cohorts. An administrator can assign you to cohorts from the Admin portal.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cohorts.map((c) => (
            <div 
              key={c.cohort_id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-slate-800 leading-snug">{c.cohort_name}</h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold uppercase tracking-wider">
                    {c.account_status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-bold mb-6 line-clamp-2">
                  {c.description || 'No description provided.'}
                </p>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                  <div>
                    <span className="text-base font-bold text-slate-800 block">{c.student_count}</span>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Students</span>
                  </div>
                  <div>
                    <span className="text-base font-bold text-slate-800 block">{c.material_count}</span>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Materials</span>
                  </div>
                  <div>
                    <span className="text-base font-bold text-slate-800 block">{c.exam_count}</span>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Exams</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => handleSelectCohort(c)}
                  className="w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  Open Cohort Hub &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}