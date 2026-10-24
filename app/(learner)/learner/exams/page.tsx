"use client";

import FullScreenLoader from "@/components/ui/FullScreenLoader";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Skeleton from "@/components/ui/Skeleton";

function ChevronDown({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronRight({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

interface StudentCohortOption {
  id: string;
  name: string;
  status: 'Active' | 'Archived';
  isCurrent: boolean;
}

interface ScheduledExam {
  id: string;
  title: string;
  subject: string;
  deadline: string;
  schedule_start: string;
  duration: string;
  status: string;
  score: string | null;
  accent: string;
  timeLimit: number;
  hasAttempts: boolean;
  isReviewLocked?: boolean;
  cohortName?: string;
  cohortStatus?: string;
}

export default function ScheduledExamsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledExamsList, setScheduledExamsList] = useState<ScheduledExam[]>([]);
  
  // Cohort & Filter States
  const [studentCohorts, setStudentCohorts] = useState<StudentCohortOption[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(true);
  const [isPastOpen, setIsPastOpen] = useState(true);

  // 1. Initial Load: Discover Active & Historical Cohorts for this Student
  useEffect(() => {
    const discoverStudentCohorts = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // A. Fetch current assigned cohort from Users
      const { data: userData } = await supabase
        .from("Users")
        .select("cohort_id")
        .eq("user_id", user.id)
        .single();

      const currentCohortId = userData?.cohort_id || null;
      const cohortMap = new Map<string, StudentCohortOption>();

      // B. Fetch details of the current cohort
      if (currentCohortId) {
        const { data: cData } = await supabase
          .from("Cohorts")
          .select("cohort_id, cohort_name, status")
          .eq("cohort_id", currentCohortId)
          .single();

        if (cData) {
          cohortMap.set(cData.cohort_id, {
            id: cData.cohort_id,
            name: cData.cohort_name,
            status: (cData.status as 'Active' | 'Archived') || 'Active',
            isCurrent: true,
          });
        }
      }

      // C. Discover any historical cohorts the student completed attempts in
      const { data: historicalAttempts } = await supabase
        .from("Student Attempts")
        .select("cohort_id, Cohorts(cohort_id, cohort_name, status)")
        .eq("student_id", user.id);

      (historicalAttempts || []).forEach((att: any) => {
        const rawCohort = Array.isArray(att.Cohorts) ? att.Cohorts[0] : att.Cohorts;
        if (rawCohort && !cohortMap.has(rawCohort.cohort_id)) {
          cohortMap.set(rawCohort.cohort_id, {
            id: rawCohort.cohort_id,
            name: rawCohort.cohort_name,
            status: (rawCohort.status as 'Active' | 'Archived') || 'Archived',
            isCurrent: rawCohort.cohort_id === currentCohortId,
          });
        }
      });

      const discoveredCohorts = Array.from(cohortMap.values());
      setStudentCohorts(discoveredCohorts);

      // Default to active cohort if available, otherwise first discovered cohort
      if (currentCohortId && cohortMap.has(currentCohortId)) {
        setSelectedCohortId(currentCohortId);
      } else if (discoveredCohorts.length > 0) {
        setSelectedCohortId(discoveredCohorts[0].id);
      } else {
        setIsLoading(false);
      }
    };

    discoverStudentCohorts();
  }, []);

  // 2. Fetch Exams for the Selected Cohort
  const fetchCohortExams = useCallback(async (cohortId: string) => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !cohortId) {
      setIsLoading(false);
      return;
    }

    const currentCohortObj = studentCohorts.find(c => c.id === cohortId);
    const isSelectedArchived = currentCohortObj?.status === 'Archived';

    // A. Anti-Cheat Check: Find titles of active incomplete exams in current batch
    const activeIncompleteExamTitles = new Set<string>();
    const currentActiveCohortId = studentCohorts.find(c => c.isCurrent)?.id;

    if (currentActiveCohortId) {
      const { data: activeLinks } = await supabase
        .from("Exam_Cohorts")
        .select("exam_id")
        .eq("cohort_id", currentActiveCohortId);

      const activeIds = activeLinks?.map(l => l.exam_id) || [];
      if (activeIds.length > 0) {
        const { data: activeExams } = await supabase
          .from("Exams")
          .select(`
            exam_title, max_attempts,
            attempts:"Student Attempts" ( student_id, cohort_id )
          `)
          .in("exam_id", activeIds)
          .eq("global_status", "Active")
          .eq("is_visible", true);

        (activeExams || []).forEach((ae: any) => {
          const attempts = (ae.attempts || []).filter(
            (a: any) => a.student_id === user.id && a.cohort_id === currentActiveCohortId
          );
          const isFinished = attempts.length >= (ae.max_attempts || 1);
          if (!isFinished) {
            const normalizedTitle = ae.exam_title.replace(/\s*\(Clone\)\s*/gi, "").trim().toLowerCase();
            activeIncompleteExamTitles.add(normalizedTitle);
          }
        });
      }
    }

    // B. Fetch exam IDs linked to the chosen cohort
    const { data: cohortExams, error: cohortExamsError } = await supabase
      .from("Exam_Cohorts")
      .select("exam_id")
      .eq("cohort_id", cohortId);

    if (cohortExamsError || !cohortExams || cohortExams.length === 0) {
      setScheduledExamsList([]);
      setIsLoading(false);
      return;
    }

    const examIds = cohortExams.map((ce) => ce.exam_id);

    // C. Fetch deployed, visible exams (excluding Draft/Pending)
    const { data: exams, error: examsError } = await supabase
      .from("Exams")
      .select(`
        exam_id,
        exam_title,
        exam_subject,
        schedule_start,
        schedule_end,
        time_limit_mins,
        global_status,
        close_after_deadline,
        max_attempts,
        attempts:"Student Attempts" ( exam_status, final_score, student_id, cohort_id )
      `)
      .in("exam_id", examIds)
      .eq("is_visible", true)
      .neq("global_status", "Pending")
      .neq("global_status", "Generating")
      .order("schedule_start", { ascending: true });

    if (examsError || !exams) {
      console.error("Error fetching exams:", examsError?.message);
      setScheduledExamsList([]);
      setIsLoading(false);
      return;
    }

    const accentColors = [
      "bg-blue-500",
      "bg-emerald-500",
      "bg-purple-500",
      "bg-rose-500",
    ];

    const formattedExams: ScheduledExam[] = exams.map((exam: any, index: number) => {
      // Filter attempts scoped strictly to this student and this cohort
      const myAttempts = exam.attempts?.filter(
        (att: any) => att.student_id === user.id && (!att.cohort_id || att.cohort_id === cohortId)
      ) || [];

      const attemptCount = myAttempts.length;
      const maxAttempts = exam.max_attempts || 1;

      const startDate = new Date(exam.schedule_start);
      const endDate = exam.schedule_end ? new Date(exam.schedule_end) : null;
      const now = new Date();

      let currentStatus = "Available";
      let displayScore = "N/A";

      if (attemptCount > 0) {
        const scores = myAttempts.map((a: any) => a.final_score).filter((s: any) => s !== null && s !== undefined);
        if (scores.length > 0) displayScore = `${Math.max(...scores)}%`;
      }

      // Check anti-cheat lock for historical review decks
      const normalizedTitle = exam.exam_title.replace(/\s*\(Clone\)\s*/gi, "").trim().toLowerCase();
      const isReviewLocked = !currentCohortObj?.isCurrent && activeIncompleteExamTitles.has(normalizedTitle);

      const isHistoricalBatch = !currentCohortObj?.isCurrent;
      const isDeadlinePassed = Boolean(endDate && exam.close_after_deadline && now > endDate);
      const isInactive = exam.global_status === "Inactive";

      // Status State Machine
      if (isHistoricalBatch || isSelectedArchived) {
        // Non-current or archived cohort: strictly read-only
        currentStatus = attemptCount > 0 ? "Finished" : "Closed";
      } else if (isDeadlinePassed || isInactive) {
        // Deadline passed or closed by faculty: if already attempted, status is Finished
        currentStatus = attemptCount > 0 ? "Finished" : "Closed";
      } else if (attemptCount >= maxAttempts) {
        // Active cohort and attempt quota reached
        currentStatus = "Finished";
      } else if (now < startDate) {
        // Scheduled in the future
        currentStatus = "Upcoming";
      } else if (attemptCount > 0 && attemptCount < maxAttempts) {
        // Active attempt available for retake
        currentStatus = "Retake Available";
      } else {
        // Active, within schedule, 0 attempts
        currentStatus = "Available";
      }

      return {
        id: exam.exam_id,
        title: exam.exam_title,
        subject: exam.exam_subject || "General Comprehensive",
        schedule_start: exam.schedule_start,
        deadline: endDate 
          ? `${endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at ${endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
          : "No Closing Deadline",
        duration: `${exam.time_limit_mins || 60} minutes`,
        status: currentStatus,
        score: displayScore,
        accent: accentColors[index % accentColors.length],
        timeLimit: exam.time_limit_mins || 60,
        hasAttempts: attemptCount > 0,
        isReviewLocked,
        cohortName: currentCohortObj?.name,
        cohortStatus: currentCohortObj?.status
      };
    });

    setScheduledExamsList(formattedExams);
    setIsLoading(false);
  }, [studentCohorts]);

  useEffect(() => {
    if (selectedCohortId) {
      fetchCohortExams(selectedCohortId);
    }
  }, [selectedCohortId, fetchCohortExams]);

  const subjects = ["All Subjects", ...Array.from(new Set(scheduledExamsList.map(e => e.subject)))];
  const statuses = ["All Statuses", ...Array.from(new Set(scheduledExamsList.map(e => e.status)))];

  const filteredExams = scheduledExamsList.filter(exam => {
    const matchesSubject = subjectFilter === "All Subjects" || exam.subject === subjectFilter;
    const matchesStatus = statusFilter === "All Statuses" || exam.status === statusFilter;
    return matchesSubject && matchesStatus;
  });

  const activeUpcomingStatuses = ["Available", "Upcoming", "Awaiting Teacher Activation", "Retake Available"];

  const upcomingExams = filteredExams.filter(exam => activeUpcomingStatuses.includes(exam.status));
  const pastExams = filteredExams.filter(exam => !activeUpcomingStatuses.includes(exam.status));

  const selectedCohortObj = studentCohorts.find(c => c.id === selectedCohortId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Scheduled Mock Exams
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">
            Select an available exam block to view instructions, launch a simulation, or review performance.
          </p>
        </div>

        {/* POLISHED BATCH SELECTOR */}
        {studentCohorts.length > 1 && (
          <div className="inline-flex items-center gap-2 bg-white pl-3.5 pr-2 py-1.5 border border-slate-200/90 rounded-xl shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-1.5 text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Batch:</span>
            </div>
            <div className="relative flex items-center">
              <select
                value={selectedCohortId}
                onChange={(e) => setSelectedCohortId(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold py-1 pl-2.5 pr-7 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                {studentCohorts.map((c) => (
                  <option key={c.id} value={c.id} className="py-1">
                    {c.name} {c.isCurrent ? '• Active' : c.status === 'Archived' ? '• Archived' : '• Previous'}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute right-2" />
            </div>
          </div>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 bg-white"
        >
          {subjects.map((subject) => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 bg-white"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
          {[1, 2, 3].map((key) => (
            <div
              key={key}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col relative h-[320px]"
            >
              <Skeleton className="h-1.5 w-full rounded-none bg-slate-300" />
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-3 w-12 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-5" />
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : scheduledExamsList.length === 0 ? (
        <div className="p-8 text-center text-slate-500 font-bold bg-white rounded-xl border border-slate-200">
          No mock exams are currently scheduled for {selectedCohortObj?.name || 'your assigned cohort'}.
        </div>
      ) : (
        <div className="space-y-8">
          {/* ACTIVE & UPCOMING SECTION */}
          <div>
            <button
              onClick={() => setIsUpcomingOpen(!isUpcomingOpen)}
              className="flex items-center gap-2.5 mb-3 group w-full text-left transition-colors cursor-pointer"
            >
              <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 text-slate-500 group-hover:bg-slate-200 transition-colors">
                {isUpcomingOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
              <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                Active &amp; Upcoming Exams
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {upcomingExams.length}
              </span>
              <div className="flex-1 h-px bg-slate-200/80 ml-2" />
            </button>
            {isUpcomingOpen && (
              upcomingExams.length === 0 ? (
                <div className="py-6 px-4 text-center text-xs text-slate-500 font-bold bg-white rounded-xl border border-slate-200 shadow-2xs">
                  No active or upcoming exams found matching your filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
                  {upcomingExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col relative"
                    >
                      <div className={`h-1.5 w-full ${exam.accent}`}></div>

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-slate-800 leading-snug pr-3">
                              {exam.title}
                            </h3>
                            <span
                              className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                                exam.status === "Available" || exam.status === "Retake Available"
                                  ? "bg-blue-100 text-blue-800"
                                  : exam.status === "Upcoming"
                                  ? "bg-slate-100 text-slate-600"
                                  : exam.status === "Closed"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {exam.status === "Finished" || exam.status === "Retake Available"
                                ? `Score: ${exam.score}`
                                : exam.status}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Subject
                          </p>
                          <p className="text-sm text-slate-700 font-bold mb-4">
                            {exam.subject}
                          </p>

                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Deadline
                          </p>
                          <p className="text-sm text-slate-700 font-bold">
                            {exam.deadline}
                          </p>
                        </div>

                        <div className="mt-6 pt-5 border-t border-slate-100">
                          {exam.status === "Available" ? (
                            <button
                              onClick={() => router.push(`/learner/exams/${exam.id}`)}
                              className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              View Details & Take Exam
                            </button>
                          ) : exam.status === "Retake Available" ? (
                            <div className="flex gap-3">
                              <button
                                onClick={() => router.push(`/learner/exams/${exam.id}/review`)}
                                className="flex-1 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 text-sm font-bold rounded-lg hover:bg-amber-100 transition-colors shadow-sm"
                              >
                                Review
                              </button>
                              <button
                                onClick={() => router.push(`/learner/exams/${exam.id}`)}
                                className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                              >
                                Retake
                              </button>
                            </div>
                          ) : exam.status === "Upcoming" ? (
                            <button
                              disabled
                              className="w-full py-2.5 bg-slate-50 text-slate-400 border border-slate-200 text-sm font-bold rounded-lg cursor-not-allowed"
                            >
                              Starts {new Date(exam.schedule_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </button>
                          ) : (
                            <button
                              onClick={() => router.push(`/learner/exams/${exam.id}/review`)}
                              className="w-full py-2.5 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-sm font-bold rounded-lg transition-colors shadow-sm"
                            >
                              View Performance Summary
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* PAST & CLOSED SECTION */}
          <div>
            <button
              onClick={() => setIsPastOpen(!isPastOpen)}
              className="flex items-center gap-2.5 mb-3 group w-full text-left transition-colors cursor-pointer"
            >
              <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 text-slate-500 group-hover:bg-slate-200 transition-colors">
                {isPastOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
              <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                Past &amp; Closed Exams
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {pastExams.length}
              </span>
              <div className="flex-1 h-px bg-slate-200/80 ml-2" />
            </button>
            {isPastOpen && (
              pastExams.length === 0 ? (
                <div className="py-6 px-4 text-center text-xs text-slate-500 font-bold bg-white rounded-xl border border-slate-200 shadow-2xs">
                  No past or closed exams found matching your filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
                  {pastExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col relative opacity-95"
                    >
                      <div className={`h-1.5 w-full ${exam.accent}`}></div>

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-slate-800 leading-snug pr-3">
                              {exam.title}
                            </h3>
                            <span
                              className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                                exam.hasAttempts || exam.status === "Finished"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {exam.hasAttempts || exam.status === "Finished"
                                ? `Score: ${exam.score}`
                                : exam.status}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Subject
                          </p>
                          <p className="text-sm text-slate-700 font-bold mb-4">
                            {exam.subject}
                          </p>

                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Deadline
                          </p>
                          <p className="text-sm text-slate-700 font-bold">
                            {exam.deadline}
                          </p>
                        </div>

                        <div className="mt-6 pt-5 border-t border-slate-100">
                          {exam.isReviewLocked ? (
                            <button
                              disabled
                              className="w-full py-2.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 cursor-not-allowed flex items-center justify-center gap-1.5 shadow-2xs"
                              title="This exam is currently active in your current batch. Rationales are locked until your active attempt is finalized."
                            >
                              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Review Locked (Active in Current Batch)
                            </button>
                          ) : (exam.hasAttempts || exam.status === "Finished") ? (
                            <button
                              onClick={() => router.push(`/learner/exams/${exam.id}/review`)}
                              className="w-full py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-sm font-bold rounded-lg transition-colors shadow-sm"
                            >
                              View Performance Summary
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full py-2.5 bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold rounded-lg cursor-not-allowed"
                            >
                              {!selectedCohortObj?.isCurrent 
                                ? 'Review Unavailable (Not Attempted in Past Batch)' 
                                : `Closed (${exam.cohortStatus === 'Archived' ? 'Archived Batch' : 'Deadline Passed'})`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}
      <FullScreenLoader 
        isOpen={isLoading} 
        message="Loading exams..." 
      />
    </div>
  );
}