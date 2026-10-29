'use client';

import FullScreenLoader from '@/components/ui/FullScreenLoader';
import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/ToastContext';
import { useRegeneration } from '@/hooks/useRegeneration';
import {
  calculateItemAnalysis,
  calculateTOSScoring,
  calculateKR20Reliability,
  ItemAnalysisResult,
  StudentAttemptScore,
  QuestionDefinition
} from '@/lib/psychometrics';
import {
  exportToCSV,
  exportToXLSX,
  exportItemAnalysisPDF
} from '@/lib/exportUtils';

// --- Types ---
interface FacultyExam {
  id: string;
  title: string;
  target: string;
  cohortId: string;
  cohortName: string;
  cohortStatus: 'Active' | 'Archived';
  cohorts: string[];
  cohortIds: string[];
  items: number;
  status: string;
  startDateStr: string;
  endDateStr: string;
  color: string;
  scheduleStart: string;
  scheduleEnd: string;
  passingScore: number;
  timeLimit: number;
  maxAttempts: number;
  closeAfterDeadline: boolean;
  gradingLogic: string;
  is_visible: boolean;
  references: string[];
}

interface ValidationItem {
  id: string;
  topic: string;
  question: string;
  options: string[];
  answer: string;
  rationale: string;
  status: string;
  citation: string;
}

