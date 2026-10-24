'use client';

interface ScheduleItem {
  id?: string;
  task: string;
  day: string;
  date: string;
  time: string;
  status: string;
  references: string[];
  passingScore: number;
  highestScore: number | null;
  goalMet: boolean | null;
}

interface StandingMetrics {
  rank: string;
  average: number;
  completedCount: number;
  isReady: boolean;
}

import FullScreenLoader from '@/components/ui/FullScreenLoader';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LearnerCalendarPage() {
  const router = useRouter();

  const [weeklySchedule, setWeeklySchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const [cohortName, setCohortName] = useState<string>('Assigned Review Batch');
  const [cohortStatus, setCohortStatus] = useState<'Active' | 'Archived'>('Active');

  // Standing State
  const [standing, setStanding] = useState<StandingMetrics>({
    rank: 'Calculating...',
    average: 0,
    completedCount: 0,
    isReady: false
  });

  // Load dismissed notifications from localStorage on initial render
  useEffect(() => {
    const savedDismissals = localStorage.getItem('dismissedMissedExams');
    if (savedDismissals) {
      try {
        setDismissedNotifications(JSON.parse(savedDismissals));
      } catch (e) {
        console.error("Could not parse dismissed notifications from local storage");
      }
    }
  }, []);

  useEffect(() => {
    const fetchScheduleAndStanding = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // 1. Fetch student's cohort and its operational status
      const { data: userData } = await supabase
        .from('Users')
        .select('cohort_id, Cohorts ( cohort_name, status )')
        .eq('user_id', user.id)
        .single();

      if (!userData?.cohort_id) {
        setIsLoading(false);
        return;
      }

      const rawCohort = (userData as any)?.Cohorts;
      const userCohort = Array.isArray(rawCohort) ? rawCohort[0] : rawCohort;
      const studentCohortId = userData.cohort_id;
      const cStatus: 'Active' | 'Archived' = (userCohort?.status as 'Active' | 'Archived') || 'Active';

      setCohortName(userCohort?.cohort_name || 'Assigned Review Batch');
      setCohortStatus(cStatus);

      // 2. Fetch Exam IDs strictly linked to this student's active cohort
      const { data: cohortExams } = await supabase
        .from('Exam_Cohorts')
        .select('exam_id')
        .eq('cohort_id', studentCohortId);

      const examIds = cohortExams?.map(ce => ce.exam_id) || [];

      // 3. Calculate Batch Standing & Performance Summary
      const { data: cohortUsers } = await supabase
        .from('Users')
        .select('user_id')
        .eq('cohort_id', studentCohortId);

      const cohortUserIds = cohortUsers?.map(u => u.user_id) || [];

      if (cohortUserIds.length > 0) {
        const { data: cohortAttempts } = await supabase
          .from('Student Attempts')
          .select('student_id, final_score')
          .in('student_id', cohortUserIds)
          .eq('cohort_id', studentCohortId)
          .eq('exam_status', 'completed');

        const studentAverages: Record<string, { total: number; count: number }> = {};
        cohortUserIds.forEach(id => {
          studentAverages[id] = { total: 0, count: 0 };
        });

        (cohortAttempts || []).forEach(ca => {
          if (studentAverages[ca.student_id]) {
            studentAverages[ca.student_id].total += (ca.final_score || 0);
            studentAverages[ca.student_id].count += 1;
          }
        });

        const myData = studentAverages[user.id] || { total: 0, count: 0 };
        const myAvg = myData.count > 0 ? Math.round(myData.total / myData.count) : 0;

        const rankList = Object.keys(studentAverages)
          .map(sid => ({
            id: sid,
            avg: studentAverages[sid].count > 0 ? (studentAverages[sid].total / studentAverages[sid].count) : 0,
            hasAttempts: studentAverages[sid].count > 0
          }))
          .filter(r => r.hasAttempts)
          .sort((a, b) => b.avg - a.avg);

        let calculatedRank = 'N/A';
        const myRankIndex = rankList.findIndex(r => r.id === user.id);

        if (myRankIndex !== -1) {
          const myRank = myRankIndex + 1;
          const totalActive = rankList.length;
          if (totalActive > 1) {
            const percentile = Math.ceil((myRank / totalActive) * 100);
            if (percentile <= 10) calculatedRank = 'Top 10%';
            else if (percentile <= 25) calculatedRank = 'Top 25%';
            else if (percentile <= 50) calculatedRank = 'Top 50%';
            else calculatedRank = `Rank ${myRank} of ${totalActive}`;
          } else {
            calculatedRank = 'Top 1%';
          }
        }

        setStanding({
          rank: calculatedRank,
          average: myAvg,
          completedCount: myData.count,
          isReady: myAvg >= 75 && myData.count > 0
        });
      }

      if (examIds.length === 0) {
        setWeeklySchedule([]);
        setIsLoading(false);
        return;
      }

      // 4. Safely fetch visible published exams for this cohort
      const { data: exams, error } = await supabase
        .from('Exams')
        .select(`
          exam_id,
          exam_title,
          schedule_start,
          schedule_end,
          references,
          max_attempts,
          close_after_deadline,
          global_status,
          passing_score,
          passing_percentage,
          attempts:"Student Attempts" ( attempt_id, final_score, student_id, cohort_id )
        `)
        .in('exam_id', examIds)
        .eq('is_visible', true)
        .neq('global_status', 'Draft')
        .neq('global_status', 'Pending')
        .order('schedule_start', { ascending: true });

      if (error) {
        console.error("Error fetching schedule:", error.message);
        setIsLoading(false);
        return;
      }

      const formattedSchedule: ScheduleItem[] = (exams || []).map((exam) => {
        const examDate = new Date(exam.schedule_start);
        const examEndDate = exam.schedule_end ? new Date(exam.schedule_end) : null;
        const now = new Date();
        
        // Scope attempts strictly to this user and this cohort
        const myAttempts = (exam.attempts || []).filter(
          (a: any) => a.student_id === user.id && (!a.cohort_id || a.cohort_id === studentCohortId)
        );
        const attemptCount = myAttempts.length;
        const maxAttempts = exam.max_attempts || 1;
        
        const targetPercentage = exam.passing_percentage || exam.passing_score || 75;

        let highestScore: number | null = null;
        if (attemptCount > 0) {
          const scores = myAttempts.map((a: any) => a.final_score).filter((s: any) => s !== null && s !== undefined);
          if (scores.length > 0) highestScore = Math.max(...scores);
        }
        
        // Determine dynamic status
        let currentStatus = 'Upcoming';
        
        if (cStatus === 'Archived') {
          currentStatus = attemptCount > 0 ? 'Completed' : 'Closed';
        } else if (attemptCount >= maxAttempts) {
          currentStatus = 'Completed';
        } else if (exam.global_status === 'Inactive' || (examEndDate && exam.close_after_deadline && now > examEndDate)) {
          currentStatus = 'Closed';
        } else if (now >= examDate) {
          if (exam.global_status === 'Active') {
            currentStatus = attemptCount > 0 ? 'Retake Available' : 'Available';
          } else {
            currentStatus = 'Awaiting Teacher Activation';
          }
        }

        let goalMet: boolean | null = null;
        if (currentStatus === 'Completed') {
          goalMet = highestScore !== null && highestScore >= targetPercentage;
        } else if (currentStatus === 'Closed') {
          goalMet = highestScore !== null ? highestScore >= targetPercentage : false;
        }

        let parsedRefs = ['Standard Syllabus Guide'];
        if (exam.references && Array.isArray(exam.references) && exam.references.length > 0) {
          parsedRefs = exam.references;
        }

        return {
          id: exam.exam_id,
          task: exam.exam_title,
          day: examDate.toLocaleDateString('en-US', { weekday: 'long' }),
          date: examDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          time: examDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          status: currentStatus,
          references: parsedRefs,
          passingScore: targetPercentage,
          highestScore,
          goalMet
        };
      });

      setWeeklySchedule(formattedSchedule);
      setIsLoading(false);
    };

    fetchScheduleAndStanding();
  }, []);

  const handleDismissNotification = (examId: string) => {
    setDismissedNotifications(prev => {
      const updatedList = [...prev, examId];
      localStorage.setItem('dismissedMissedExams', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const today = new Date();
  const currentMonthName = today.toLocaleString('en-US', { month: 'long' });
  const currentYear = today.getFullYear();
  
  const daysInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, today.getMonth(), 1).getDay();

  const examDaysMap = new Map<number, string>();

  weeklySchedule
    .filter(schedule => schedule.date.includes(currentMonthName))
    .forEach(schedule => {
      const match = schedule.date.match(/\d+/);
      if (match) {
        const day = parseInt(match[0]);
        const existingStatus = examDaysMap.get(day);

        if (schedule.status === 'Closed') {
          examDaysMap.set(day, 'Closed'); 
        } else if ((schedule.status === 'Available' || schedule.status === 'Retake Available' || schedule.status === 'Upcoming' || schedule.status === 'Awaiting Teacher Activation') && existingStatus !== 'Closed') {
          examDaysMap.set(day, 'Available'); 
        } else if (!existingStatus) {
          examDaysMap.set(day, 'Completed'); 
        }
      }
    });

  const missedExams = weeklySchedule.filter(
    (exam) => exam.status === 'Closed' && exam.id && !dismissedNotifications.includes(exam.id) && exam.goalMet === false
  );

  const activeUpcomingSchedule = weeklySchedule.filter(
    schedule => !['Completed', 'Closed', 'Finished', 'Past'].includes(schedule.status)
  );

  return (
    <div className="space-y-6 pb-24">
      {missedExams.length > 0 && (
        <div className="space-y-3 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {missedExams.map((exam) => (
            <div key={exam.id} className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-sm font-bold">You missed an assessment deadline: {exam.task}</p>
                  <p className="text-xs text-rose-600 font-bold mt-0.5">This closed on {exam.day}, {exam.date} at {exam.time}.</p>
                </div>
              </div>
              <button 
                onClick={() => exam.id && handleDismissNotification(exam.id)} 
                className="px-4 py-2 bg-white text-rose-600 text-xs font-bold rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors whitespace-nowrap shadow-sm w-full md:w-auto"
              >
                Dismiss Alert
              </button>
            </div>
          ))}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Home</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">View your upcoming mock exams, mandatory simulations, and mapped source reference parameters.</p>
        </div>

        {/* POLISHED ACTIVE BATCH PILL */}
        <div className="inline-flex items-center gap-2.5 bg-white pl-3.5 pr-2.5 py-1.5 border border-slate-200/90 rounded-xl shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Batch:</span>
          </div>
          <span className="text-xs font-bold text-slate-800">{cohortName}</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
            cohortStatus === 'Archived' 
              ? 'bg-slate-100 text-slate-600 border border-slate-200' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {cohortStatus}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: UPCOMING EXAMS LIST */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-xl border border-slate-200">
              Syncing calendar data...
            </div>
          ) : activeUpcomingSchedule.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-xl border border-slate-200">
              No active exams scheduled right now. Check &apos;Scheduled Mock Exams&apos; or &apos;Historical Performance&apos; for completed exams.
            </div>
          ) : (
            activeUpcomingSchedule.map((schedule, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{schedule.task}</h3>
                    <p className="text-sm text-slate-500 mt-1">Scheduled for {schedule.day}, {schedule.date} at {schedule.time}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${
                    schedule.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 
                    schedule.status === 'Available' ? 'bg-blue-100 text-blue-800' : 
                    schedule.status === 'Retake Available' ? 'bg-amber-100 text-amber-800' :
                    schedule.status === 'Closed' ? 'bg-rose-100 text-rose-800' :
                    schedule.status === 'Awaiting Teacher Activation' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {schedule.status}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Required Review References:</span>
                  <div className="flex flex-wrap gap-2">
                    {schedule.references.map((ref, rIdx) => (
                      <span key={rIdx} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded border border-slate-200">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
                  {schedule.status === 'Completed' && (
                    <button onClick={() => router.push('/learner/performance')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors shadow-sm">
                      View Performance Dashboard
                    </button>
                  )}
                  {(schedule.status === 'Available' || schedule.status === 'Retake Available') && (
                    <button onClick={() => router.push(`/learner/exams/${schedule.id}`)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                      {schedule.status === 'Retake Available' ? 'Retake Exam' : 'Start Exam'}
                    </button>
                  )}
                  {schedule.status === 'Awaiting Teacher Activation' && (
                    <button disabled className="px-4 py-2 bg-amber-50 text-amber-500 border border-amber-200 text-xs font-bold rounded-lg cursor-not-allowed">
                      Pending Teacher Approval
                    </button>
                  )}
                  {schedule.status === 'Closed' && (
                    <button disabled className="px-4 py-2 bg-rose-50 text-rose-400 border border-rose-100 text-xs font-bold rounded-lg cursor-not-allowed">
                      Exam Closed
                    </button>
                  )}
                  {schedule.status === 'Upcoming' && (
                    <button disabled className="px-4 py-2 bg-slate-50 text-slate-400 border border-slate-100 text-xs font-bold rounded-lg cursor-not-allowed">
                      Locked Until Scheduled Time
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT COLUMN: CALENDAR & REPURPOSED STANDING WIDGET */}
        <div className="lg:col-span-1 space-y-6">
          {/* MONTHLY CALENDAR */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">{currentMonthName} {currentYear} Schedule</h3>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
              <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-bold text-slate-700">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="p-1.5"></div>
              ))}
              
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dayStatus = examDaysMap.get(day);
                
                let highlightClass = 'hover:bg-slate-100 text-slate-700';
                
                if (dayStatus === 'Closed') {
                  highlightClass = 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-200 ring-offset-1';
                } else if (dayStatus === 'Available') {
                  highlightClass = 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-200 ring-offset-1';
                } else if (dayStatus === 'Completed') {
                  highlightClass = 'bg-slate-400 text-white shadow-sm ring-2 ring-slate-200 ring-offset-1';
                }

                return (
                  <div 
                    key={day} 
                    className={`p-1.5 rounded-md flex items-center justify-center h-8 w-8 mx-auto font-bold transition-all ${highlightClass}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* REPURPOSED STANDING WIDGET */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-800 text-sm">Review Standing</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                standing.completedCount === 0 
                  ? 'bg-slate-100 text-slate-500 border border-slate-200'
                  : standing.isReady 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {standing.completedCount === 0 ? 'No Attempts' : standing.isReady ? 'Board Exam Ready' : 'In Progress'}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-bold mb-4 leading-relaxed">
              Performance metrics evaluated across your active cohort.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Batch Standing</span>
                <p className="text-base font-black text-slate-800 mt-0.5">{standing.rank}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Score</span>
                <p className={`text-base font-black mt-0.5 ${standing.average >= 75 ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {standing.completedCount > 0 ? `${standing.average}%` : 'N/A'}
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4 text-xs font-bold text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Board Passing Target:</span>
                <span className="text-slate-700">75% Passing</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Completed Assessments:</span>
                <span className="text-slate-700">{standing.completedCount} Exams</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/learner/roadmap')}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors border border-blue-200 flex items-center justify-center gap-1.5"
            >
              <span>View Progress Roadmap</span>
              <span>&rarr;</span>
            </button>
          </div>

          {/* STUDY TIP */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-2">Study Tip</h3>
            <p className="text-sm text-blue-900 leading-relaxed font-bold">
              Consistency is key. Complete your weekly practice assessments early to identify knowledge gaps before final board simulations.
            </p>
          </div>
        </div>
      </div>
      <FullScreenLoader 
        isOpen={isLoading} 
        message="Loading weekly activities..." 
      />
    </div>
  );
}