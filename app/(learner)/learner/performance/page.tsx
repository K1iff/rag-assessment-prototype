'use client';

import FullScreenLoader from '@/components/ui/FullScreenLoader';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface CohortScopeOption {
  id: string; // 'all' or cohort_id UUID
  name: string;
  status: 'Active' | 'Archived';
  isCurrent: boolean;
}

interface PerformanceHistoryItem {
  id: string;
  examId: string;
  name: string;
  subject: string;
  score: string;
  rawScore: number | null;
  date: string;
  status: 'Passed' | 'Needs Review' | 'Missed' | 'Available' | 'Upcoming' | 'Closed';
  attemptsCount: number;
  maxAttempts: number;
  gradingLogic: string;
  targetScore: number;
  cohortName: string | null;
  cohortStatus: string | null;
  canRetake: boolean;
  canTake: boolean;
  isReviewLocked: boolean;
  itemStats: { correct: number; incorrect: number; total: number };
}

export default function UnifiedPerformancePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Cohort Scoping States
  const [cohortOptions, setCohortOptions] = useState<CohortScopeOption[]>([]);
  const [selectedCohortScope, setSelectedCohortScope] = useState<string>('current');
  const [activeCohortId, setActiveCohortId] = useState<string | null>(null);

  // Table Filter Toggle: 'evaluated' (default) vs 'all'
  const [viewFilter, setViewFilter] = useState<'evaluated' | 'all'>('evaluated');

  const [rawAttempts, setRawAttempts] = useState<any[]>([]);
  const [rawExams, setRawExams] = useState<any[]>([]);
  const [cohortExamIdsMap, setCohortExamIdsMap] = useState<Record<string, string[]>>({});

  const [historicalAttempts, setHistoricalAttempts] = useState<PerformanceHistoryItem[]>([]);
  const [stats, setStats] = useState({ completed: 0, average: 0 });
  const [cohortRank, setCohortRank] = useState<string>('Calculating...');

  // 1. Initial Load: Discover Student's Cohorts, Attempts, and Assigned Exams
  useEffect(() => {
    const fetchBaseData = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // A. Fetch student's currently assigned active cohort
      const { data: userData } = await supabase
        .from('Users')
        .select('cohort_id')
        .eq('user_id', user.id)
        .single();

      const currentCohortId = userData?.cohort_id || null;
      setActiveCohortId(currentCohortId);

      // B. Fetch student's completed attempts with joined cohort info
      const { data: attempts, error: attemptsError } = await supabase
        .from('Student Attempts')
        .select(`
          attempt_id, 
          final_score, 
          completed_at, 
          exam_id,
          cohort_id,
          Cohorts ( cohort_id, cohort_name, status ),
          "Student Answers" (is_correct)
        `)
        .eq('student_id', user.id)
        .eq('exam_status', 'completed')
        .order('completed_at', { ascending: false });

      if (attemptsError) {
        console.error("Error fetching student attempts:", attemptsError);
        setIsLoading(false);
        return;
      }

      setRawAttempts(attempts || []);

      // C. Discover all cohorts (current + past cohorts with completed attempts)
      const optionsMap = new Map<string, CohortScopeOption>();

      if (currentCohortId) {
        const { data: cData } = await supabase
          .from('Cohorts')
          .select('cohort_id, cohort_name, status')
          .eq('cohort_id', currentCohortId)
          .single();

        if (cData) {
          optionsMap.set(cData.cohort_id, {
            id: cData.cohort_id,
            name: cData.cohort_name,
            status: (cData.status as 'Active' | 'Archived') || 'Active',
            isCurrent: true
          });
        }
      }

      (attempts || []).forEach((att: any) => {
        const rawCohort = Array.isArray(att.Cohorts) ? att.Cohorts[0] : att.Cohorts;
        if (rawCohort && !optionsMap.has(rawCohort.cohort_id)) {
          optionsMap.set(rawCohort.cohort_id, {
            id: rawCohort.cohort_id,
            name: rawCohort.cohort_name,
            status: (rawCohort.status as 'Active' | 'Archived') || 'Archived',
            isCurrent: rawCohort.cohort_id === currentCohortId
          });
        }
      });

      const discoveredCohorts = Array.from(optionsMap.values());
      setCohortOptions(discoveredCohorts);

      // D. Fetch all exams attached to discovered cohorts + attempted exams
      const discoveredCohortIds = discoveredCohorts.map(c => c.id);
      const attemptedExamIds = (attempts || []).map(a => a.exam_id);

      let cohortExamsData: any[] = [];
      if (discoveredCohortIds.length > 0) {
        const { data: ce } = await supabase
          .from('Exam_Cohorts')
          .select('exam_id, cohort_id')
          .in('cohort_id', discoveredCohortIds);
        cohortExamsData = ce || [];
      }

      const cExamMap: Record<string, string[]> = {};
      cohortExamsData.forEach(item => {
        if (!cExamMap[item.cohort_id]) cExamMap[item.cohort_id] = [];
        cExamMap[item.cohort_id].push(item.exam_id);
      });
      setCohortExamIdsMap(cExamMap);

      const allTargetExamIds = Array.from(
        new Set([...attemptedExamIds, ...cohortExamsData.map(ce => ce.exam_id)])
      );

      if (allTargetExamIds.length > 0) {
        const { data: allExamsRaw } = await supabase
          .from('Exams')
          .select(`
            exam_id, exam_title, exam_subject, schedule_start, schedule_end, 
            close_after_deadline, global_status, grading_logic, passing_score, 
            passing_percentage, is_visible, max_attempts,
            Exam_Cohorts ( cohort_id, Cohorts ( cohort_id, cohort_name, status ) )
          `)
          .in('exam_id', allTargetExamIds);

        const visibleExams = (allExamsRaw || []).filter(e => 
          e.is_visible === true && 
          e.global_status !== 'Hidden' && 
          e.global_status !== 'Draft' && 
          e.global_status !== 'Pending'
        );

        setRawExams(visibleExams);
      } else {
        setRawExams([]);
      }

      setIsLoading(false);
    };

    fetchBaseData();
  }, []);

  // 2. Re-compute Metrics whenever Scope changes
  const computeMetrics = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();

    const targetCohortId = selectedCohortScope === 'current'
      ? activeCohortId
      : selectedCohortScope === 'all'
      ? null
      : selectedCohortScope;

    const scopedAttempts = rawAttempts.filter(a => {
      if (!targetCohortId) return true;
      return a.cohort_id === targetCohortId;
    });

    let scopedCohortExamIds: string[] = [];
    if (targetCohortId) {
      scopedCohortExamIds = cohortExamIdsMap[targetCohortId] || [];
    } else {
      scopedCohortExamIds = Object.values(cohortExamIdsMap).flat();
    }

    const relevantExams = rawExams.filter(exam => {
      const isAttempted = scopedAttempts.some(a => a.exam_id === exam.exam_id);
      const isAssigned = scopedCohortExamIds.includes(exam.exam_id);
      return isAttempted || isAssigned;
    });

    if (relevantExams.length === 0 && scopedAttempts.length === 0) {
      setHistoricalAttempts([]);
      setStats({ completed: 0, average: 0 });
      setCohortRank("N/A");
      return;
    }

    // Anti-Cheat: Discover incomplete active exam titles in the student's current batch
    const activeIncompleteExamTitles = new Set<string>();
    if (activeCohortId) {
      const activeIds = cohortExamIdsMap[activeCohortId] || [];
      const currentActiveExams = rawExams.filter(e => activeIds.includes(e.exam_id) && e.global_status === 'Active');
      currentActiveExams.forEach(ae => {
        const attemptsInActive = rawAttempts.filter(a => a.exam_id === ae.exam_id && a.cohort_id === activeCohortId);
        if (attemptsInActive.length < (ae.max_attempts || 1)) {
          const normTitle = ae.exam_title.replace(/\s*\(Clone\)\s*/gi, "").trim().toLowerCase();
          activeIncompleteExamTitles.add(normTitle);
        }
      });
    }

    const groupedAttempts: Record<string, any[]> = {};
    scopedAttempts.forEach(a => {
      if (!groupedAttempts[a.exam_id]) groupedAttempts[a.exam_id] = [];
      groupedAttempts[a.exam_id].push(a);
    });

    const consolidatedHistory: PerformanceHistoryItem[] = [];

    relevantExams.forEach(exam => {
      const group = groupedAttempts[exam.exam_id];
      const targetScore = exam.passing_percentage || exam.passing_score || 75;
      const maxAttempts = exam.max_attempts || 1;

      const rawCohort = Array.isArray(exam.Exam_Cohorts) ? exam.Exam_Cohorts[0]?.Cohorts : exam.Exam_Cohorts?.Cohorts;
      const cohortDisplay = Array.isArray(rawCohort) ? rawCohort[0] : rawCohort;
      const assignedCohortName = cohortDisplay?.cohort_name || null;
      const assignedCohortStatus = cohortDisplay?.status || null;
      const isAssignedCohortArchived = assignedCohortStatus === 'Archived';

      const startDate = new Date(exam.schedule_start);
      const endDate = exam.schedule_end ? new Date(exam.schedule_end) : null;
      const isDeadlinePassed = Boolean(endDate && exam.close_after_deadline && now > endDate);
      const isInactive = exam.global_status === 'Inactive';

      // Anti-cheat check: locked if viewing past cohort attempt while current cohort duplicate is unsubmitted
      const normTitle = exam.exam_title.replace(/\s*\(Clone\)\s*/gi, "").trim().toLowerCase();
      const isDifferentCohort = targetCohortId !== activeCohortId && targetCohortId !== null;
      const isReviewLocked = isDifferentCohort && activeIncompleteExamTitles.has(normTitle);

      if (group && group.length > 0) {
        const latestAttempt = group[0];
        const logic = exam.grading_logic || 'highest';

        let finalCalculatedScore = 0;
        if (logic === 'highest') {
          finalCalculatedScore = Math.max(...group.map(a => a.final_score || 0));
        } else if (logic === 'average') {
          const sum = group.reduce((acc, a) => acc + (a.final_score || 0), 0);
          finalCalculatedScore = Math.round(sum / group.length);
        } else {
          finalCalculatedScore = latestAttempt.final_score || 0;
        }

        let correctCount = 0;
        let totalItems = 100;
        if (latestAttempt["Student Answers"] && latestAttempt["Student Answers"].length > 0) {
          totalItems = latestAttempt["Student Answers"].length;
          correctCount = latestAttempt["Student Answers"].filter((a: any) => a.is_correct).length;
        } else {
          correctCount = Math.round((finalCalculatedScore / 100) * totalItems);
        }
        const incorrectCount = totalItems - correctCount;

        const dateObj = new Date(latestAttempt.completed_at || Date.now());

        // Can student take a retake?
        const canRetake = !isAssignedCohortArchived && 
                          !isDeadlinePassed && 
                          !isInactive && 
                          group.length < maxAttempts &&
                          (targetCohortId === activeCohortId || targetCohortId === null);

        consolidatedHistory.push({
          id: latestAttempt.attempt_id,
          examId: exam.exam_id,
          name: exam.exam_title || 'Unknown Exam',
          subject: exam.exam_subject || 'General Assessment',
          score: `${finalCalculatedScore}%`,
          rawScore: finalCalculatedScore,
          date: dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          status: finalCalculatedScore >= targetScore ? 'Passed' : 'Needs Review',
          attemptsCount: group.length,
          maxAttempts,
          gradingLogic: logic,
          targetScore,
          cohortName: assignedCohortName,
          cohortStatus: assignedCohortStatus,
          canRetake,
          canTake: false,
          isReviewLocked,
          itemStats: { correct: correctCount, incorrect: incorrectCount, total: totalItems }
        });
      } else {
        // Exam has 0 attempts in this scope
        if (isDeadlinePassed || isInactive) {
          const examEndDate = endDate || new Date();
          consolidatedHistory.push({
            id: `missed-${exam.exam_id}`,
            examId: exam.exam_id,
            name: exam.exam_title || 'Unknown Exam',
            subject: exam.exam_subject || 'General Assessment',
            score: '0%',
            rawScore: 0,
            date: examEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            status: 'Missed',
            attemptsCount: 0,
            maxAttempts,
            gradingLogic: exam.grading_logic || 'highest',
            targetScore,
            cohortName: assignedCohortName,
            cohortStatus: assignedCohortStatus,
            canRetake: false,
            canTake: false,
            isReviewLocked: false,
            itemStats: { correct: 0, incorrect: 0, total: 0 }
          });
        } else if (now < startDate) {
          // Upcoming
          consolidatedHistory.push({
            id: `upcoming-${exam.exam_id}`,
            examId: exam.exam_id,
            name: exam.exam_title || 'Unknown Exam',
            subject: exam.exam_subject || 'General Assessment',
            score: 'Upcoming',
            rawScore: null,
            date: startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            status: 'Upcoming',
            attemptsCount: 0,
            maxAttempts,
            gradingLogic: exam.grading_logic || 'highest',
            targetScore,
            cohortName: assignedCohortName,
            cohortStatus: assignedCohortStatus,
            canRetake: false,
            canTake: false,
            isReviewLocked: false,
            itemStats: { correct: 0, incorrect: 0, total: 0 }
          });
        } else {
          // Available to take now
          consolidatedHistory.push({
            id: `available-${exam.exam_id}`,
            examId: exam.exam_id,
            name: exam.exam_title || 'Unknown Exam',
            subject: exam.exam_subject || 'General Assessment',
            score: 'Not Attempted',
            rawScore: null,
            date: startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            status: 'Available',
            attemptsCount: 0,
            maxAttempts,
            gradingLogic: exam.grading_logic || 'highest',
            targetScore,
            cohortName: assignedCohortName,
            cohortStatus: assignedCohortStatus,
            canRetake: false,
            canTake: true,
            isReviewLocked: false,
            itemStats: { correct: 0, incorrect: 0, total: 0 }
          });
        }
      }
    });

    consolidatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Compute KPIs strictly on evaluated/graded attempts
    const evaluatedExams = consolidatedHistory.filter(h => h.rawScore !== null);
    if (evaluatedExams.length > 0) {
      const totalScore = evaluatedExams.reduce((acc, curr) => acc + (curr.rawScore || 0), 0);
      const avg = Math.round(totalScore / evaluatedExams.length);
      setStats({ completed: evaluatedExams.length, average: avg });
    } else {
      setStats({ completed: 0, average: 0 });
    }

    setHistoricalAttempts(consolidatedHistory);

    // Calculate Cohort Percentile Standing
    const standingCohortId = targetCohortId || activeCohortId;
    let calculatedRank = "N/A";

    if (standingCohortId) {
      const { data: cohortUsers } = await supabase
        .from('Users')
        .select('user_id')
        .eq('cohort_id', standingCohortId);

      const cohortUserIds = cohortUsers?.map(u => u.user_id) || [];

      if (cohortUserIds.length > 0) {
        const { data: cohortAttemptsRaw } = await supabase
          .from('Student Attempts')
          .select('student_id, final_score, exam_id, completed_at, cohort_id, exam:Exams!inner (global_status, grading_logic, is_visible)')
          .in('student_id', cohortUserIds)
          .eq('cohort_id', standingCohortId)
          .eq('exam_status', 'completed')
          .order('completed_at', { ascending: false });

        const cohortAttempts = (cohortAttemptsRaw || []).filter((ca: any) => {
          const ex = ca.exam;
          return ex && ex.is_visible === true && ex.global_status !== 'Hidden' && ex.global_status !== 'Draft';
        });

        const studentAverages: Record<string, { total: number; count: number }> = {};
        cohortUserIds.forEach(id => studentAverages[id] = { total: 0, count: 0 });

        const studentExamGroups: Record<string, Record<string, any[]>> = {};
        cohortAttempts.forEach(ca => {
          if (!studentExamGroups[ca.student_id]) studentExamGroups[ca.student_id] = {};
          if (!studentExamGroups[ca.student_id][ca.exam_id]) studentExamGroups[ca.student_id][ca.exam_id] = [];
          studentExamGroups[ca.student_id][ca.exam_id].push(ca);
        });

        Object.keys(studentExamGroups).forEach(studentId => {
          const examsForStudent = studentExamGroups[studentId];
          Object.keys(examsForStudent).forEach(examId => {
            const attemptsForExam = examsForStudent[examId];
            const logic = attemptsForExam[0]?.exam?.grading_logic || 'highest';
            
            let score = 0;
            if (logic === 'highest') score = Math.max(...attemptsForExam.map(a => a.final_score || 0));
            else if (logic === 'average') {
              const sum = attemptsForExam.reduce((s, a) => s + (a.final_score || 0), 0);
              score = sum / attemptsForExam.length;
            } else score = attemptsForExam[0].final_score || 0;

            studentAverages[studentId].total += score;
            studentAverages[studentId].count += 1;
          });
        });

        const rankList = Object.keys(studentAverages).map(sid => ({
          id: sid,
          avg: studentAverages[sid].count > 0 ? (studentAverages[sid].total / studentAverages[sid].count) : 0
        })).sort((a, b) => b.avg - a.avg);

        const myRankIndex = rankList.findIndex(r => r.id === user.id);
        if (myRankIndex !== -1) {
          const myRank = myRankIndex + 1;
          const totalStudents = rankList.length;
          
          if (totalStudents > 1) {
            const percentile = Math.ceil((myRank / totalStudents) * 100);
            if (percentile <= 10) calculatedRank = "Top 10%";
            else if (percentile <= 25) calculatedRank = "Top 25%";
            else if (percentile <= 50) calculatedRank = "Top 50%";
            else calculatedRank = `Rank ${myRank} of ${totalStudents}`;
          } else {
            calculatedRank = "Top 1%"; 
          }
        }
      }
    }

    setCohortRank(selectedCohortScope === 'all' && cohortOptions.length > 1 ? `${calculatedRank} (Current Batch)` : calculatedRank);
  }, [selectedCohortScope, activeCohortId, rawAttempts, rawExams, cohortExamIdsMap, cohortOptions]);

  useEffect(() => {
    if (!isLoading) {
      computeMetrics();
    }
  }, [selectedCohortScope, isLoading, computeMetrics]);

  const activeCohortObj = useMemo(() => {
    return cohortOptions.find(c => c.isCurrent);
  }, [cohortOptions]);

  // Filtered rows based on the segmented view toggle
  const displayedHistory = useMemo(() => {
    if (viewFilter === 'evaluated') {
      return historicalAttempts.filter(h => h.rawScore !== null);
    }
    return historicalAttempts;
  }, [historicalAttempts, viewFilter]);

  const evaluatedCount = useMemo(() => {
    return historicalAttempts.filter(h => h.rawScore !== null).length;
  }, [historicalAttempts]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Historical Performance</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">Review your mock examination records, score trends, and batch standing.</p>
        </div>

        {/* POLISHED BATCH SCOPE SELECTOR */}
        {cohortOptions.length > 0 && (
          <div className="inline-flex items-center gap-2 bg-white pl-3.5 pr-2 py-1.5 border border-slate-200/90 rounded-xl shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-1.5 text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Batch:</span>
            </div>
            <div className="relative flex items-center">
              <select
                value={selectedCohortScope}
                onChange={(e) => setSelectedCohortScope(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold py-1 pl-2.5 pr-7 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="current">
                  {activeCohortObj ? `${activeCohortObj.name} • Active` : 'Current Batch'}
                </option>
                {cohortOptions.length > 1 && (
                  <option value="all">All Evaluated History</option>
                )}
                {cohortOptions
                  .filter(c => !c.isCurrent)
                  .map(c => ( 
                    <option key={c.id} value={c.id}>
                      {c.name} {c.status === 'Archived' ? '• Archived' : '• Previous'}
                    </option>
                  ))}
              </select>
              <svg className="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute right-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Evaluated Exams</span>
          <p className="text-4xl font-bold text-slate-800 mt-2">{stats.completed}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Average</span>
          <p className="text-4xl font-bold text-blue-600 mt-2">{stats.average}%</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Standing</span>
          <p className="text-4xl font-bold text-emerald-600 mt-2">{cohortRank}</p>
        </div>
      </div>

      {/* EXAM HISTORY MATRIX TABLE WITH ACTION LINKS & TOGGLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-base text-slate-700">Exam History Matrix</h3>
            <span className="text-xs font-bold text-slate-400">
              {selectedCohortScope === 'all' ? 'All Batches Included' : 'Scoped to Selected Review Batch'}
            </span>
          </div>

          {/* VIEW FILTER SEGMENTED TOGGLE */}
          <div className="inline-flex bg-slate-200/80 p-1 rounded-lg">
            <button
              onClick={() => setViewFilter('evaluated')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewFilter === 'evaluated'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Evaluated Only ({evaluatedCount})
            </button>
            <button
              onClick={() => setViewFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewFilter === 'all'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Assigned Exams ({historicalAttempts.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="p-4">Exam Title</th>
                <th className="p-4">Final Score</th>
                <th className="p-4">Date Evaluated</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {displayedHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 font-bold">
                    No examination records found for this review batch.
                  </td>
                </tr>
              ) : (
                displayedHistory.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{exam.name}</span>
                        {selectedCohortScope === 'all' && exam.cohortName && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            {exam.cohortName} {exam.cohortStatus === 'Archived' ? '(Archived)' : ''}
                          </span>
                        )}
                        {exam.attemptsCount > 1 && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            {exam.attemptsCount} Attempts ({exam.gradingLogic})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      {exam.rawScore !== null ? exam.score : (
                        <span className="text-slate-400 text-xs font-bold italic">{exam.score}</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 font-bold">{exam.date}</td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        exam.status === 'Passed' ? 'bg-emerald-50 text-emerald-700' : 
                        exam.status === 'Missed' ? 'bg-rose-50 text-rose-700' : 
                        exam.status === 'Needs Review' ? 'bg-amber-50 text-amber-700' :
                        exam.status === 'Available' ? 'bg-blue-50 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {exam.isReviewLocked ? (
                        <span 
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-bold cursor-not-allowed"
                          title="Active in current batch. Review locked."
                        >
                          Review Locked
                        </span>
                      ) : exam.attemptsCount > 0 ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/learner/exams/${exam.examId}/review`)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg transition-colors shadow-2xs"
                          >
                            Review
                          </button>
                          {exam.canRetake && (
                            <button
                              onClick={() => router.push(`/learner/exams/${exam.examId}`)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                            >
                              Retake
                            </button>
                          )}
                        </div>
                      ) : exam.canTake ? (
                        <button
                          onClick={() => router.push(`/learner/exams/${exam.examId}`)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                        >
                          Take Exam
                        </button>
                      ) : exam.status === 'Upcoming' ? (
                        <span className="text-xs text-slate-400 font-bold">Locked</span>
                      ) : (
                        <span className="text-xs text-slate-400 font-bold">Closed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FullScreenLoader 
        isOpen={isLoading} 
        message="Loading performance data..." 
      />
    </div>
  );
}