interface StudentReviewItem {
  qNum: number;
  text: string;
  topic: string;
  options: string[];
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

interface AttemptRecord {
  attemptId: string;
  score: number;
  rawScore: number;
  maxScore: number;
  scorePercentage: number;
  status: string;
  takenAt: string;
  items: StudentReviewItem[];
  weakCompetencies: { topic: string; accuracy: number }[];
}

interface SelectedStudentReview {
  name: string;
  attempts: AttemptRecord[];
}

interface TeacherCohort {
  id: string;
  name: string;
  status: 'Active' | 'Archived';
}

const STUDENTS_PER_PAGE = 10;

// --- Helpers ---
const formatCitations = (rawCitations: any): string => {
  if (!rawCitations) return 'No citation provided';

  let parsed: any = rawCitations;
  try {
    while (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
  } catch (e) {
    return String(rawCitations).replace(/^["']|["']$/g, '').trim();
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    if (typeof parsed === 'string') return parsed;
    return 'No citation provided';
  }

  const docMap: Record<string, Set<number>> = {};

  parsed.forEach((item: any) => {
    if (!item) return;
    let src = item.source || item.document || item.doc || 'Unknown Document';
    src = src.replace(/^\d+[-_]/, '').trim();

    if (!docMap[src]) {
      docMap[src] = new Set<number>();
    }

    if (item.page !== undefined && item.page !== null) {
      const pageNum = Number(item.page);
      if (!isNaN(pageNum)) {
        docMap[src].add(pageNum);
      }
    }
  });

  const formattedDocs = Object.keys(docMap).map((docName) => {
    const pages = Array.from(docMap[docName]).sort((a, b) => a - b);
    if (pages.length > 0) {
      return `${docName}, Pages: ${pages.join(', ')}`;
    }
    return docName;
  });

  return formattedDocs.join(' | ') || 'No citation provided';
};

const normalizeForComparison = (str: string) => {
  return String(str || '')
    .replace(/^[\\"'“”\[\]]+|[\\"'“”\[\]]+$/g, '')
    .trim()
    .toLowerCase();
};

const formatForInput = (utcString: string | null | undefined): string => {
  if (!utcString) return '';
  const safeString = utcString.includes('Z') || utcString.includes('+') ? utcString : `${utcString}Z`;
  const d = new Date(safeString);
  if (isNaN(d.getTime())) return '';
  
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const localToUTC = (localString: string | null | undefined): string | null => {
  if (!localString) return null;
  const [datePart, timePart] = localString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  const d = new Date(year, month - 1, day, hours, minutes);
  return d.toISOString();
};

const formatAttemptDate = (isoString: string) => {
  if (!isoString) return 'Pending';
  const d = new Date(isoString);
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dateStr}, ${timeStr}`;
};

const parseOptionsArray = (raw: any): string[] => {
  if (!raw) return ['Option A', 'Option B', 'Option C', 'Option D'];
  let parsed = raw;
  try {
    while (typeof parsed === 'string') parsed = JSON.parse(parsed);
  } catch (e) {
    // raw was already plain text or array
  }
  if (Array.isArray(parsed)) {
    return parsed.map(opt => String(opt));
  }
  if (typeof parsed === 'object' && parsed !== null) {
    return Object.values(parsed).map(opt => String(opt));
  }
  return [String(raw)];
};

function FacultyExamsContent() {
  const router = useRouter();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  const { regenerateItem, checkRegenerationHeartbeat, status: regenStatus, progressDetails: regenProgress } = useRegeneration();

  const [selectedExam, setSelectedExam] = useState<null | string>(null);
  const [examTab, setExamTab] = useState('settings');
  const [validationTab, setValidationTab] = useState<'pending' | 'approved'>('pending');

  const [examSearchQuery, setExamSearchQuery] = useState('');
  const debouncedExamSearch = useDebounce(examSearchQuery, 300);
  const [examStatusFilter, setExamStatusFilter] = useState('All');

  const [studentSearch, setStudentSearch] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearch, 300);
  const [studentStatusFilter, setStudentStatusFilter] = useState('All');
  const [studentPage, setStudentPage] = useState(1);

  // Question Analytics Attempt Basis, Details & Export Dropdown
  const [analyticsAttemptBasis, setAnalyticsAttemptBasis] = useState<'graded' | 'first' | 'all'>('graded');
  const [expandedQuestionDetails, setExpandedQuestionDetails] = useState<Record<string, boolean>>({});
  const [isItemExportOpen, setIsItemExportOpen] = useState(false);

  const toggleQuestionDetails = (id: string) => {
    setExpandedQuestionDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [regeneratingItems, setRegeneratingItems] = useState<string[]>([]);

  const [teacherCohorts, setTeacherCohorts] = useState<TeacherCohort[]>([]);
  const [editSelectedCohort, setEditSelectedCohort] = useState<string>('');
  const [allActiveCohorts, setAllActiveCohorts] = useState<{ id: string; name: string }[]>([]);

  // Settings Edit States
  const [editExamStatus, setEditExamStatus] = useState<string>('Active');
  const [editIsVisible, setEditIsVisible] = useState<boolean>(true);

  // Duplication Modal States
  const [duplicateModalExam, setDuplicateModalExam] = useState<FacultyExam | null>(null);
  const [duplicateTitle, setDuplicateTitle] = useState('');
  const [duplicateTargetCohort, setDuplicateTargetCohort] = useState('');
  const [duplicateStartDate, setDuplicateStartDate] = useState('');
  const [duplicateEndDate, setDuplicateEndDate] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);

  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [questionToRegenerate, setQuestionToRegenerate] = useState<null | string>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ValidationItem | null>(null);

  const [showActivationModal, setShowActivationModal] = useState(false);
  const [pendingApprovalAction, setPendingApprovalAction] = useState<(() => void) | null>(null);

  // Student Review Sub-View States
  const [selectedStudentForReview, setSelectedStudentForReview] = useState<SelectedStudentReview | null>(null);
  const [activeAttemptIndex, setActiveAttemptIndex] = useState(0);
  const [isReviewDropdownOpen, setIsReviewDropdownOpen] = useState(false);
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [exams, setExams] = useState<FacultyExam[]>([]);
  const [aiQuestions, setAiQuestions] = useState<ValidationItem[]>([]);

  // Analytics States & Initial Load Tracking (Prevents background poll flickering)
  const [studentAnalytics, setStudentAnalytics] = useState<any[]>([]);
  const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);
  const [questionAnalytics, setQuestionAnalytics] = useState<any[]>([]);
  const [kr20Reliability, setKr20Reliability] = useState<number | null>(null);

  const hasLoadedAnalyticsRef = useRef(false);
  const hasLoadedQuestionAnalyticsRef = useRef(false);

  // Competency Filters
  const [selectedCompetencyFilter, setSelectedCompetencyFilter] = useState<string>('All');

  const handleBackToExams = () => {
    setSelectedExam(null);
    setSelectedQuestions([]);
    setSelectedStudentForReview(null);
    setSelectedCompetencyFilter('All');
    setIsItemExportOpen(false);
    hasLoadedAnalyticsRef.current = false;
    hasLoadedQuestionAnalyticsRef.current = false;
    router.replace('/faculty/exams');
  };

  useEffect(() => {
    const passedExamId = searchParams.get('examId');
    const passedView = searchParams.get('view');

    if (passedExamId) {
      setSelectedExam(passedExamId);

      if (passedView === 'review') {
        setExamTab('questions');
      } else if (passedView === 'results') {
        setExamTab('question_analytics'); 
      } else if (passedView === 'edit') {
        setExamTab('settings');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedExam && exams.length > 0) {
      const current = exams.find(e => e.id === selectedExam);
      if (current) {
        setEditSelectedCohort(current.cohortId || '');
        setEditExamStatus(current.status);
        setEditIsVisible(current.status === 'Pending' ? false : current.is_visible);
      }
    }
  }, [selectedExam, exams]);

  // Reset tracking on selected exam change
  useEffect(() => {
    hasLoadedAnalyticsRef.current = false;
    hasLoadedQuestionAnalyticsRef.current = false;
    setStudentPage(1);
  }, [selectedExam]);

  const fetchFacultyExams = React.useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Fetch all active cohorts across the institution for cross-cohort duplication
    const { data: allActiveCohortsData } = await supabase
      .from('Cohorts')
      .select('cohort_id, cohort_name')
      .eq('status', 'Active')
      .order('cohort_name', { ascending: true });

    if (allActiveCohortsData) {
      setAllActiveCohorts(
        allActiveCohortsData.map((c: any) => ({ id: c.cohort_id, name: c.cohort_name }))
      );
    }

    // 2. Fetch cohorts taught by this teacher
    const { data: userCohorts } = await supabase
      .from('Cohort Teachers')
      .select('cohort_id, Cohorts(cohort_id, cohort_name, status)')
      .eq('teacher_id', user.id);

    const cohortIds = userCohorts?.map((c: any) => c.cohort_id) || [];
    const fetchedTeacherCohorts: TeacherCohort[] = userCohorts?.map((c: any) => ({
      id: c.cohort_id,
      name: (c.Cohorts as any)?.cohort_name || 'Unknown Cohort',
      status: (c.Cohorts as any)?.status || 'Active'
    })) || [];
    
    setTeacherCohorts(fetchedTeacherCohorts);

    if (cohortIds.length === 0) {
      setExams([]);
      setIsLoading(false);
      return;
    }

    const { data: examLinks } = await supabase
      .from('Exam_Cohorts')
      .select('exam_id')
      .in('cohort_id', cohortIds);

    const examIds = examLinks?.map(link => link.exam_id) || [];

    if (examIds.length === 0) {
      setExams([]);
      setIsLoading(false);
      return;
    }

    const { data: dbExams, error } = await supabase
      .from('Exams')
      .select(`
        exam_id, exam_title, exam_subject, schedule_start, schedule_end, passing_score, passing_percentage, time_limit_mins, global_status, references,
        max_attempts, close_after_deadline, grading_logic, is_visible,
        Exam_Cohorts ( cohort_id, Cohorts ( cohort_id, cohort_name, status ) ),
        "Mock Exam Items" ( id )
      `)
      .in('exam_id', examIds)
      .order('schedule_start', { ascending: false });

    if (!error && dbExams) {
      const accentColors = ['bg-emerald-500', 'bg-amber-500', 'bg-slate-500', 'bg-blue-500', 'bg-purple-500'];

      const formattedExams: FacultyExam[] = dbExams.map((exam: any, index: number) => {
        const primaryLink = exam.Exam_Cohorts?.[0];
        const assignedCohortName = primaryLink?.Cohorts?.cohort_name || 'Unassigned Cohort';
        const assignedCohortId = primaryLink?.cohort_id || '';
        const assignedCohortStatus = (primaryLink?.Cohorts?.status as 'Active' | 'Archived') || 'Active';

        const cohortsList = exam.Exam_Cohorts?.map((ec: any) => ec.Cohorts?.cohort_name).filter(Boolean) || [];
        const cohortIdList = exam.Exam_Cohorts?.map((ec: any) => ec.cohort_id).filter(Boolean) || [];
        const itemCount = exam['Mock Exam Items'] ? exam['Mock Exam Items'].length : 0;
        const targetPassingScore = exam.passing_percentage || exam.passing_score || 0;

        return {
          id: exam.exam_id,
          title: exam.exam_title,
          target: exam.exam_subject || 'Comprehensive',
          cohortId: assignedCohortId,
          cohortName: assignedCohortName,
          cohortStatus: assignedCohortStatus,
          cohorts: cohortsList,
          cohortIds: cohortIdList,
          items: itemCount,
          status: exam.global_status || 'Pending',
          startDateStr: exam.schedule_start ? new Date(exam.schedule_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Date',
          endDateStr: exam.schedule_end ? new Date(exam.schedule_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Date',
          scheduleStart: formatForInput(exam.schedule_start),
          scheduleEnd: formatForInput(exam.schedule_end),
          passingScore: targetPassingScore, 
          timeLimit: exam.time_limit_mins || 60,
          maxAttempts: exam.max_attempts || 1,
          closeAfterDeadline: exam.close_after_deadline ?? true,
          gradingLogic: exam.grading_logic || 'highest',
          color: accentColors[index % accentColors.length],
          is_visible: exam.is_visible ?? true,
          references: Array.isArray(exam.references) ? exam.references : [] 
        };
      });
      setExams(formattedExams);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchFacultyExams();
    const interval = setInterval(() => { fetchFacultyExams(); }, 15000);
    return () => clearInterval(interval);
  }, [fetchFacultyExams]);

  const activeTeacherCohorts = useMemo(() => {
    return teacherCohorts.filter(c => c.status === 'Active');
  }, [teacherCohorts]);

  const fetchExamQuestions = React.useCallback(async () => {
    if (!selectedExam) return;
    const { data } = await supabase
      .from('Mock Exam Items')
      .select('*')
      .eq('exam_session_id', selectedExam)
      .order('created_at', { ascending: true });

    if (data) {
      const formattedQuestions = data.map(q => {
        let parsedOptions: string[] = [];
        let mappedAnswer = String(q.correct_answer || '').trim();

        try {
          let raw = q.options;
          while (typeof raw === 'string') raw = JSON.parse(raw);

          if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
            parsedOptions = Object.values(raw).map(opt => String(opt));
            if (raw[mappedAnswer.toUpperCase()]) {
              mappedAnswer = String(raw[mappedAnswer.toUpperCase()]);
            }
          } else if (Array.isArray(raw)) {
            parsedOptions = raw.map(opt => String(opt));
            if (mappedAnswer.length === 1 && /^[A-Z]$/i.test(mappedAnswer)) {
              const charIdx = mappedAnswer.toUpperCase().charCodeAt(0) - 65;
              if (parsedOptions[charIdx]) mappedAnswer = parsedOptions[charIdx];
            }
          }
        } catch (e) {
          parsedOptions = [];
        }

        return {
          id: q.id,
          topic: q.competency || q.subject || 'General Scope',
          question: q.question || '',
          options: parsedOptions.length > 0 ? parsedOptions : ['A', 'B', 'C', 'D'],
          answer: mappedAnswer,
          status: q.status || 'PASSED',
          rationale: q.rationale || 'No rationale provided.',
          citation: formatCitations(q.citations)
        };
      });
      setAiQuestions(formattedQuestions);
    }
  }, [selectedExam]);

  useEffect(() => {
    fetchExamQuestions();
  }, [fetchExamQuestions]);

  const availableCompetencies = useMemo(() => {
    const set = new Set<string>();
    aiQuestions.forEach(q => {
      if (q.topic) set.add(q.topic);
    });
    return Array.from(set);
  }, [aiQuestions]);

  // Fetch Gradebook Analytics with Silent Background Refresh
  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      if (!selectedExam || examTab !== 'gradebook') return;

      // Only display the loading row if data hasn't been loaded yet for this exam
      if (!hasLoadedAnalyticsRef.current) {
        setIsFetchingAnalytics(true);
      }

      const currentExamConfig = exams.find(e => e.id === selectedExam);
      const gradingRule = currentExamConfig?.gradingLogic || 'highest';
      const totalItems = currentExamConfig?.items || 0;

      // 1. Fetch Students belonging to this exam's cohort
      const cohortId = currentExamConfig?.cohortId;
      let students: any[] = [];
      if (cohortId) {
        const { data: studentData } = await supabase
          .from('Users')
          .select('user_id, name, cohort_id')
          .eq('cohort_id', cohortId);
        students = studentData || [];
      }

      // 2. Fetch Exam Items
      const { data: rawItems } = await supabase
        .from('Mock Exam Items')
        .select('id, subject, competency, correct_answer, options')
        .eq('exam_session_id', selectedExam);

      const questionDefs: QuestionDefinition[] = (rawItems || []).map(q => ({
        id: q.id,
        subject: q.subject || currentExamConfig?.target || 'General Scope',
        competency: q.competency || 'General Competency',
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: q.correct_answer || ''
      }));

      // 3. Fetch Student Attempts and Answers
      const { data: attemptsData } = await supabase
        .from('Student Attempts')
        .select('*')
        .eq('exam_id', selectedExam)
        .order('completed_at', { ascending: true });

      const attemptIds = (attemptsData || []).map(a => a.attempt_id);
      let answersData: any[] = [];
      if (attemptIds.length > 0) {
        const { data: ans } = await supabase
          .from('Student Answers')
          .select('attempt_id, question_id, is_correct, selected_option')
          .in('attempt_id', attemptIds);
        answersData = ans || [];
      }

      // 4. Merge Student Data
      const mergedData = students.map(st => {
        const studentAttempts = (attemptsData || []).filter(a => a.student_id === st.user_id);
        const completedAttempts = studentAttempts.filter(a => a.exam_status?.toLowerCase() === 'completed');
        const isCompleted = completedAttempts.length > 0;

        let calculatedGradeDisplay: string = 'Pending';
        let calculatedRawScore = 0;
        let calculatedPercentage = 0;

        const attemptsToEvaluate = completedAttempts.length > 0 ? completedAttempts : studentAttempts;

        if (attemptsToEvaluate.length > 0) {
          const attemptEvaluations = attemptsToEvaluate.map(att => {
            const attAnswers = (answersData || [])
              .filter(ans => ans.attempt_id === att.attempt_id)
              .map(ans => ({
                questionId: ans.question_id,
                isCorrect: ans.is_correct
              }));

            const tosResult = calculateTOSScoring(questionDefs, attAnswers);
            return {
              rawScore: tosResult.rawScore,
              percentage: tosResult.rawPercentage
            };
          });

          if (gradingRule === 'highest') {
            const best = attemptEvaluations.reduce((prev, curr) => 
              curr.percentage > prev.percentage ? curr : prev, 
              attemptEvaluations[0]
            );
            calculatedRawScore = best.rawScore;
            calculatedPercentage = best.percentage;
          } else if (gradingRule === 'latest') {
            const latest = attemptEvaluations[attemptEvaluations.length - 1];
            calculatedRawScore = latest.rawScore;
            calculatedPercentage = latest.percentage;
          } else if (gradingRule === 'average') {
            const avgRaw = Math.round(attemptEvaluations.reduce((acc, curr) => acc + curr.rawScore, 0) / attemptEvaluations.length);
            const avgPct = Math.round(attemptEvaluations.reduce((acc, curr) => acc + curr.percentage, 0) / attemptEvaluations.length);
            calculatedRawScore = avgRaw;
            calculatedPercentage = avgPct;
          }
          calculatedGradeDisplay = `${calculatedRawScore} / ${totalItems} (${calculatedPercentage}%)`;
        }

        return {
          id: st.user_id,
          name: st.name,
          cohortId: st.cohort_id,
          status: studentAttempts.length > 0 ? (isCompleted ? 'Completed' : 'In Progress') : 'Not Taken',
          attempts: studentAttempts,
          rawScore: calculatedRawScore,
          percentage: calculatedPercentage,
          grade: calculatedGradeDisplay
        };
      });

      if (isMounted) {
        setStudentAnalytics(mergedData);
        hasLoadedAnalyticsRef.current = true;
        setIsFetchingAnalytics(false);
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [selectedExam, examTab, exams]);

  // Fetch Question Analytics with Silent Background Refresh
  useEffect(() => {
    let isMounted = true;

    const fetchQuestionAnalytics = async () => {
      if (!selectedExam || examTab !== 'question_analytics') return;
      if (!hasLoadedQuestionAnalyticsRef.current) {
        setIsFetchingAnalytics(true);
      }

      const { data: questions } = await supabase
        .from('Mock Exam Items')
        .select('*')
        .eq('exam_session_id', selectedExam);

      if (!questions || questions.length === 0) {
        if (isMounted) {
          setQuestionAnalytics([]);
          setIsFetchingAnalytics(false);
        }
        return;
      }

      const { data: attempts } = await supabase
        .from('Student Attempts')
        .select('attempt_id, student_id, final_score, exam_status')
        .eq('exam_id', selectedExam);

      const allAttempts = attempts || [];
      const completedAttempts = allAttempts.filter(
        a => a.exam_status?.toLowerCase() === 'completed'
      );
      const safeAttempts = completedAttempts.length > 0 ? completedAttempts : allAttempts;
      const attemptIds = safeAttempts.map(a => a.attempt_id);

      let safeAnswers: any[] = [];
      if (attemptIds.length > 0) {
        const { data: answers } = await supabase
          .from('Student Answers')
          .select('attempt_id, question_id, selected_option, is_correct')
          .in('attempt_id', attemptIds);
        safeAnswers = answers || [];
      }

      const currentEx = exams.find(e => e.id === selectedExam);
      const gradingRule = currentEx?.gradingLogic || 'highest';
      const studentAttemptsGrouped: Record<string, any[]> = {};
      
      safeAttempts.forEach(att => {
        if (!studentAttemptsGrouped[att.student_id]) {
          studentAttemptsGrouped[att.student_id] = [];
        }
        studentAttemptsGrouped[att.student_id].push(att);
      });

      const qualifyingAttempts: any[] = [];
      if (analyticsAttemptBasis === 'all') {
        qualifyingAttempts.push(...safeAttempts);
      } else {
        Object.values(studentAttemptsGrouped).forEach(attemptsList => {
          if (analyticsAttemptBasis === 'first') {
            qualifyingAttempts.push(attemptsList[0]);
          } else {
            if (gradingRule === 'highest') {
              const best = attemptsList.reduce((prev, curr) => 
                (curr.final_score || 0) > (prev.final_score || 0) ? curr : prev, attemptsList[0]
              );
              qualifyingAttempts.push(best);
            } else {
              qualifyingAttempts.push(attemptsList[attemptsList.length - 1]);
            }
          }
        });
      }

      const attemptScoreMap: Record<string, StudentAttemptScore> = {};
      qualifyingAttempts.forEach(att => {
        attemptScoreMap[att.attempt_id] = {
          studentId: att.student_id,
          totalScore: att.final_score || 0,
          answers: []
        };
      });

      safeAnswers.forEach(ans => {
        if (attemptScoreMap[ans.attempt_id]) {
          attemptScoreMap[ans.attempt_id].answers.push({
            questionId: ans.question_id,
            selectedOption: ans.selected_option || '',
            isCorrect: ans.is_correct || false
          });
        }
      });

      const attemptScoresList = Object.values(attemptScoreMap);

      const analyticsResults = questions.map((q) => {
        let parsedOptions: string[] = [];
        let mappedCorrectAnswer = String(q.correct_answer || '').trim();

        try {
          let raw = q.options;
          while (typeof raw === 'string') raw = JSON.parse(raw);
          if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
            parsedOptions = Object.values(raw).map(opt => String(opt));
            if (raw[mappedCorrectAnswer.toUpperCase()]) {
              mappedCorrectAnswer = String(raw[mappedCorrectAnswer.toUpperCase()]);
            }
          } else if (Array.isArray(raw)) {
            parsedOptions = raw.map(opt => String(opt));
            if (mappedCorrectAnswer.length === 1 && /^[A-Z]$/i.test(mappedCorrectAnswer)) {
              const charIdx = mappedCorrectAnswer.toUpperCase().charCodeAt(0) - 65;
              if (parsedOptions[charIdx]) mappedCorrectAnswer = parsedOptions[charIdx];
            }
          }
        } catch (e) {
          parsedOptions = [];
        }

        const qDef: QuestionDefinition = {
          id: q.id,
          subject: q.subject || 'General Scope',
          competency: q.competency || 'General Competency',
          options: parsedOptions,
          correctAnswer: mappedCorrectAnswer
        };

        const ctt: ItemAnalysisResult = calculateItemAnalysis(qDef, attemptScoresList);

        const resolvedOptions = (ctt.distractors && ctt.distractors.length > 0)
          ? ctt.distractors.map(d => ({
              text: d.optionText,
              count: d.count,
              percent: Math.round(d.selectionRate * 100),
              isCorrect: d.isCorrect,
              isNonFunctional: d.isNonFunctional
            }))
          : parsedOptions.map(opt => ({
              text: opt,
              count: 0,
              percent: 0,
              isCorrect: normalizeForComparison(opt) === normalizeForComparison(mappedCorrectAnswer),
              isNonFunctional: false
            }));

        return {
          id: q.id,
          question: q.question,
          topic: q.competency || q.subject || 'General Scope',
          options: resolvedOptions,
          totalAnswers: attemptScoresList.length,
          facilityIndex: ctt.facilityIndex,
          discriminationIndex: ctt.discriminationIndex,
          facilityLabel: ctt.facilityLabel,
          discriminationLabel: ctt.discriminationLabel,
          status: ctt.status,
          statusMessage: ctt.statusMessage
        };
      });

      if (isMounted) {
        if (attemptScoresList.length >= 4 && questions.length > 1) {
          const itemFacilities = analyticsResults.map(r => r.facilityIndex);
          const studentTotals = attemptScoresList.map(a => a.totalScore);
          const kr20 = calculateKR20Reliability(questions.length, itemFacilities, studentTotals);
          setKr20Reliability(kr20);
        } else {
          setKr20Reliability(null);
        }

        setQuestionAnalytics(analyticsResults);
        hasLoadedQuestionAnalyticsRef.current = true;
        setIsFetchingAnalytics(false);
      }
    };

    fetchQuestionAnalytics();

    return () => {
      isMounted = false;
    };
  }, [selectedExam, examTab, analyticsAttemptBasis, exams]);

  const currentExam = exams.find(e => e.id === selectedExam);
  
  const isValidationMode = currentExam?.status === 'Pending';
  const isReadOnly = currentExam?.status === 'Active' || currentExam?.status === 'Inactive';

  const pendingQuestions = aiQuestions.filter(q => q.status === 'PASSED' || q.status === 'FLAGGED_FOR_MANUAL_REVIEW');
  const approvedQuestions = aiQuestions.filter(q => q.status === 'APPROVED');
  
  const visibleQuestions = useMemo(() => {
    let list = isValidationMode 
      ? (validationTab === 'pending' ? pendingQuestions : approvedQuestions) 
      : aiQuestions;

    if (selectedCompetencyFilter !== 'All') {
      list = list.filter(q => q.topic === selectedCompetencyFilter);
    }
    return list;
  }, [isValidationMode, validationTab, pendingQuestions, approvedQuestions, aiQuestions, selectedCompetencyFilter]);

  const filteredQuestionAnalytics = useMemo(() => {
    if (selectedCompetencyFilter === 'All') return questionAnalytics;
    return questionAnalytics.filter(qa => qa.topic === selectedCompetencyFilter);
  }, [questionAnalytics, selectedCompetencyFilter]);

  // --- ITEM ANALYSIS EXPORT HANDLERS ---
  const handleExportItemAnalysisCSV = () => {
    if (!questionAnalytics || questionAnalytics.length === 0) {
      addToast('No item analysis data available to export.', 'error');
      return;
    }

    const rows = questionAnalytics.map((qa, idx) => {
      const correctOpt = qa.options.find((o: any) => o.isCorrect);
      const nfdOpts = qa.options
        .filter((o: any) => o.isNonFunctional)
        .map((o: any) => o.text)
        .join('; ');

      return {
        'Item Number': idx + 1,
        'Question Prompt': qa.question,
        'Competency Cluster': qa.topic,
        'Examinees Evaluated': qa.totalAnswers,
        'Facility Index (P)': qa.facilityIndex,
        'Facility Classification': qa.facilityLabel,
        'Discrimination Index (D)': qa.discriminationIndex,
        'Discrimination Classification': qa.discriminationLabel,
        'Psychometric Status': qa.status,
        'Diagnostic Message': qa.statusMessage,
        'Correct Answer Key': correctOpt ? correctOpt.text : 'N/A',
        'Non-Functional Distractors (<5%)': nfdOpts || 'None'
      };
    });

    const safeTitle = (currentExam?.title || 'Exam').replace(/\s+/g, '_');
    exportToCSV(`${safeTitle}_Item_Analysis`, rows);
    setIsItemExportOpen(false);
    addToast('Item Analysis exported to CSV.', 'success');
  };

  const handleExportItemAnalysisXLSX = () => {
    if (!questionAnalytics || questionAnalytics.length === 0) {
      addToast('No item analysis data available to export.', 'error');
      return;
    }

    const totalExaminees = questionAnalytics[0]?.totalAnswers || 0;
    const meanP = Number(
      (questionAnalytics.reduce((acc, q) => acc + q.facilityIndex, 0) / questionAnalytics.length).toFixed(3)
    );
    const meanD = Number(
      (questionAnalytics.reduce((acc, q) => acc + q.discriminationIndex, 0) / questionAnalytics.length).toFixed(3)
    );

    const summaryData = [
      { Metric: 'Exam Title', Value: currentExam?.title || 'N/A' },
      { Metric: 'Target Subject Domain', Value: currentExam?.target || 'N/A' },
      { Metric: 'Assigned Batch / Cohort', Value: currentExam?.cohortName || 'N/A' },
      { Metric: 'Total Questions Evaluated', Value: questionAnalytics.length },
      { Metric: 'Total Examinees Scored', Value: totalExaminees },
      { Metric: 'Attempt Evaluation Rule', Value: analyticsAttemptBasis },
      { Metric: 'KR-20 Reliability Coefficient', Value: kr20Reliability !== null ? kr20Reliability : 'Insufficient data (<4 examinees)' },
      { Metric: 'Mean Facility Index (P)', Value: meanP },
      { Metric: 'Mean Discrimination Index (D)', Value: meanD },
      { Metric: 'Report Generation Timestamp', Value: new Date().toLocaleString() }
    ];

    const itemsData = questionAnalytics.map((qa, idx) => ({
      'Item #': idx + 1,
      'Question Prompt': qa.question,
      'Competency Cluster': qa.topic,
      'Examinee Responses': qa.totalAnswers,
      'Facility Index (P)': qa.facilityIndex,
      'Difficulty Classification': qa.facilityLabel,
      'Discrimination Index (D)': qa.discriminationIndex,
      'Discrimination Classification': qa.discriminationLabel,
      'Diagnostic Flag': qa.status,
      'Psychometric Feedback': qa.statusMessage
    }));

    const distractorData: any[] = [];
    questionAnalytics.forEach((qa, idx) => {
      qa.options.forEach((opt: any, optIdx: number) => {
        distractorData.push({
          'Item #': idx + 1,
          'Option Letter': String.fromCharCode(65 + optIdx),
          'Option Text': opt.text,
          'Selection Count': opt.count,
          'Selection Percentage': `${opt.percent}%`,
          'Answer Key': opt.isCorrect ? 'CORRECT KEY' : 'DISTRACTOR',
          'Non-Functional Distractor': opt.isNonFunctional ? 'YES (NFD <5%)' : 'NO (Functional)'
        });
      });
    });

    const safeTitle = (currentExam?.title || 'Exam').replace(/\s+/g, '_');
    exportToXLSX(`${safeTitle}_Item_Analysis`, [
      { sheetName: 'Test Summary & KR-20', data: summaryData },
      { sheetName: 'Item Analysis Matrix', data: itemsData },
      { sheetName: 'Distractor Diagnostics', data: distractorData }
    ]);

    setIsItemExportOpen(false);
    addToast('Item Analysis workbook exported to XLSX.', 'success');
  };

  const handleExportItemAnalysisPDF = () => {
    if (!questionAnalytics || questionAnalytics.length === 0) {
      addToast('No item analysis data available to export.', 'error');
      return;
    }

    const totalExaminees = questionAnalytics[0]?.totalAnswers || 0;
    const meanP = Number(
      (questionAnalytics.reduce((acc, q) => acc + q.facilityIndex, 0) / questionAnalytics.length).toFixed(3)
    );
    const meanD = Number(
      (questionAnalytics.reduce((acc, q) => acc + q.discriminationIndex, 0) / questionAnalytics.length).toFixed(3)
    );

    const pdfPayload = {
      examTitle: currentExam?.title || 'Mock Examination',
      subject: currentExam?.target || 'General Scope',
      cohortName: currentExam?.cohortName || 'Active Cohort',
      generatedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      metrics: {
        totalExaminees,
        totalItems: questionAnalytics.length,
        kr20Reliability: kr20Reliability ?? 0,
        meanFacilityIndex: meanP,
        meanDiscriminationIndex: meanD
      },
      items: questionAnalytics.map((qa, idx) => ({
        itemNumber: idx + 1,
        questionText: qa.question || '',
        domain: currentExam?.target || 'General Scope',
        competency: qa.topic || 'General Competency',
        facilityIndex: qa.facilityIndex || 0,
        discriminationIndex: qa.discriminationIndex || 0,
        status: qa.status || 'ACCEPTABLE'
      }))
    };

    const safeTitle = (currentExam?.title || 'Exam').replace(/\s+/g, '_');
    exportItemAnalysisPDF(`${safeTitle}_Item_Analysis`, pdfPayload);
    setIsItemExportOpen(false);
    addToast('Psychometric Item Audit exported to PDF.', 'success');
  };

  const handleOpenSettings = (exam: FacultyExam) => {
    if (exam.status === 'Generating') return;
    setSelectedExam(exam.id);
    setSelectedStudentForReview(null);
    setEditSelectedCohort(exam.cohortId || '');
    setSelectedCompetencyFilter('All');
    setEditExamStatus(exam.status);
    setEditIsVisible(exam.status === 'Pending' ? false : exam.is_visible);
    setExamTab('settings');
  };

  const handleOpenQuestionsOrResults = (exam: FacultyExam) => {
    if (exam.status === 'Generating') return;
    setSelectedExam(exam.id);
    setSelectedStudentForReview(null);
    setEditSelectedCohort(exam.cohortId || '');
    setSelectedCompetencyFilter('All');

    if (exam.status === 'Inactive') {
      setExamTab('question_analytics');
    } else {
      setExamTab('questions');
    }
  };

  const handleOpenGradebook = (exam: FacultyExam) => {
    if (exam.status === 'Generating' || exam.status === 'Pending') return;
    setSelectedExam(exam.id);
    setSelectedStudentForReview(null);
    setEditSelectedCohort(exam.cohortId || '');
    setSelectedCompetencyFilter('All');
    setStudentPage(1);
    setExamTab('gradebook');
  };

  // --- Exam Duplication / Clone Workflow ---
  const handleOpenDuplicateModal = (exam: FacultyExam) => {
    setDuplicateModalExam(exam);
    setDuplicateTitle(`${exam.title} (Clone)`);
    const alternativeCohort = allActiveCohorts.find(c => c.id !== exam.cohortId);
    setDuplicateTargetCohort(alternativeCohort ? alternativeCohort.id : (exam.cohortId || allActiveCohorts[0]?.id || ''));
    setDuplicateStartDate(exam.scheduleStart || '');
    setDuplicateEndDate(exam.scheduleEnd || '');
  };

  const executeDuplicateToCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateModalExam || !duplicateTargetCohort) {
      addToast('Please select a target cohort for duplication.', 'error');
      return;
    }

    setIsDuplicating(true);

    try {
      const startUTC = localToUTC(duplicateStartDate);
      const endUTC = localToUTC(duplicateEndDate);

      const { data: newExam, error: examError } = await supabase
        .from('Exams')
        .insert([{
          exam_title: duplicateTitle,
          exam_subject: duplicateModalExam.target,
          schedule_start: startUTC,
          schedule_end: endUTC,
          passing_score: duplicateModalExam.passingScore,
          passing_percentage: duplicateModalExam.passingScore,
          time_limit_mins: duplicateModalExam.timeLimit,
          global_status: duplicateModalExam.status === 'Pending' ? 'Pending' : 'Active',
          max_attempts: duplicateModalExam.maxAttempts,
          grading_logic: duplicateModalExam.gradingLogic,
          close_after_deadline: duplicateModalExam.closeAfterDeadline,
          is_visible: false,
          references: duplicateModalExam.references?.length ? duplicateModalExam.references : [] 
        }])
        .select()
        .single();

      if (examError || !newExam) throw new Error(examError?.message || 'Failed to create cloned exam.');

      const { error: linkError } = await supabase
        .from('Exam_Cohorts')
        .insert([{ exam_id: newExam.exam_id, cohort_id: duplicateTargetCohort }]);

      if (linkError) throw new Error(linkError.message);

      const { data: sourceItems, error: itemsFetchError } = await supabase
        .from('Mock Exam Items')
        .select('*')
        .eq('exam_session_id', duplicateModalExam.id);

      if (itemsFetchError) throw new Error(itemsFetchError.message);

      if (sourceItems && sourceItems.length > 0) {
        const clonedItems = sourceItems.map((item: any) => ({
          exam_session_id: newExam.exam_id,
          question: item.question,
          options: item.options,
          correct_answer: item.correct_answer,
          rationale: item.rationale,
          citations: item.citations,
          status: item.status || 'APPROVED',
          competency: item.competency,
          subject: item.subject
        }));

        const { error: itemsInsertError } = await supabase
          .from('Mock Exam Items')
          .insert(clonedItems);

        if (itemsInsertError) throw new Error(itemsInsertError.message);
      }

      addToast(`Exam successfully duplicated to target cohort! (Created as Hidden)`, 'success');
      setDuplicateModalExam(null);
      await fetchFacultyExams();
    } catch (err: any) {
      addToast(err.message || 'Duplication failed.', 'error');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedExam) return;

    if (!editSelectedCohort) {
      addToast('You must select an active cohort for this exam.', 'error');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const rawScheduleStart = formData.get('scheduleStart') as string;
    const rawScheduleEnd = formData.get('scheduleEnd') as string;
    const timeLimit = Number(formData.get('timeLimit'));
    const status = formData.get('status') as string;
    
    const isVisible = status === 'Pending' ? false : formData.get('isVisible') === 'true';

    const maxAttempts = Number(formData.get('maxAttempts'));
    const gradingLogic = formData.get('gradingLogic') as string;
    const closeAfterDeadline = formData.get('closeAfterDeadline') === 'on';

    const scheduleStartUTC = localToUTC(rawScheduleStart);
    const scheduleEndUTC = localToUTC(rawScheduleEnd);

    const { error } = await supabase
      .from('Exams')
      .update({
        exam_title: title,
        schedule_start: scheduleStartUTC,
        schedule_end: scheduleEndUTC,
        time_limit_mins: timeLimit,
        global_status: status,
        max_attempts: maxAttempts,
        grading_logic: gradingLogic,
        close_after_deadline: closeAfterDeadline,
        is_visible: isVisible
      })
      .eq('exam_id', selectedExam);

    if (error) {
      addToast(`Error saving settings: ${error.message}`, 'error');
      return;
    }

    const { error: deleteError } = await supabase.from('Exam_Cohorts').delete().eq('exam_id', selectedExam);
    if (!deleteError) {
      await supabase.from('Exam_Cohorts').insert([{ exam_id: selectedExam, cohort_id: editSelectedCohort }]);
    }

    const newStartDateStr = scheduleStartUTC ? new Date(scheduleStartUTC).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Date';
    const newEndDateStr = scheduleEndUTC ? new Date(scheduleEndUTC).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Date';
    const targetCohortObj = teacherCohorts.find(c => c.id === editSelectedCohort);

    setExams(prev => prev.map(ex => ex.id === selectedExam ? {
      ...ex,
      title,
      scheduleStart: rawScheduleStart,
      scheduleEnd: rawScheduleEnd,
      timeLimit,
      status,
      is_visible: isVisible,
      startDateStr: newStartDateStr,
      endDateStr: newEndDateStr,
      maxAttempts,
      gradingLogic,
      closeAfterDeadline,
      cohortId: editSelectedCohort,
      cohortName: targetCohortObj?.name || 'Assigned Cohort',
      cohortStatus: targetCohortObj?.status || 'Active',
      cohortIds: [editSelectedCohort],
      cohorts: [targetCohortObj?.name || 'Assigned Cohort']
    } : ex));
    
    addToast('Exam settings & cohort assignment successfully updated.', 'success');
  };

  const exportGradebookCSV = () => {
    if (!filteredStudents || filteredStudents.length === 0) {
      addToast('No gradebook analytics to export.', 'error');
      return;
    }
    const headers = ['Student Name', 'Cohort', 'Status', 'Score (%)', 'Attempts', 'Latest Date Taken'];
    const rows = filteredStudents.map(s => {
      const cohortName = currentExam?.cohortName || 'General';
      const latestAttempt = s.attempts && s.attempts.length > 0 ? s.attempts[s.attempts.length - 1] : null;
      const dateTaken = latestAttempt?.completed_at ? new Date(latestAttempt.completed_at).toLocaleString() : 'Pending';
      return [
        `"${s.name}"`,
        `"${cohortName}"`,
        `"${s.status}"`,
        `"${s.grade}"`,
        `"${s.attempts?.length || 0}"`,
        `"${dateTaken}"`
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentExam?.title.replace(/\s+/g, '_')}_Gradebook.csv`;
    link.click();
  };

  // Detailed Student Attempt Review
  const handleViewStudent = async (student: any) => {
    setIsLoadingReview(true);

    if (!student.attempts || student.attempts.length === 0) {
      addToast('No attempts found for this student.', 'error');
      setIsLoadingReview(false);
      return;
    }

    const { data: rawItems } = await supabase
      .from('Mock Exam Items')
      .select('id, subject, competency, correct_answer, options, question, rationale')
      .eq('exam_session_id', selectedExam);

    const questionDefs: QuestionDefinition[] = (rawItems || []).map(q => ({
      id: q.id,
      subject: q.subject || currentExam?.target || 'General Scope',
      competency: q.competency || 'General Competency',
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: q.correct_answer || ''
    }));

    const formattedAttempts: AttemptRecord[] = await Promise.all(
      student.attempts.map(async (attempt: any) => {
        const { data: answersData } = await supabase
          .from("Student Answers")
          .select(`
            question_id,
            selected_option,
            is_correct,
            rag_feedback,
            "Mock Exam Items" ( question, competency, correct_answer, rationale, options )
          `)
          .eq("attempt_id", attempt.attempt_id);

        const items: StudentReviewItem[] = (answersData || []).map((ans, idx) => {
          const rawMockItem = ans["Mock Exam Items"];
          const mockItem = Array.isArray(rawMockItem) ? rawMockItem[0] : rawMockItem;
          
          let parsedOptions: string[] = [];
          let mappedCorrectAnswer = String(mockItem?.correct_answer || "N/A").trim();
          
          try {
            let raw = mockItem?.options;
            while (typeof raw === 'string') raw = JSON.parse(raw);
            if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
              parsedOptions = Object.values(raw).map(opt => String(opt));
              if (raw[mappedCorrectAnswer.toUpperCase()]) mappedCorrectAnswer = String(raw[mappedCorrectAnswer.toUpperCase()]);
            } else if (Array.isArray(raw)) {
              parsedOptions = raw.map(opt => String(opt));
              if (mappedCorrectAnswer.length === 1 && /^[A-Z]$/i.test(mappedCorrectAnswer)) {
                const charIdx = mappedCorrectAnswer.toUpperCase().charCodeAt(0) - 65;
                if (parsedOptions[charIdx]) mappedCorrectAnswer = parsedOptions[charIdx];
              }
            }
          } catch (e) {
            console.error("Failed to parse options for review", e);
          }

          const cleanCorrectAnswer = mappedCorrectAnswer.replace(/^["']|["']$/g, '').trim();
          const cleanStudentAnswer = String(ans.selected_option || "No Answer Selected").replace(/^["']|["']$/g, '').trim();

          return {
            qNum: idx + 1,
            text: mockItem?.question || "Question data unavailable",
            topic: mockItem?.competency || "General Competency",
            studentAnswer: cleanStudentAnswer,
            correctAnswer: cleanCorrectAnswer,
            isCorrect: ans.is_correct,
            explanation: mockItem?.rationale || ans.rag_feedback || "No explanation provided for this item.",
            options: parsedOptions,
          };
        });

        const ansList = (answersData || []).map(a => ({ questionId: a.question_id, isCorrect: a.is_correct }));
        const tosResult = calculateTOSScoring(questionDefs, ansList);

        const weakList = Object.values(tosResult.competencyBreakdown)
          .filter(c => c.needsRemediation)
          .map(c => ({ topic: c.competency, accuracy: c.accuracy }));

        const rawScore = items.filter(i => i.isCorrect).length;
        const maxScore = items.length;
        const scorePercentage = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;

        return {
          attemptId: attempt.attempt_id,
          score: attempt.final_score || 0,
          rawScore,
          maxScore,
          scorePercentage,
          status: attempt.exam_status,
          takenAt: attempt.completed_at,
          items: items,
          weakCompetencies: weakList
        };
      })
    );

    const gradingRule = currentExam?.gradingLogic || 'highest';
    let defaultIndex = Math.max(0, formattedAttempts.length - 1);

    if (gradingRule === 'highest' && formattedAttempts.length > 0) {
      let highestScore = -1;
      formattedAttempts.forEach((att, idx) => {
        if (att.scorePercentage > highestScore) {
          highestScore = att.scorePercentage;
          defaultIndex = idx;
        }
      });
    }

    setSelectedStudentForReview({
      name: student.name,
      attempts: formattedAttempts
    });
    setActiveAttemptIndex(defaultIndex);
    setIsLoadingReview(false);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Generating') return <span className="shrink-0 px-2 py-1 bg-blue-100 text-blue-800 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse border border-blue-200 shadow-sm">Generating AI...</span>;
    if (status === 'Active') return <span className="shrink-0 px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold uppercase tracking-wider">Active</span>;
    if (status === 'Pending') return <span className="shrink-0 px-2 py-1 bg-amber-100 text-amber-800 rounded text-[10px] font-bold uppercase tracking-wider">Draft</span>;
    if (status === 'Inactive') return <span className="shrink-0 px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider">Completed</span>;
    return <span className="shrink-0 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">{status}</span>;
  };

  const getAIStatusStyle = (status: string) => {
    if (status === 'PASSED') return 'bg-emerald-100 text-emerald-800';
    if (status === 'FLAGGED_FOR_MANUAL_REVIEW') return 'bg-amber-100 text-amber-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getAIStatusLabel = (status: string) => {
    if (status === 'PASSED') return 'High Confidence';
    if (status === 'FLAGGED_FOR_MANUAL_REVIEW') return 'Needs Manual Review';
    return 'Approved';
  };

  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestions(prev => prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]);
  };

  const selectGroup = (targetStatus?: string) => {
    const listToSelect = targetStatus
      ? aiQuestions.filter(q => q.status === targetStatus && validationTab === 'pending').map(q => q.id)
      : aiQuestions.filter(q => validationTab === 'pending').map(q => q.id);
    setSelectedQuestions(listToSelect);
  };

  const executeSingleApprove = async (id: string, makeActive: boolean) => {
    await supabase.from('Mock Exam Items').update({ status: 'APPROVED' }).eq('id', id);
    if (makeActive) {
      await supabase.from('Exams').update({ global_status: 'Active' }).eq('exam_id', selectedExam);
      setExams(prev => prev.map(ex => ex.id === selectedExam ? { ...ex, status: 'Active' } : ex));
    }
    setAiQuestions(prev => prev.map(q => q.id === id ? { ...q, status: 'APPROVED' } : q));
    addToast('Question approved.', 'success');
  };

  const handleSingleApprove = (id: string) => {
    if (pendingQuestions.length === 1 && pendingQuestions[0].id === id) {
      setPendingApprovalAction(() => () => executeSingleApprove(id, true));
      setShowActivationModal(true);
    } else {
      executeSingleApprove(id, false);
    }
  };

  const executeBatchApprove = async (makeActive: boolean) => {
    await supabase.from('Mock Exam Items').update({ status: 'APPROVED' }).in('id', selectedQuestions);
    if (makeActive) {
      await supabase.from('Exams').update({ global_status: 'Active' }).eq('exam_id', selectedExam);
      setExams(prev => prev.map(ex => ex.id === selectedExam ? { ...ex, status: 'Active' } : ex));
    }
    setAiQuestions(prev => prev.map(q => selectedQuestions.includes(q.id) ? { ...q, status: 'APPROVED' } : q));
    setSelectedQuestions([]);
    addToast(`${selectedQuestions.length} questions approved.`, 'success');
  };

  const handleBatchApprove = () => {
    const allPendingSelected = pendingQuestions.every(q => selectedQuestions.includes(q.id));
    if (allPendingSelected && selectedQuestions.length > 0) {
      setPendingApprovalAction(() => () => executeBatchApprove(true));
      setShowActivationModal(true);
    } else {
      executeBatchApprove(false);
    }
  };

  const executeManualEdit = async (formData: FormData, makeActive: boolean) => {
    if (!editingItem) return;
    const updatedOptions = [
      formData.get('opt0') as string,
      formData.get('opt1') as string,
      formData.get('opt2') as string,
      formData.get('opt3') as string,
    ];
    const questionText = formData.get('question') as string;
    const answer = formData.get('answer') as string;

    await supabase.from('Mock Exam Items').update({
      question: questionText,
      options: JSON.stringify(updatedOptions),
      correct_answer: answer,
      status: 'APPROVED'
    }).eq('id', editingItem.id);

    if (makeActive) {
      await supabase.from('Exams').update({ global_status: 'Active' }).eq('exam_id', selectedExam);
      setExams(prev => prev.map(ex => ex.id === selectedExam ? { ...ex, status: 'Active' } : ex));
    }

    setAiQuestions(prev => prev.map(q => q.id === editingItem.id ? {
      ...q, question: questionText, options: updatedOptions, answer, status: 'APPROVED'
    } : q));

    setShowEditModal(false);
    setEditingItem(null);
    addToast('Question manually edited and updated.', 'success');
  };

  const saveManualEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const isLast = isValidationMode && pendingQuestions.length === 1 && pendingQuestions[0].id === editingItem?.id;
    if (isLast) {
      setPendingApprovalAction(() => () => executeManualEdit(formData, true));
      setShowActivationModal(true);
    } else {
      executeManualEdit(formData, false);
    }
  };

  const confirmRegeneration = (id: string) => {
    setQuestionToRegenerate(id);
    setShowRegenerateModal(true);
  };

  const executeRegeneration = async () => {
    if (!questionToRegenerate || !selectedExam) return;
    setShowRegenerateModal(false);

    const isOnline = await checkRegenerationHeartbeat();
    if (!isOnline) {
      addToast('AI Assessment Engine is unreachable. Ensure FastAPI and Celery are running.', 'error');
      return;
    }

    setRegeneratingItems(prev => [...prev, questionToRegenerate]);
    regenerateItem(questionToRegenerate, selectedExam);
  };

  useEffect(() => {
    if (regenStatus === 'SUCCESS') {
      fetchExamQuestions().then(() => {
        setRegeneratingItems([]);
        addToast('Replacement generated successfully.', 'success');
      });
    } else if (regenStatus === 'FAILURE') {
      setRegeneratingItems([]);
      addToast(regenProgress?.message || 'Failed to regenerate question.', 'error');
    }
  }, [regenStatus, fetchExamQuestions, regenProgress, addToast]);

  const handleRevokeApproval = async (id: string) => {
    const { error } = await supabase
      .from('Mock Exam Items')
      .update({ status: 'PASSED' })
      .eq('id', id);

    if (!error) {
      setAiQuestions(prev => prev.map(q => q.id === id ? { ...q, status: 'PASSED' } : q));
      addToast('Question moved back to pending review.', 'info');
    } else {
      addToast('Failed to revoke approval.', 'error');
    }
  };

  // --- DEDUPLICATED PULL FROM VAULT ---
  const handlePullFromVault = async (itemToReplace: ValidationItem) => {
    setRegeneratingItems(prev => [...prev, itemToReplace.id]);

    const { data, error } = await supabase
      .from('Mock Exam Items')
      .select('id, question, options, correct_answer, rationale, citations, exam_session_id')
      .eq('status', 'APPROVED')
      .eq('competency', itemToReplace.topic)
      .neq('id', itemToReplace.id)
      .neq('exam_session_id', selectedExam);

    if (error || !data || data.length === 0) {
      addToast('No other validated questions found in the vault for this competency.', 'error');
      setRegeneratingItems(prev => prev.filter(i => i !== itemToReplace.id));
      return;
    }

    const currentExamTexts = new Set(aiQuestions.map(q => q.question.trim().toLowerCase()));
    const availableCandidates = data.filter(
      item => !currentExamTexts.has(item.question.trim().toLowerCase())
    );

    if (availableCandidates.length === 0) {
      addToast('All vault questions for this competency already exist in this exam.', 'info');
      setRegeneratingItems(prev => prev.filter(i => i !== itemToReplace.id));
      return;
    }

    const uniqueVaultMap = new Map<string, any>();
    availableCandidates.forEach(item => {
      const normalized = item.question.trim().toLowerCase();
      if (!uniqueVaultMap.has(normalized)) {
        uniqueVaultMap.set(normalized, item);
      }
    });
    const uniqueCandidates = Array.from(uniqueVaultMap.values());

    const vaultItem = uniqueCandidates[Math.floor(Math.random() * uniqueCandidates.length)];
    const parsedOptions = parseOptionsArray(vaultItem.options);

    await supabase.from('Mock Exam Items').update({
      question: vaultItem.question,
      options: JSON.stringify(parsedOptions),
      correct_answer: vaultItem.correct_answer,
      rationale: vaultItem.rationale || 'Pulled from an archived validated exam.',
      citations: JSON.stringify(`Historical Exam Resource (Vault Item: ${vaultItem.id.slice(0,8)})`),
      status: isValidationMode ? 'PASSED' : 'APPROVED'
    }).eq('id', itemToReplace.id);

    setAiQuestions(prev => prev.map(q => q.id === itemToReplace.id ? {
      ...q,
      question: vaultItem.question,
      options: parsedOptions,
      answer: vaultItem.correct_answer,
      rationale: vaultItem.rationale || 'Pulled from an archived validated exam.',
      citation: `Historical Exam Resource (Vault Item: ${vaultItem.id.slice(0,8)})`,
      status: isValidationMode ? 'PASSED' : 'APPROVED'
    } : q));

    setRegeneratingItems(prev => prev.filter(i => i !== itemToReplace.id));
    addToast('Vault question loaded successfully.', 'success');
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(debouncedExamSearch.toLowerCase()) || exam.target.toLowerCase().includes(debouncedExamSearch.toLowerCase());
    const matchesStatus = examStatusFilter === 'All' || exam.status === examStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredStudents = useMemo(() => {
    return studentAnalytics.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(debouncedStudentSearch.toLowerCase());
      const matchesStatus = studentStatusFilter === 'All' || student.status === studentStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [studentAnalytics, debouncedStudentSearch, studentStatusFilter]);

  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
  const currentStudents = useMemo(() => {
    const start = (studentPage - 1) * STUDENTS_PER_PAGE;
    return filteredStudents.slice(start, start + STUDENTS_PER_PAGE);
  }, [filteredStudents, studentPage]);

  const handleStudentSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudentSearch(e.target.value);
    setStudentPage(1);
  };

  const handleStudentStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStudentStatusFilter(e.target.value);
    setStudentPage(1);
  };

  const getDifficultyBadge = (facility: number, label: string) => {
    let colorClass = 'bg-rose-100 text-rose-800';
    if (facility >= 0.70) colorClass = 'bg-blue-100 text-blue-800';
    else if (facility >= 0.40) colorClass = 'bg-emerald-100 text-emerald-800';
    else if (facility >= 0.25) colorClass = 'bg-amber-100 text-amber-800';

    return (
      <div className="relative group/p inline-block cursor-help">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colorClass}`}>
          Diff: {label} (P = {facility})
        </span>
        <div className="absolute right-0 top-full mt-1.5 hidden group-hover/p:block z-50 w-64 p-3 bg-slate-900 text-white text-[11px] font-normal normal-case rounded-lg shadow-xl pointer-events-none leading-relaxed text-left">
          <span className="font-bold text-amber-300 block mb-1">Facility Index (P) — Difficulty</span>
          <p className="text-slate-300 mb-1.5">Percentage of examinees answering correctly.</p>
          <div className="space-y-0.5 text-[10px]">
            <div><strong className="text-emerald-400">0.40 – 0.70:</strong> Ideal difficulty (optimal variance)</div>
            <div><strong className="text-blue-400">&ge; 0.70:</strong> Easy question</div>
            <div><strong className="text-rose-400">&lt; 0.25:</strong> Hard / Suspect (below chance)</div>
          </div>
        </div>
      </div>
    );
  };

  const getDiscriminationBadge = (d: number, label: string) => {
    let colorClass = 'bg-rose-100 text-rose-800';
    if (d >= 0.30) colorClass = 'bg-emerald-100 text-emerald-800';
    else if (d >= 0.20) colorClass = 'bg-blue-100 text-blue-800';
    else if (d >= 0.00) colorClass = 'bg-amber-100 text-amber-800';

    return (
      <div className="relative group/d inline-block cursor-help">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colorClass}`}>
          Disc: {label} (D = {d > 0 ? `+${d}` : d})
        </span>
        <div className="absolute right-0 top-full mt-1.5 hidden group-hover/d:block z-50 w-64 p-3 bg-slate-900 text-white text-[11px] font-normal normal-case rounded-lg shadow-xl pointer-events-none leading-relaxed text-left">
          <span className="font-bold text-blue-300 block mb-1">Discrimination Index (D) — Kelly&apos;s 27%</span>
          <p className="text-slate-300 mb-1.5">Separates top 27% scorers from bottom 27% scorers.</p>
          <div className="space-y-0.5 text-[10px]">
            <div><strong className="text-emerald-400">&ge; 0.30:</strong> Excellent separation power</div>
            <div><strong className="text-blue-400">0.20 – 0.29:</strong> Acceptable discrimination</div>
            <div><strong className="text-amber-400">0.00 – 0.19:</strong> Poor discrimination</div>
            <div><strong className="text-rose-400">&lt; 0.00:</strong> Flawed (inverted discrimination)</div>
          </div>
        </div>
      </div>
    );
  };

  if (selectedExam !== null && currentExam) {
    return (
      <div className="space-y-6 relative pb-24">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={handleBackToExams} 
            className="text-slate-500 hover:text-blue-600 font-bold text-sm flex items-center gap-1.5 transition-colors"
          >
            &larr; Back to Exams
          </button>
        </div>

        {/* Tab Header */}
        <div className="bg-slate-900 text-white rounded-t-xl flex gap-8 px-8 pt-5 border-b border-slate-700 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => { setExamTab('settings'); setSelectedStudentForReview(null); }} 
            className={`pb-4 border-b-2 text-sm font-bold whitespace-nowrap ${examTab === 'settings' ? 'border-blue-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Exam Settings
          </button>

          {currentExam.status === 'Inactive' ? (
            <button 
              onClick={() => { setExamTab('question_analytics'); setSelectedStudentForReview(null); }} 
              className={`pb-4 border-b-2 text-sm font-bold whitespace-nowrap ${examTab === 'question_analytics' ? 'border-blue-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              Question Analytics
            </button>
          ) : (
            <button
              onClick={() => { setExamTab('questions'); setSelectedStudentForReview(null); }}
              className={`pb-4 border-b-2 text-sm font-bold flex items-center gap-2 whitespace-nowrap ${examTab === 'questions' ? 'border-blue-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              {isValidationMode ? 'Question Validation' : 'View Questions'}
            </button>
          )}

          <button
            onClick={() => { 
              if (!isValidationMode) { 
                setExamTab('gradebook'); 
                setStudentPage(1); 
                setSelectedStudentForReview(null); 
              } 
            }}
            className={`pb-4 border-b-2 text-sm font-bold flex items-center gap-2 whitespace-nowrap ${examTab === 'gradebook' ? 'border-blue-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'} ${isValidationMode ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isValidationMode && <span>🔒</span>}
            Gradebook
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-b-xl p-8 shadow-sm min-h-[500px]">

          {/* EXAM SETTINGS TAB */}
          {examTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="max-w-4xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Edit Exam Details</h2>
                  <p className="text-sm text-slate-500 font-bold mt-1">
                    Manage availability, schedules, visibility, and cohort assignments for this assessment.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenDuplicateModal(currentExam)}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center gap-2 shrink-0 whitespace-nowrap"
                >
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Duplicate to Cohort
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Exam Title</label>
                    <input type="text" name="title" defaultValue={currentExam.title} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Target Subject</label>
                    <input type="text" defaultValue={currentExam.target} disabled className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-lg text-sm font-bold text-slate-500 cursor-not-allowed" />
                  </div>
                </div>

                {/* SINGLE COHORT ASSIGNMENT DROPDOWN */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Target Cohort Assignment
                  </label>
                  <select
                    name="cohortId"
                    value={editSelectedCohort}
                    onChange={(e) => setEditSelectedCohort(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    {currentExam.cohortStatus === 'Archived' && (
                      <option value={currentExam.cohortId} disabled>
                        {currentExam.cohortName} (Archived - Frozen Cohort)
                      </option>
                    )}
                    {activeTeacherCohorts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Active)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs font-bold text-slate-400 mt-1.5">
                    An exam instance maps to a single cohort. To deploy this exam to another batch, use &quot;Duplicate to Cohort&quot;.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Schedule Start</label>
                    <input type="datetime-local" name="scheduleStart" defaultValue={currentExam.scheduleStart} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Schedule End</label>
                    <input type="datetime-local" name="scheduleEnd" defaultValue={currentExam.scheduleEnd} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">Passing Score <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase tracking-wider">Locked</span></label>
                    <input type="number" defaultValue={currentExam.passingScore} disabled className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-lg text-sm font-bold text-slate-500 cursor-not-allowed" />
                    <p className="text-xs font-bold text-slate-400 mt-1">Recalculating passing scores after generation breaks analytics formatting.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Time Limit (Minutes)</label>
                    <input type="number" name="timeLimit" defaultValue={currentExam.timeLimit} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Max Attempts Allowed</label>
                    <input type="number" name="maxAttempts" min="1" max="10" defaultValue={currentExam.maxAttempts} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Final Score Grading Logic</label>
                    <select name="gradingLogic" defaultValue={currentExam.gradingLogic} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                      <option value="highest">Highest Attempt Score</option>
                      <option value="latest">Latest Attempt Score</option>
                      <option value="average">Average of All Attempts</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center mt-8">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="closeAfterDeadline" defaultChecked={currentExam.closeAfterDeadline} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-bold text-slate-700">Close After Deadline</span>
                    </label>
                  </div>
                </div>

                {/* LIFECYCLE & VISIBILITY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Exam Lifecycle Status</label>
                    <select 
                      name="status" 
                      value={editExamStatus} 
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setEditExamStatus(newStatus);
                        if (newStatus === 'Pending') {
                          setEditIsVisible(false);
                        }
                      }}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      {currentExam.status === 'Pending' && <option value="Pending">Draft (Questions need validation)</option>}
                      <option value="Active">Active (Available for learners)</option>
                      <option value="Inactive">Completed / Finished (Closed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                      <span>Learner Visibility</span>
                      {editExamStatus === 'Pending' && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          Locked to Hidden
                        </span>
                      )}
                    </label>
                    <select
                      name="isVisible"
                      value={editExamStatus === 'Pending' ? "false" : editIsVisible ? "true" : "false"}
                      onChange={(e) => setEditIsVisible(e.target.value === "true")}
                      disabled={editExamStatus === 'Pending'}
                      className={`w-full px-4 py-3 border rounded-lg text-sm font-bold focus:outline-none bg-white transition-colors ${
                        editExamStatus === 'Pending'
                          ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                          : 'border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                      }`}
                    >
                      <option value="true">Visible (Accessible across student dashboard)</option>
                      <option value="false">Hidden (Invisible to students)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                  <button type="submit" className="px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    Save Settings
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* VIEW QUESTIONS / VALIDATION TAB */}
          {examTab === 'questions' && (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="text-xl font-bold text-slate-800">
                    {isReadOnly ? 'Exam Questions' : 'Question Validation'}
                  </h2>
                  <p className="text-sm text-slate-500 font-bold mt-1">
                    {isReadOnly 
                      ? 'Review the items currently deployed in this active assessment.' 
                      : 'Review AI generated items and lock them into the final exam.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  {availableCompetencies.length > 0 && (
                    <select
                      value={selectedCompetencyFilter}
                      onChange={(e) => setSelectedCompetencyFilter(e.target.value)}
                      className="w-full sm:w-64 px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:border-blue-500"
                    >
                      <option value="All">All Competencies ({aiQuestions.length})</option>
                      {availableCompetencies.map(comp => (
                        <option key={comp} value={comp}>{comp}</option>
                      ))}
                    </select>
                  )}

                  {isValidationMode && (
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                      <button
                        onClick={() => { setValidationTab('pending'); setSelectedQuestions([]); }}
                        className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-md transition-all ${validationTab === 'pending' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Pending Review ({pendingQuestions.length})
                      </button>
                      <button
                        onClick={() => { setValidationTab('approved'); setSelectedQuestions([]); }}
                        className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-md transition-all ${validationTab === 'approved' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Approved Items ({approvedQuestions.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isValidationMode && validationTab === 'pending' && pendingQuestions.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-6 bg-slate-50 p-3 border border-slate-200 rounded-lg">
                  <button onClick={() => selectGroup('PASSED')} className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-white transition-colors shadow-sm">
                    Select High Confidence
                  </button>
                  <button onClick={() => selectGroup('FLAGGED_FOR_MANUAL_REVIEW')} className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-white transition-colors shadow-sm">
                    Select Needs Review
                  </button>
                  <button onClick={handleBatchApprove} disabled={selectedQuestions.length === 0} className="ml-auto px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    Batch Approve ({selectedQuestions.length})
                  </button>
                </div>
              )}

              <div className="space-y-6">
                {visibleQuestions.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <p className="text-slate-500 font-bold text-sm">No questions match your current view or filter.</p>
                  </div>
                ) : (
                  visibleQuestions.map((q, index) => {
                    const isProcessing = regeneratingItems.includes(q.id);
                    const isExpanded = !!expandedQuestionDetails[q.id];

                    return (
                      <div key={q.id} className={`relative p-6 border rounded-xl transition-colors ${selectedQuestions.includes(q.id) ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 bg-white'}`}>

                        {isProcessing && (
                          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-xl border border-blue-200">
                            <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span className="text-sm font-bold text-blue-900">
                              {regenProgress?.details || regenProgress?.message || 'Contacting RAG pipeline...'}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col md:flex-row justify-between items-start mb-5 pb-4 border-b border-slate-100 gap-4">
                          <div className="flex items-start gap-3 w-full">
                            {isValidationMode && validationTab === 'pending' && (
                              <input
                                type="checkbox"
                                checked={selectedQuestions.includes(q.id)}
                                onChange={() => toggleQuestionSelection(q.id)}
                                className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            )}
                            <span className="w-8 h-8 shrink-0 mt-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold border border-slate-200">
                              {index + 1}
                            </span>
                            <p className="text-base font-bold text-slate-900 leading-relaxed pt-1 w-full pr-4">{q.question}</p>
                          </div>
                          {isValidationMode && (
                            <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getAIStatusStyle(q.status)} border-current`}>
                              {getAIStatusLabel(q.status)}
                            </span>
                          )}
                        </div>

                        <div className="mb-4 md:ml-11">
                          <div className="space-y-3 mb-4">
                            {(Array.isArray(q.options) ? q.options : parseOptionsArray(q.options)).map((opt, idx) => (
                              <div key={idx} className={`p-4 border rounded-lg text-sm font-bold ${normalizeForComparison(opt) === normalizeForComparison(q.answer) ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-600'}`}>
                                <span className="mr-3 text-slate-400">{String.fromCharCode(65 + idx)}.</span>
                                {opt}
                                {normalizeForComparison(opt) === normalizeForComparison(q.answer) && <span className="ml-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">(Correct)</span>}
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => toggleQuestionDetails(q.id)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 py-1"
                            >
                              <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              <span>{isExpanded ? 'Hide' : 'View'} Question Details (Topic, Rationale, Sources)</span>
                            </button>

                            {isExpanded && (
                              <div className="grid grid-cols-1 gap-3 mt-4 animate-in fade-in duration-200">
                                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Competency / Topic</span>
                                  <p className="text-sm font-bold text-slate-900">{q.topic}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rationale</span>
                                  <p className="text-sm font-bold text-slate-900 leading-relaxed">{q.rationale}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sources</span>
                                  <p className="text-sm font-bold text-slate-900 leading-relaxed">{q.citation}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {!isReadOnly && (
                          <div className="flex flex-wrap gap-3 pt-5 border-t border-slate-100 md:ml-11">
                            {isValidationMode && validationTab === 'pending' ? (
                              <>
                                <button onClick={() => handleSingleApprove(q.id)} className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                                  Approve
                                </button>
                                <button onClick={() => { setEditingItem(q); setShowEditModal(true); }} className="px-5 py-2.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors shadow-sm">
                                  Edit Manually
                                </button>
                                <div className="ml-auto flex gap-3">
                                  <button onClick={() => handlePullFromVault(q)} className="px-5 py-2.5 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-sm flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    Pull from Vault
                                  </button>
                                  <button onClick={() => confirmRegeneration(q.id)} className="px-5 py-2.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-lg hover:bg-purple-200 transition-colors shadow-sm flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    Regenerate AI
                                  </button>
                                </div>
                              </>
                            ) : isValidationMode && validationTab === 'approved' ? (
                              <div className="flex gap-3 w-full justify-between items-center">
                                <button
                                  type="button"
                                  onClick={() => handleRevokeApproval(q.id)}
                                  className="px-4 py-2 bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors shadow-xs flex items-center gap-1.5"
                                >
                                  <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                  </svg>
                                  Revoke to Pending
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingItem(q); setShowEditModal(true); }}
                                  className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors shadow-xs"
                                >
                                  Edit Manually
                                </button>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* GRADEBOOK TAB */}
          {examTab === 'gradebook' && (
            <div>
              {isLoadingReview ? (
                <div className="p-16 text-center text-slate-500 font-bold flex flex-col items-center justify-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Loading student submission review...</span>
                </div>
              ) : selectedStudentForReview ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <button
                      onClick={() => setSelectedStudentForReview(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shrink-0"
                    >
                      ← Back to Gradebook
                    </button>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Student Assessment Review
                    </span>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 leading-none">{selectedStudentForReview.name}</h3>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                      <div className="relative w-full sm:w-auto sm:min-w-[260px] max-w-full">
                        <button
                          onClick={() => setIsReviewDropdownOpen(!isReviewDropdownOpen)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white flex justify-between items-center transition-colors hover:border-blue-400 shadow-sm max-w-full"
                        >
                          <span className="uppercase tracking-wider truncate mr-1">
                            ATTEMPT {activeAttemptIndex + 1}/{selectedStudentForReview.attempts.length} ({formatAttemptDate(selectedStudentForReview.attempts[activeAttemptIndex].takenAt).toUpperCase()})
                          </span>
                          <svg className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 text-slate-500 ${isReviewDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {isReviewDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsReviewDropdownOpen(false)}></div>
                            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2">
                              {selectedStudentForReview.attempts.map((att, idx) => {
                                const isSelected = activeAttemptIndex === idx;
                                const maxScore = Math.max(...selectedStudentForReview.attempts.map(a => a.scorePercentage));
                                const isGradedAttempt = currentExam?.gradingLogic === 'highest' 
                                  ? att.scorePercentage === maxScore 
                                  : currentExam?.gradingLogic === 'latest' 
                                  ? idx === selectedStudentForReview.attempts.length - 1 
                                  : false;

                                return (
                                  <div 
                                    key={idx}
                                    onClick={() => { setActiveAttemptIndex(idx); setIsReviewDropdownOpen(false); }}
                                    className={`flex justify-between items-center px-4 py-3 cursor-pointer transition-colors border-l-4 ${isSelected ? 'bg-blue-50 border-blue-600' : 'hover:bg-slate-50 border-transparent'}`}
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className={`text-sm font-bold flex items-center gap-2 ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                        <span>Attempt {idx + 1}</span>
                                        {isGradedAttempt && (
                                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded shrink-0">
                                            ★ Graded
                                          </span>
                                        )}
                                      </div>
                                      <div className={`text-xs font-bold mt-0.5 truncate ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>Submitted {formatAttemptDate(att.takenAt)}</div>
                                    </div>
                                    <div className="flex gap-2 items-center shrink-0">
                                      <span className="text-xs font-bold text-slate-500">{att.rawScore}/{att.maxScore}</span>
                                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                                        {att.scorePercentage}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-center w-full sm:w-auto sm:min-w-[130px]">
                        <span className="text-xl font-black text-blue-600 block leading-none">
                          {selectedStudentForReview.attempts[activeAttemptIndex].rawScore} / {selectedStudentForReview.attempts[activeAttemptIndex].maxScore}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1 block">
                          Score: {selectedStudentForReview.attempts[activeAttemptIndex].scorePercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Weak Areas Card */}
                  {selectedStudentForReview.attempts[activeAttemptIndex].weakCompetencies.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                        <span>⚠️</span>
                        <span>Areas Requiring Remedial Attention (&lt; 60% Accuracy):</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudentForReview.attempts[activeAttemptIndex].weakCompetencies.map((w, idx) => (
                          <span key={idx} className="px-3 py-1 bg-white border border-amber-200 text-amber-800 text-xs font-bold rounded-lg shadow-sm">
                            {w.topic}: <span className="text-rose-600">{w.accuracy}%</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question Review List */}
                  <div className="grid gap-6 w-full max-w-full">
                    {selectedStudentForReview.attempts[activeAttemptIndex].items.map((item) => (
                      <div
                        key={item.qNum}
                        className={`p-3 sm:p-6 border rounded-xl bg-white shadow-sm flex flex-col gap-3 border-l-4 transition-all w-full max-w-full overflow-hidden ${
                          item.isCorrect ? 'border-l-emerald-500' : 'border-l-rose-500'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2 w-full max-w-full">
                          <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
                            <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold border border-slate-200 shrink-0 mt-0.5">
                              {item.qNum}
                            </span>
                            <p className="text-base font-bold text-slate-900 leading-relaxed break-words flex-1 min-w-0">{item.text}</p>
                          </div>
                          <span className={`shrink-0 self-start sm:self-auto px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {item.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                        </div>

                        <div className="space-y-2 w-full max-w-full">
                          {item.options.map((opt, i) => {
                            const isSelected = normalizeForComparison(opt) === normalizeForComparison(item.studentAnswer);
                            const isCorrect = normalizeForComparison(opt) === normalizeForComparison(item.correctAnswer);

                            let baseStyle = 'p-3 border rounded-lg text-sm font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors w-full max-w-full ';

                            if (isSelected && isCorrect) {
                              baseStyle += 'bg-emerald-100 border-emerald-300 text-emerald-900';
                            } else if (isSelected && !isCorrect) {
                              baseStyle += 'bg-rose-100 border-rose-300 text-rose-900';
                            } else if (!isSelected && isCorrect) {
                              baseStyle += 'bg-emerald-50/50 border-emerald-300 text-emerald-800 border-dashed';
                            } else {
                              baseStyle += 'bg-slate-50 border-slate-200 text-slate-600';
                            }

                            return (
                              <div key={i} className={baseStyle}>
                                <span className="break-words leading-relaxed flex-1 min-w-0">{opt}</span>
                                <div className="flex flex-wrap gap-1.5 text-[10px] uppercase tracking-wider shrink-0 self-start sm:self-auto">
                                  {isSelected && <span className="px-1.5 py-0.5 rounded bg-white/70 border border-current">(Student's Answer)</span>}
                                  {isCorrect && <span className="px-1.5 py-0.5 rounded bg-white/70 border border-current">(Correct Answer)</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg mt-3 flex items-start gap-3 w-full max-w-full overflow-hidden">
                          <span className="text-lg shrink-0 mt-0.5">🧠</span>
                          <div className="flex-1 min-w-0">
                            <span className="block text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1">
                              AI-Generated Rationale
                            </span>
                            <p className="text-sm text-blue-950 font-bold leading-relaxed break-words">
                              {item.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Gradebook</h2>
                      <p className="text-sm text-slate-500 font-bold mt-1">Review student progress, scores, and completed attempt logs.</p>
                    </div>
                    <button onClick={exportGradebookCSV} className="px-4 py-2 border border-slate-300 text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Export Gradebook CSV
                    </button>
                  </div>

                  <div className="bg-slate-50 p-4 border border-slate-200 border-b-0 rounded-t-lg flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <input
                        type="text"
                        placeholder="Search student name..."
                        value={studentSearch}
                        onChange={handleStudentSearch}
                        className="w-full sm:w-64 px-3 py-2 border border-slate-300 rounded text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      
                      <select
                        value={studentStatusFilter}
                        onChange={handleStudentStatusChange}
                        className="px-3 py-2 border border-slate-300 rounded text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Completed">Completed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Not Taken">Not Taken</option>
                      </select>
                    </div>

                    {/* Fixed Cohort Badge */}
                    <div className="flex items-center gap-2 self-start md:self-auto">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Cohort:</span>
                      <span className="px-3 py-1 bg-white border border-slate-200 text-blue-700 rounded-lg text-xs font-bold shadow-2xs">
                        {currentExam.cohortName}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-b-lg bg-white">
                    <table className="w-full text-left border-collapse min-w-[640px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 sm:sticky sm:left-0 bg-white sm:shadow-[1px_0_0_0_rgba(0,0,0,0.1)] z-10 whitespace-nowrap">Student Name</th>
                          <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Status</th>
                          <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Score (%)</th>
                          <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right whitespace-nowrap">Attempts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {isFetchingAnalytics && studentAnalytics.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-sm font-bold text-slate-500">Loading gradebook...</td></tr>
                        ) : currentStudents.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-sm font-bold text-slate-500">No students match your filter criteria.</td></tr>
                        ) : (
                          currentStudents.map(student => (
                            <tr key={student.id} className="hover:bg-slate-50 transition-colors bg-white">
                              <td className="p-4 font-bold text-slate-800 sm:sticky sm:left-0 bg-white sm:shadow-[1px_0_0_0_rgba(0,0,0,0.1)] z-10 whitespace-nowrap">{student.name}</td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  student.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                  student.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-slate-200 text-slate-600'
                                }`}>
                                  {student.status}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-slate-800 whitespace-nowrap">
                                {student.grade}
                              </td>
                              <td className="p-4 text-right whitespace-nowrap">
                                {student.attempts && student.attempts.length > 0 ? (
                                  <button
                                    onClick={() => handleViewStudent(student)}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-bold transition-colors inline-block"
                                  >
                                    View Attempts ({student.attempts.length})
                                  </button>
                                ) : (
                                  <span className="text-xs font-bold text-slate-400">0 Attempts</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {/* Pagination Footer */}
                    {filteredStudents.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 bg-slate-50 gap-3 text-xs font-bold text-slate-600">
                        <span>
                          Showing {Math.min(filteredStudents.length, (studentPage - 1) * STUDENTS_PER_PAGE + 1)} to{' '}
                          {Math.min(filteredStudents.length, studentPage * STUDENTS_PER_PAGE)} of {filteredStudents.length} students
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setStudentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={studentPage === 1}
                            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
                          >
                            &larr; Prev
                          </button>
                          <span className="px-2 font-bold text-slate-800">
                            Page {studentPage} of {totalStudentPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setStudentPage((prev) => Math.min(prev + 1, totalStudentPages))}
                            disabled={studentPage === totalStudentPages}
                            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
                          >
                            Next &rarr;
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QUESTION ANALYTICS TAB */}
          {examTab === 'question_analytics' && (
            <div>
              <div className="mb-6 pb-4 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Question Analytics</h2>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                    Student selection rates, distractor diagnostics, and Classical Test Theory indices for {currentExam.cohortName}.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 shrink-0 w-full xl:w-auto mt-4 xl:mt-0">
                  <div className="relative group">
                    <button
                      type="button"
                      aria-label="Psychometric Guide"
                      className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 flex items-center justify-center font-black text-xs transition-colors shrink-0 cursor-help"
                    >
                      ℹ
                    </button>

                    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-slate-900 text-white text-xs rounded-xl shadow-2xl p-4 z-50 hidden group-hover:block pointer-events-none animate-in fade-in duration-150">
                      <h4 className="font-bold text-blue-300 text-xs uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-800">
                        Psychometric Indices Guide
                      </h4>
                      <div className="space-y-2.5 text-[11px] leading-relaxed">
                        <div>
                          <span className="font-bold text-white block">Facility Index (P) — Difficulty:</span>
                          <span className="text-slate-300">
                            Percentage of examinees correct. <strong className="text-emerald-400">0.40–0.70</strong> is ideal, <strong className="text-amber-400">&lt;0.25</strong> is difficult/suspect, <strong className="text-blue-400">&gt;0.85</strong> is very easy.
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-white block">Discrimination Index (D) — Kelly&apos;s 27%:</span>
                          <span className="text-slate-300">
                            Separation between top and bottom scorers. <strong className="text-emerald-400">&ge;0.30</strong> is excellent; <strong className="text-rose-400">&lt;0.20</strong> indicates poor discrimination.
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-white block">KR-20 Reliability:</span>
                          <span className="text-slate-300">
                            Overall test consistency (0.00 to 1.00). Target benchmark is <strong className="text-indigo-300">&ge;0.70</strong> for reliable assessments.
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-white block">NFD (Non-Functional Distractor):</span>
                          <span className="text-slate-300">
                            A wrong option chosen by <strong className="text-amber-300">&lt;5%</strong> of examinees. These fail to attract unprepared students and should be revised.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {kr20Reliability !== null && (
                    <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-center shrink-0">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider leading-none">KR-20</span>
                      <span className="text-xs font-black text-indigo-700 leading-none">{kr20Reliability}</span>
                    </div>
                  )}

                  <select
                    value={analyticsAttemptBasis}
                    onChange={(e: any) => setAnalyticsAttemptBasis(e.target.value)}
                    className="w-full sm:w-36 px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-500 shrink-0"
                    title="Select Attempt Basis"
                  >
                    <option value="graded">Graded Attempt ({currentExam.gradingLogic})</option>
                    <option value="first">First Attempt Only</option>
                    <option value="all">All Submissions</option>
                  </select>

                  {availableCompetencies.length > 0 && (
                    <select
                      value={selectedCompetencyFilter}
                      onChange={(e) => setSelectedCompetencyFilter(e.target.value)}
                      className="w-full sm:w-48 px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-500 shrink-0 truncate"
                      title={selectedCompetencyFilter === 'All' ? 'All Competencies' : selectedCompetencyFilter}
                    >
                      <option value="All">All Competencies ({questionAnalytics.length})</option>
                      {availableCompetencies.map(comp => (
                        <option key={comp} value={comp}>{comp}</option>
                      ))}
                    </select>
                  )}

                  {/* MULTI-FORMAT EXPORT ANALYTICS DROPDOWN */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsItemExportOpen(!isItemExportOpen)}
                      className="w-full sm:w-auto px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-between sm:justify-start gap-2 shrink-0"
                    >
                      <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Export Analysis</span>
                      <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isItemExportOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isItemExportOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsItemExportOpen(false)}></div>
                        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 animate-in fade-in slide-in-from-top-1">
                          <button
                            type="button"
                            onClick={handleExportItemAnalysisCSV}
                            className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                          >
                            <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black border border-slate-200">
                              CSV
                            </span>
                            <span>Export as CSV</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleExportItemAnalysisXLSX}
                            className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition-colors"
                          >
                            <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black border border-emerald-200">
                              XLS
                            </span>
                            <span>Export as Excel (XLSX)</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleExportItemAnalysisPDF}
                            className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2.5 transition-colors"
                          >
                            <span className="w-5 h-5 rounded bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-black border border-rose-200">
                              PDF
                            </span>
                            <span>Export as PDF Report</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Questions Analytics List */}
              <div className="space-y-6">
                {isFetchingAnalytics && questionAnalytics.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-bold border border-slate-200 rounded-xl">
                    Loading question analytics...
                  </div>
                ) : filteredQuestionAnalytics.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-bold border border-slate-200 rounded-xl">
                    No analytics available for this filter. Ensure student attempts are completed.
                  </div>
                ) : (
                  filteredQuestionAnalytics.map((qa, index) => {
                    const matchingQuestion = aiQuestions.find(q => q.id === qa.id);
                    const isExpanded = !!expandedQuestionDetails[qa.id];

                    return (
                      <div key={qa.id} className="p-3 sm:p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-5 pb-4 border-b border-slate-100 gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
                            <span className="w-8 h-8 shrink-0 mt-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold border border-slate-200">
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="text-base font-bold text-slate-900 leading-relaxed pt-1">{qa.question}</p>
                              <span className="text-xs text-slate-400 font-bold mt-1 block">
                                {qa.totalAnswers} response{qa.totalAnswers === 1 ? '' : 's'} recorded (
                                {analyticsAttemptBasis === 'graded'
                                  ? '1 vote per student'
                                  : analyticsAttemptBasis === 'first'
                                  ? 'first attempt'
                                  : 'all attempts'}
                                )
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-row flex-wrap items-center gap-1.5 sm:flex-col sm:items-end shrink-0 self-start">
                            {getDifficultyBadge(qa.facilityIndex, qa.facilityLabel)}
                            {getDiscriminationBadge(qa.discriminationIndex, qa.discriminationLabel)}
                          </div>
                        </div>

                        <div className="mb-4 md:ml-11 space-y-3">
                          {qa.options.map((opt: any, idx: number) => (
                            <div
                              key={idx}
                              className="relative w-full bg-slate-100 rounded-lg min-h-[48px] py-2.5 px-4 flex items-center overflow-hidden border border-slate-200"
                            >
                              <div
                                className={`absolute left-0 top-0 h-full ${
                                  opt.isCorrect ? 'bg-emerald-200' : 'bg-slate-300'
                                } opacity-40 transition-all duration-1000`}
                                style={{ width: `${opt.percent}%` }}
                              ></div>
                              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 text-sm font-bold text-slate-800">
                                <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0 pr-2">
                                  <span className="text-slate-500 shrink-0">{String.fromCharCode(65 + idx)}.</span>
                                  <span className="leading-snug">{opt.text}</span>
                                  {opt.isNonFunctional && (
                                    <span className="text-amber-700 uppercase tracking-wider text-[9px] font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0 ml-1">
                                      NFD (&lt;5%)
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 self-end sm:self-center shadow-xs border transition-colors ${
                                    opt.isCorrect
                                      ? 'bg-emerald-600 text-white border-emerald-700 font-extrabold'
                                      : 'bg-white/95 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  {opt.count} students ({opt.percent}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="md:ml-11 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleQuestionDetails(qa.id)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 py-1"
                          >
                            <svg
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            <span>{isExpanded ? 'Hide' : 'View'} Question Details (Topic, Rationale, Sources)</span>
                          </button>

                          {isExpanded && matchingQuestion && (
                            <div className="grid grid-cols-1 gap-3 mt-4 animate-in fade-in duration-200">
                              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Target Competency / Topic
                                </span>
                                <p className="text-sm font-bold text-slate-900">{matchingQuestion.topic}</p>
                              </div>
                              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Rationale
                                </span>
                                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                                  {matchingQuestion.rationale}
                                </p>
                              </div>
                              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Sources
                                </span>
                                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                                  {matchingQuestion.citation}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>

        {/* Activation Modal */}
        {showActivationModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Final Validation Approval</h3>
              </div>
              <p className="text-sm text-slate-600 font-bold mb-6 pl-13 leading-relaxed">
                You are about to approve the last pending question(s) in this queue. Doing so will complete the validation process and automatically change this exam&apos;s status to <span className="text-emerald-600">Active</span>, deploying it to students. Proceed?
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setShowActivationModal(false); setPendingApprovalAction(null); }} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={() => { if(pendingApprovalAction) pendingApprovalAction(); setShowActivationModal(false); setPendingApprovalAction(null); }} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                  Yes, Approve & Activate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Regenerate Modal */}
        {showRegenerateModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Regenerate Question?</h3>
              </div>
              <p className="text-sm text-slate-600 font-bold mb-6 pl-13 leading-relaxed">
                This will discard the current item and dispatch a new generation task to the Celery workers using the exact same subject, competency, and taxonomy.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowRegenerateModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={executeRegeneration} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                  Yes, Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Manually Modal */}
        {showEditModal && editingItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Edit Question Manually</h3>
              </div>

              <form onSubmit={saveManualEdit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Question Text</label>
                  <textarea name="question" defaultValue={editingItem.question} required rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editingItem.options.map((opt, idx) => (
                    <div key={idx}>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Option {String.fromCharCode(65 + idx)}</label>
                      <input type="text" name={`opt${idx}`} defaultValue={opt} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Correct Answer (Must match one option exactly)</label>
                  <input type="text" name="answer" defaultValue={editingItem.answer} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-emerald-50" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                    Save & Approve
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* DUPLICATE TO COHORT MODAL */}
        {duplicateModalExam && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800">Duplicate Exam to Cohort</h3>
                <button onClick={() => setDuplicateModalExam(null)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <form onSubmit={executeDuplicateToCohort} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Cloned Exam Title</label>
                  <input
                    type="text"
                    required
                    value={duplicateTitle}
                    onChange={(e) => setDuplicateTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Destination Cohort</label>
                  <select
                    required
                    value={duplicateTargetCohort}
                    onChange={(e) => setDuplicateTargetCohort(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    {activeTeacherCohorts.length === 0 ? (
                      <option value="" disabled>No active cohorts available</option>
                    ) : (
                      activeTeacherCohorts.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.id === duplicateModalExam.cohortId ? '(Current)' : ''}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-[11px] text-slate-500 font-bold mt-1">
                    Creates an independent deployment and clones all questions so retakers receive fresh attempt limits.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Schedule Start</label>
                    <input
                      type="datetime-local"
                      value={duplicateStartDate}
                      onChange={(e) => setDuplicateStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Schedule End</label>
                    <input
                      type="datetime-local"
                      value={duplicateEndDate}
                      onChange={(e) => setDuplicateEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDuplicateModalExam(null)}
                    disabled={isDuplicating}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDuplicating || !duplicateTargetCohort}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isDuplicating ? 'Duplicating...' : 'Duplicate & Deploy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  // --- MAIN EXAM LIST VIEW ---
  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Exam Management</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">Create, monitor, and validate mock exams for your assigned cohorts.</p>
        </div>
        <button onClick={() => {setIsNavigating(true); router.push('/faculty/exams/create')}} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
          + Create New Exam
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 mb-2">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title or target subject"
            value={examSearchQuery}
            onChange={(e) => setExamSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={examStatusFilter}
            onChange={(e) => setExamStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Draft</option>
            <option value="Inactive">Completed</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <FullScreenLoader 
          isOpen={isLoading} 
          message="Loading exam management page..." 
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
        {filteredExams.map((exam) => (
          <div key={exam.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col relative">
            <div className={`h-1.5 w-full ${exam.color}`}></div>
            <div className="p-3 sm:p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-slate-800 leading-snug pr-3">{exam.title}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {getStatusBadge(exam.status)}
                    {exam.status !== 'Pending' && !exam.is_visible && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wider">
                        Hidden
                      </span>
                    )}
                  </div>
                </div>

                {/* SINGLE COHORT BADGE DISPLAY */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Cohort</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded text-xs font-bold">
                      {exam.cohortName}
                    </span>
                    {exam.cohortStatus === 'Archived' && (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                        (Archived)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Schedule</p>
                    <p className="text-sm text-slate-700 font-bold">{exam.startDateStr} - <br className="hidden sm:block"/>{exam.endDateStr}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Generated Items</p>
                    <p className="text-sm text-slate-700 font-bold">{exam.items}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2.5">
                {exam.status === 'Generating' ? (
                  <button
                    disabled
                    className="w-full py-2.5 text-sm font-bold rounded-lg transition-colors shadow-sm bg-blue-50 text-blue-400 cursor-not-allowed border border-blue-100 flex items-center justify-center gap-2"
                  >
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating AI...
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenQuestionsOrResults(exam)}
                      className={`w-full py-2.5 text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 ${
                        exam.status === 'Pending'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {exam.status === 'Pending'
                        ? 'Review Questions'
                        : exam.status === 'Inactive'
                        ? 'View Question Analytics'
                        : 'View Questions'}
                    </button>

                    {exam.status !== 'Pending' && (
                      <button
                        type="button"
                        onClick={() => handleOpenGradebook(exam)}
                        className="w-full py-2.5 text-sm font-bold rounded-lg transition-colors shadow-sm bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        View Gradebook
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenSettings(exam)}
                      className="w-full py-2.5 text-sm font-bold rounded-lg transition-colors shadow-sm bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Manage Exam
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredExams.length === 0 && (
          <div className="col-span-full p-8 text-center text-sm font-bold text-slate-500 bg-white rounded-xl border border-slate-200">
            No exams match your search criteria.
          </div>
        )}
      </div>
      )}

      {/* DUPLICATE TO COHORT MODAL */}
      {duplicateModalExam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Duplicate Exam to Cohort</h3>
              <button onClick={() => setDuplicateModalExam(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={executeDuplicateToCohort} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Cloned Exam Title</label>
                <input
                  type="text"
                  required
                  value={duplicateTitle}
                  onChange={(e) => setDuplicateTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Destination Cohort</label>
                <select
                  required
                  value={duplicateTargetCohort}
                  onChange={(e) => setDuplicateTargetCohort(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
                >
                  {activeTeacherCohorts.length === 0 ? (
                    <option value="" disabled>No active cohorts available</option>
                  ) : (
                    activeTeacherCohorts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.id === duplicateModalExam.cohortId ? '(Current)' : ''}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] text-slate-500 font-bold mt-1">
                  Creates an independent deployment and clones all questions so retakers receive fresh attempt limits.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Schedule Start</label>
                  <input
                    type="datetime-local"
                    value={duplicateStartDate}
                    onChange={(e) => setDuplicateStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Schedule End</label>
                  <input
                    type="datetime-local"
                    value={duplicateEndDate}
                    onChange={(e) => setDuplicateEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDuplicateModalExam(null)}
                  disabled={isDuplicating}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDuplicating || !duplicateTargetCohort}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isDuplicating ? 'Duplicating...' : 'Duplicate & Deploy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <FullScreenLoader 
        isOpen={isNavigating || isDuplicating} 
        message={isDuplicating ? "Duplicating exam and cloning questions..." : "Loading exam creation page..."} 
      />
    </div>
  );
}

export default function FacultyExamsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-xl border border-slate-200">
          Loading exam data...
        </div>
      </div>
    }>
      <FacultyExamsContent />
    </Suspense>
  );
}