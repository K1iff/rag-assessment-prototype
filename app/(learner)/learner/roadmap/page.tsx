'use client';

import FullScreenLoader from '@/components/ui/FullScreenLoader';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const CORE_SUBJECTS = [
  "Abnormal Psychology",
  "Psychological Assessment",
  "Industrial-Organizational Psychology",
  "Developmental Psychology"
];

export default function RoadmapPage() {
  const [currentDbPhase, setCurrentDbPhase] = useState<number>(1);
  const [expandedPhase, setExpandedPhase] = useState<number>(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Active Cohort Metadata
  const [cohortName, setCohortName] = useState<string>('Assigned Review Batch');
  const [cohortStatus, setCohortStatus] = useState<'Active' | 'Archived'>('Active');

  // Unified Progress Engine State
  const [progressStats, setProgressStats] = useState({
    diagnosticPassed: false,
    coreSubjectsPassed: [] as string[],
    adaptivePassedCount: 0,
    fullLengthPassed: false,
  });

  useEffect(() => {
    const fetchProgressAndEvaluate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // 1. Fetch user's currently assigned active cohort
      const { data: userData } = await supabase
        .from('Users')
        .select('cohort_id')
        .eq('user_id', user.id)
        .single();

      const studentCohortId = userData?.cohort_id || null;

      // Fetch Cohort name & status if available
      if (studentCohortId) {
        const { data: cohortData } = await supabase
          .from('Cohorts')
          .select('cohort_name, status')
          .eq('cohort_id', studentCohortId)
          .single();

        if (cohortData) {
          setCohortName(cohortData.cohort_name);
          setCohortStatus((cohortData.status as 'Active' | 'Archived') || 'Active');
        }
      }

      // 2. Fetch current stored Roadmap Phase
      const { data: roadmapData } = await supabase
        .from('Roadmap Progress')
        .select('current_phase')
        .eq('student_id', user.id)
        .single();

      let dbPhase = roadmapData?.current_phase || 1;

      // 3. Fetch student attempts strictly scoped to the active cohort
      let attemptsQuery = supabase
        .from('Student Attempts')
        .select(`
          attempt_id,
          final_score,
          completed_at,
          exam_id,
          cohort_id,
          exam:Exams!inner ( exam_title, exam_subject, global_status, grading_logic, passing_score, passing_percentage, is_visible )
        `)
        .eq('student_id', user.id)
        .eq('exam_status', 'completed');

      if (studentCohortId) {
        attemptsQuery = attemptsQuery.eq('cohort_id', studentCohortId);
      }

      const { data: attempts, error: attemptsError } = await attemptsQuery;

      const stats = {
        diagnosticPassed: false,
        coreSubjectsPassed: new Set<string>(),
        adaptivePassedCount: 0,
        fullLengthPassed: false,
      };

      if (!attemptsError && attempts && attempts.length > 0) {
        // Filter out Hidden or Draft exams
        const validAttempts = attempts.filter((a: any) => {
          const ex = Array.isArray(a.exam) ? a.exam[0] : a.exam;
          return ex && ex.is_visible !== false && ex.global_status !== 'Hidden' && ex.global_status !== 'Draft';
        });

        // Group by exam_id to apply grading logic per assessment
        const groupedAttempts = validAttempts.reduce((acc, curr) => {
          if (!acc[curr.exam_id]) acc[curr.exam_id] = [];
          acc[curr.exam_id].push(curr);
          return acc;
        }, {} as Record<string, any[]>);

        Object.keys(groupedAttempts).forEach(examId => {
          const group = groupedAttempts[examId];
          group.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
          
          const rawExam = group[0].exam;
          const examData = Array.isArray(rawExam) ? rawExam[0] : rawExam;
          const logic = examData?.grading_logic || 'highest';
          const title = (examData?.exam_title || '').toLowerCase();
          const subject = examData?.exam_subject || '';
          
          const passingTarget = examData?.passing_percentage || examData?.passing_score || 75;
          
          let calculatedScore = 0;
          if (logic === 'highest') {
            calculatedScore = Math.max(...group.map(a => a.final_score || 0));
          } else if (logic === 'average') {
            calculatedScore = group.reduce((s, a) => s + (a.final_score || 0), 0) / group.length;
          } else {
            calculatedScore = group[0].final_score || 0; // 'latest'
          }

          // Evaluate Active Milestone Targets
          if (calculatedScore >= passingTarget) {
            if (title.includes('diagnostic')) {
              stats.diagnosticPassed = true;
            } else if (title.includes('full length') || title.includes('board simulation')) {
              stats.fullLengthPassed = true;
            } else if (CORE_SUBJECTS.includes(subject)) {
              stats.coreSubjectsPassed.add(subject);
            }
            
            // Count any modular or adaptive exams towards the adaptive pool
            if (!title.includes('diagnostic') && !title.includes('full length') && !title.includes('board simulation')) {
              stats.adaptivePassedCount++;
            }
          }
        });
      }

      const coreArray = Array.from(stats.coreSubjectsPassed);
      setProgressStats({
        diagnosticPassed: stats.diagnosticPassed,
        coreSubjectsPassed: coreArray,
        adaptivePassedCount: stats.adaptivePassedCount,
        fullLengthPassed: stats.fullLengthPassed,
      });

      // 4. Milestone Progression Engine
      let calculatedPhase = 1;
      if (stats.diagnosticPassed) calculatedPhase = 2;
      if (stats.diagnosticPassed && coreArray.length >= 4) calculatedPhase = 3;
      if (stats.diagnosticPassed && coreArray.length >= 4 && stats.adaptivePassedCount >= 3) calculatedPhase = 4;
      if (stats.diagnosticPassed && coreArray.length >= 4 && stats.adaptivePassedCount >= 3 && stats.fullLengthPassed) calculatedPhase = 5;

      // Allow progress to advance or reset to accurate active cohort baseline
      const targetPhase = Math.max(calculatedPhase, dbPhase === 1 ? calculatedPhase : Math.min(dbPhase, calculatedPhase));

      if (targetPhase !== dbPhase) {
        const { error: upsertError } = await supabase
          .from('Roadmap Progress')
          .upsert({ 
            student_id: user.id, 
            current_phase: targetPhase 
          }, { 
            onConflict: 'student_id' 
          });
          
        if (upsertError) console.error("Roadmap save error:", upsertError);
        
        // Trigger celebration scoped to the active cohort cycle
        const celebratedKey = `celebrated_${user.id}_cohort_${studentCohortId || 'default'}_phase_${targetPhase}`;
        if (targetPhase > dbPhase && !localStorage.getItem(celebratedKey)) {
          setShowCelebration(true);
          localStorage.setItem(celebratedKey, 'true');
        }
          
        dbPhase = targetPhase;
      }

      setCurrentDbPhase(dbPhase);
      setExpandedPhase(dbPhase);
      setIsLoading(false);
    };

    fetchProgressAndEvaluate();
  }, []);

  const baseSteps = [
    { step: 1, title: 'Diagnostic Baseline', description: 'Establish foundational knowledge metrics.', content: 'Your first objective is to take and pass the initial Diagnostic Assessment to map your starting knowledge across all competencies.' },
    { step: 2, title: 'Core Subject Drills', description: 'Complete dedicated modules for all major board topics.', content: 'Focus on individual subjects. You must achieve a passing score in each of the 4 core licensure domains.' },
    { step: 3, title: 'Adaptive Simulation', description: 'Surpass the passing threshold on dynamic exams.', content: `Active Goal requires you to pass 3 specialized or adaptive practice exams. Current progress: ${progressStats.adaptivePassedCount} / 3 completed.` },
    { step: 4, title: 'Full Length Board Simulation', description: 'Simulate the exact timing and constraints of the actual PRC exam.', content: 'Test your endurance under authentic conditions. Take and pass the Full Length Board Simulation to earn final readiness clearance.' },
    { step: 5, title: 'PRC Board Readiness Certified', description: 'Final clearance badge achieved.', content: 'Congratulations! You have completed all prerequisite milestones in this review batch and are certified ready for the licensure exam.' },
  ];

  const roadmapSteps = baseSteps.map(step => ({
    ...step,
    completed: currentDbPhase > step.step,
    current: currentDbPhase === step.step,
    isLocked: step.step > currentDbPhase
  }));

  return (
    <div className="space-y-6 relative pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Interactive Progress Roadmap</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">Monitor your milestone progression mapped directly against the official board exam syllabus.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative ml-2">
            {roadmapSteps.map((step, index) => (
              <div 
                key={step.step} 
                className={`relative pl-12 pb-10 last:pb-0 ${step.isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer group'}`}
                onClick={() => {
                  if (!step.isLocked) setExpandedPhase(expandedPhase === step.step ? 0 : step.step);
                }}
              >
                {index !== roadmapSteps.length - 1 && (
                  <div className={`absolute left-[11px] top-8 bottom-0 w-0.5 ${step.completed ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>
                )}
                
                <div className={`absolute left-0 top-1 h-6 w-6 rounded-full border-4 flex items-center justify-center transition-all ${
                  step.completed ? 'bg-emerald-500 border-emerald-200' : 
                  step.current ? 'bg-blue-600 border-blue-200 animate-pulse' : 
                  'bg-slate-200 border-slate-100 group-hover:border-slate-300'
                }`} />
                
                <div className="transition-all">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider ${step.completed ? 'text-emerald-600' : step.current ? 'text-blue-600' : 'text-slate-400'}`}>
                      Milestone Phase {step.step} {step.current && '(Active Target)'} {step.isLocked && '(Locked)'}
                    </span>
                    
                    {step.isLocked ? (
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : (
                      <svg className={`w-4 h-4 transition-transform ${expandedPhase === step.step ? 'rotate-180 text-blue-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pr-4">
                    <h3 className={`text-lg font-bold mt-1 transition-colors ${step.isLocked ? 'text-slate-500' : 'text-slate-800 group-hover:text-blue-600'}`}>
                      {step.title}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-slate-500 mt-1 max-w-lg leading-relaxed font-bold">{step.description}</p>
                  
                  {expandedPhase === step.step && !step.isLocked && (
                    <div className="mt-4 p-5 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 font-bold leading-relaxed shadow-inner animate-in fade-in slide-in-from-top-2">
                      {step.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SIDEBAR ACTIVE TARGETS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-2 mb-3">Roadmap Logic</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-bold">
              Milestone requirements are evaluated against your active batch attempts. Completing required examinations automatically advances your phase.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-base text-slate-800">Active Target Requirements</h3>
            <p className="text-sm text-slate-500 mt-2 font-bold">To clear Phase {currentDbPhase} in {cohortName}, fulfill the following criteria:</p>
            
            <ul className="mt-5 space-y-4 text-sm text-slate-600 font-bold">
              {currentDbPhase === 1 && (
                <li className="flex items-start gap-3">
                  <span className={progressStats.diagnosticPassed ? "text-emerald-500 mt-0.5" : "text-blue-500 mt-0.5"}>
                    {progressStats.diagnosticPassed ? '✓' : '●'}
                  </span> 
                  <span className={progressStats.diagnosticPassed ? 'text-emerald-700' : ''}>
                    Pass an exam titled &quot;Diagnostic&quot;.
                  </span>
                </li>
              )}

              {currentDbPhase === 2 && CORE_SUBJECTS.map(subj => {
                const isPassed = progressStats.coreSubjectsPassed.includes(subj);
                return (
                  <li key={subj} className="flex items-start gap-3">
                    <span className={isPassed ? "text-emerald-500 mt-0.5" : "text-blue-500 mt-0.5"}>
                      {isPassed ? '✓' : '●'}
                    </span> 
                    <span className={isPassed ? 'text-emerald-700 line-through opacity-70' : ''}>
                      Pass {subj}
                    </span>
                  </li>
                );
              })}

              {currentDbPhase === 3 && (
                <>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-500 mt-0.5">●</span> 
                    Complete a minimum of 3 dynamic exams.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-500 mt-0.5">●</span> 
                    Achieve the designated passing score on each assessment.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-500 mt-0.5">●</span> 
                    Current Progress: <span className={progressStats.adaptivePassedCount >= 3 ? "text-emerald-600" : "text-amber-600"}>{progressStats.adaptivePassedCount} / 3</span>
                  </li>
                </>
              )}

              {currentDbPhase === 4 && (
                <li className="flex items-start gap-3">
                  <span className={progressStats.fullLengthPassed ? "text-emerald-500 mt-0.5" : "text-blue-500 mt-0.5"}>
                    {progressStats.fullLengthPassed ? '✓' : '●'}
                  </span> 
                  <span className={progressStats.fullLengthPassed ? 'text-emerald-700' : ''}>
                    Pass a &quot;Full Length&quot; or &quot;Board Simulation&quot; exam.
                  </span>
                </li>
              )}

              {currentDbPhase === 5 && (
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">✓</span> 
                  <span className="text-emerald-700">All requirements met. You are Board Ready.</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {showCelebration && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center relative overflow-hidden animate-in zoom-in duration-300">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
            
            <div className="text-6xl mb-4 animate-bounce mt-4">🎉</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Phase Completed!</h2>
            <p className="text-slate-600 font-bold text-sm mb-8 leading-relaxed">
              Outstanding work! You have successfully cleared the milestone requirements for Phase {currentDbPhase - 1} and unlocked your next objective in {cohortName}.
            </p>
            
            <button 
              onClick={() => setShowCelebration(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md"
            >
              Continue Journey
            </button>
          </div>
        </div>
      )}
      <FullScreenLoader 
        isOpen={isLoading} 
        message="Syncing roadmap progress..." 
      />
    </div>
  );
}