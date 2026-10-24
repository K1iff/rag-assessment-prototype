'use client';

import FullScreenLoader from '@/components/ui/FullScreenLoader';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { BLEPP_DOMAINS, normalizeBLEPPSubject } from '@/lib/psychometrics';

interface DomainStats {
  name: string;
  shortLabel: string;
  weight: number;
  weightPercent: number;
  accuracy: number;
  itemsCorrect: number;
  itemsTotal: number;
  status: 'Mastery' | 'Competent' | 'Critical Deficit';
  description: string;
}

interface WeakSpot {
  competency: string;
  subject: string;
  accuracy: number;
  missed: number;
  total: number;
  recommendation: string;
}

export default function ProgressRoadmapPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Active Cohort Metadata
  const [cohortName, setCohortName] = useState<string>('Assigned Review Batch');
  const [cohortStatus, setCohortStatus] = useState<'Active' | 'Archived'>('Active');

  // Psychometric Domain States
  const [domainBreakdown, setDomainBreakdown] = useState<Record<string, DomainStats>>({});
  const [compositeTOSScore, setCompositeTOSScore] = useState<number>(0);
  const [isBoardReady, setIsBoardReady] = useState<boolean>(false);
  const [coreDeficitCount, setCoreDeficitCount] = useState<number>(0);
  const [totalItemsAttempted, setTotalItemsAttempted] = useState<number>(0);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [weakSpots, setWeakSpots] = useState<WeakSpot[]>([]);

  useEffect(() => {
    const fetchReadinessMetrics = async () => {
      setIsLoading(true);
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

      // 2. Fetch completed attempts cleanly without risky nested joins
      let attemptsQuery = supabase
        .from('Student Attempts')
        .select(`
          attempt_id,
          final_score,
          completed_at,
          exam_id,
          cohort_id,
          "Student Answers" (
            question_id,
            is_correct
          )
        `)
        .eq('student_id', user.id)
        .eq('exam_status', 'completed');

      if (studentCohortId) {
        attemptsQuery = attemptsQuery.eq('cohort_id', studentCohortId);
      }

      const { data: attempts, error: attemptsError } = await attemptsQuery;

      if (attemptsError) {
        console.error("Error fetching roadmap attempts:", attemptsError);
        initializeEmptyMetrics();
        setIsLoading(false);
        return;
      }

      if (!attempts || attempts.length === 0) {
        initializeEmptyMetrics();
        setIsLoading(false);
        return;
      }

      // 3. Fetch corresponding Exams in a clean separate query
      const distinctExamIds = Array.from(new Set(attempts.map((a: any) => a.exam_id).filter(Boolean)));
      const examMap: Record<string, { title: string; subject: string }> = {};

      if (distinctExamIds.length > 0) {
        const { data: examsData } = await supabase
          .from('Exams')
          .select('exam_id, exam_title, exam_subject, global_status, is_visible')
          .in('exam_id', distinctExamIds);

        (examsData || []).forEach((e: any) => {
          examMap[e.exam_id] = {
            title: e.exam_title || 'General Assessment',
            subject: e.exam_subject || 'Psychological Assessment'
          };
        });
      }

      // 4. Fetch question metadata from Mock Exam Items using 'id'
      const questionMetaMap: Record<string, { subject: string; competency: string }> = {};
      if (distinctExamIds.length > 0) {
        const { data: items } = await supabase
          .from('Mock Exam Items')
          .select('id, subject, competency, exam_session_id')
          .in('exam_session_id', distinctExamIds);

        if (items) {
          items.forEach((it: any) => {
            if (it.id) {
              questionMetaMap[it.id] = {
                subject: normalizeBLEPPSubject(it.subject),
                competency: it.competency || 'Core Fundamentals'
              };
            }
          });
        }
      }

      // 5. Accumulate item accuracy and exam scores by domain
      const domainAcc: Record<string, { correct: number; total: number; examScores: number[] }> = {
        "Psychological Assessment": { correct: 0, total: 0, examScores: [] },
        "Abnormal Psychology": { correct: 0, total: 0, examScores: [] },
        "Industrial-Organizational Psychology": { correct: 0, total: 0, examScores: [] },
        "Developmental Psychology": { correct: 0, total: 0, examScores: [] }
      };

      const competencyAcc: Record<string, { subject: string; correct: number; total: number }> = {};
      let totalQuestionsEvaluated = 0;

      attempts.forEach((att: any) => {
        const examInfo = examMap[att.exam_id];
        const fallbackDomain = normalizeBLEPPSubject(examInfo?.subject || 'Psychological Assessment');
        const answers = att["Student Answers"] || [];

        if (answers.length > 0) {
          answers.forEach((ans: any) => {
            totalQuestionsEvaluated++;
            const meta = questionMetaMap[ans.question_id];
            const domainKey = meta?.subject || fallbackDomain;
            const compKey = meta?.competency || `${domainKey} Principles`;

            if (domainAcc[domainKey]) {
              domainAcc[domainKey].total += 1;
              if (ans.is_correct) domainAcc[domainKey].correct += 1;
            }

            if (!competencyAcc[compKey]) {
              competencyAcc[compKey] = { subject: domainKey, correct: 0, total: 0 };
            }
            competencyAcc[compKey].total += 1;
            if (ans.is_correct) competencyAcc[compKey].correct += 1;
          });
        } else {
          // If no granular answer rows exist, use overall attempt score
          if (domainAcc[fallbackDomain]) {
            domainAcc[fallbackDomain].examScores.push(att.final_score || 0);
          }
        }
      });

      // 6. Compile Domain Statistics
      const compiledDomains: Record<string, DomainStats> = {};
      let weightedCompositeSum = 0;
      let criticalDeficits = 0;

      Object.keys(BLEPP_DOMAINS).forEach((domainName) => {
        const meta = BLEPP_DOMAINS[domainName];
        const raw = domainAcc[domainName];
        let acc = 0;

        if (raw.total > 0) {
          acc = Math.round((raw.correct / raw.total) * 100);
        } else if (raw.examScores.length > 0) {
          const sum = raw.examScores.reduce((a, b) => a + b, 0);
          acc = Math.round(sum / raw.examScores.length);
        }

        weightedCompositeSum += acc * meta.weight;

        let status: 'Mastery' | 'Competent' | 'Critical Deficit' = 'Competent';
        if (acc >= 75) {
          status = 'Mastery';
        } else if (acc < 60) {
          status = 'Critical Deficit';
          criticalDeficits++;
        }

        compiledDomains[domainName] = {
          name: domainName,
          shortLabel: meta.shortLabel,
          weight: meta.weight,
          weightPercent: meta.weightPercent,
          accuracy: acc,
          itemsCorrect: raw.correct,
          itemsTotal: raw.total > 0 ? raw.total : raw.examScores.length * 50,
          status,
          description: meta.description
        };
      });

      const finalComposite = Math.round(weightedCompositeSum * 10) / 10;
      const isReady = finalComposite >= 75.0 && criticalDeficits === 0 && attempts.length > 0;

      // 7. Radar Chart Mapping
      const formattedRadar = [
        { subject: 'Psych Assessment', score: compiledDomains['Psychological Assessment'].accuracy, fullMark: 100 },
        { subject: 'Abnormal Psych', score: compiledDomains['Abnormal Psychology'].accuracy, fullMark: 100 },
        { subject: 'I/O Psych', score: compiledDomains['Industrial-Organizational Psychology'].accuracy, fullMark: 100 },
        { subject: 'Dev Psych', score: compiledDomains['Developmental Psychology'].accuracy, fullMark: 100 },
      ];

      // 8. Extract Weak Spots
      const candidateWeakSpots: WeakSpot[] = Object.entries(competencyAcc)
        .map(([comp, data]) => {
          const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
          const missed = data.total - data.correct;
          const meta = BLEPP_DOMAINS[data.subject];
          return {
            competency: comp,
            subject: data.subject,
            accuracy: acc,
            missed,
            total: data.total,
            recommendation: meta ? meta.studyTip : 'Review foundational textbook chapters and clinical vignettes.'
          };
        })
        .filter(w => w.accuracy < 75 && w.missed > 0)
        .sort((a, b) => a.accuracy - b.accuracy || b.missed - a.missed)
        .slice(0, 4);

      if (candidateWeakSpots.length === 0) {
        Object.values(compiledDomains)
          .filter(d => d.accuracy < 75)
          .sort((a, b) => a.accuracy - b.accuracy)
          .slice(0, 2)
          .forEach(d => {
            const meta = BLEPP_DOMAINS[d.name];
            candidateWeakSpots.push({
              competency: `${d.name} Core Concepts`,
              subject: d.name,
              accuracy: d.accuracy,
              missed: Math.max(1, d.itemsTotal - d.itemsCorrect),
              total: Math.max(1, d.itemsTotal),
              recommendation: meta ? meta.studyTip : 'Review core concepts.'
            });
          });
      }

      setDomainBreakdown(compiledDomains);
      setCompositeTOSScore(finalComposite);
      setIsBoardReady(isReady);
      setCoreDeficitCount(criticalDeficits);
      setTotalItemsAttempted(totalQuestionsEvaluated > 0 ? totalQuestionsEvaluated : attempts.length * 50);
      setRadarData(formattedRadar);
      setWeakSpots(candidateWeakSpots);
      setIsLoading(false);
    };

    const initializeEmptyMetrics = () => {
      const emptyDomains: Record<string, DomainStats> = {};
      Object.keys(BLEPP_DOMAINS).forEach(d => {
        emptyDomains[d] = {
          name: d,
          shortLabel: BLEPP_DOMAINS[d].shortLabel,
          weight: BLEPP_DOMAINS[d].weight,
          weightPercent: BLEPP_DOMAINS[d].weightPercent,
          accuracy: 0,
          itemsCorrect: 0,
          itemsTotal: 0,
          status: 'Critical Deficit',
          description: BLEPP_DOMAINS[d].description
        };
      });
      setDomainBreakdown(emptyDomains);
      setCompositeTOSScore(0);
      setIsBoardReady(false);
      setCoreDeficitCount(4);
      setTotalItemsAttempted(0);
      setRadarData([
        { subject: 'Psych Assessment', score: 0, fullMark: 100 },
        { subject: 'Abnormal Psych', score: 0, fullMark: 100 },
        { subject: 'I/O Psych', score: 0, fullMark: 100 },
        { subject: 'Dev Psych', score: 0, fullMark: 100 },
      ]);
      setWeakSpots([]);
    };

    fetchReadinessMetrics();
  }, []);

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Progress Roadmap</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">
            Board licensure readiness projection and domain mastery mapped against the BLEPP Table of Specifications.
          </p>
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

      {/* 1. HERO READINESS BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-2 ${isBoardReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />

        <div className="max-w-xl pl-2">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              BLEPP Licensure Projection
            </span>
            {isBoardReady ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Board Exam Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Not Yet Ready
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {isBoardReady
              ? "Comprehensive Readiness Criteria Achieved"
              : "Readiness Threshold Under Construction"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1.5 leading-relaxed">
            {isBoardReady
              ? "Your weighted Table of Specifications score exceeds the official 75.0% board benchmark with zero critical domain deficits. Maintain active retrieval practice."
              : "Projected composite is below the 75.0% threshold or one or more core domains remain in critical deficit (<60%). Prioritize weak spots below."}
          </p>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto bg-slate-50 p-4 rounded-xl border border-slate-100 shrink-0">
          <div className="text-center sm:text-left">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Projected TOS</span>
            <span className={`text-2xl font-black tracking-tight ${compositeTOSScore >= 75 ? 'text-emerald-600' : 'text-blue-600'}`}>
              {compositeTOSScore}%
            </span>
          </div>

          <div className="text-center sm:text-left">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Passing Benchmark</span>
            <span className="text-2xl font-black text-slate-700 tracking-tight">
              75.0%
            </span>
          </div>

          <div className="text-center sm:text-left">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Core Deficits (&lt;60%)</span>
            <span className={`text-2xl font-black tracking-tight ${coreDeficitCount === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {coreDeficitCount} {coreDeficitCount === 1 ? 'Area' : 'Areas'}
            </span>
          </div>

          <div className="text-center sm:text-left">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Evaluated Items</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {totalItemsAttempted}
            </span>
          </div>
        </div>
      </div>

      {/* 2. DOMAIN COMPETENCY RADAR & MASTERY METERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT: RADAR CHART */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-slate-800 text-base">BLEPP 4-Domain Radar</h3>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Multi-Axis Balance</span>
            </div>
            <p className="text-xs text-slate-500 font-bold mb-4">
              Visualizes cross-subject balance. An even polygon reflects well-rounded licensure preparation.
            </p>
          </div>

          <div className="w-full h-72 sm:h-80 relative flex items-center justify-center">
            {totalItemsAttempted === 0 && compositeTOSScore === 0 ? (
              <div className="text-center p-6 text-xs text-slate-400 font-bold">
                No attempt data recorded. Complete an exam to calibrate your radar.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: '700' }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar 
                    name="Mastery %" 
                    dataKey="score" 
                    stroke="#2563eb" 
                    fill="#3b82f6" 
                    fillOpacity={0.45} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-400 font-bold">
            <span>Target Line: 75% Mastery</span>
            <span className="text-blue-600 font-extrabold">Active Assessment Engine</span>
          </div>
        </div>

        {/* RIGHT: MASTERY PROGRESS METERS */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-slate-800 text-base">Regulatory Domain Mastery</h3>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Official TOS Weights</span>
            </div>
            <p className="text-xs text-slate-500 font-bold mb-6">
              Track mastery per regulatory subject area. Psychological Assessment holds the highest passing weight (40%).
            </p>
          </div>

          <div className="space-y-5">
            {Object.values(domainBreakdown).map((d) => (
              <div key={d.name} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{d.name}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 uppercase tracking-wider">
                      {d.weightPercent}% Weight
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      d.status === 'Mastery' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : d.status === 'Competent' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {d.status}
                    </span>
                    <span className="text-sm font-black text-slate-800 min-w-[36px] text-right">
                      {d.accuracy}%
                    </span>
                  </div>
                </div>

                {/* PROGRESS BAR WITH 75% BENCHMARK NOTCH */}
                <div className="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden my-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      d.accuracy >= 75 
                        ? 'bg-emerald-500' 
                        : d.accuracy >= 60 
                        ? 'bg-blue-600' 
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, d.accuracy)}%` }}
                  />
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-800 z-10 opacity-40" 
                    style={{ left: '75%' }} 
                    title="75% Board Passing Threshold"
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold mt-1">
                  <span>{d.description}</span>
                  {d.itemsTotal > 0 && (
                    <span className="shrink-0 ml-2">{d.itemsCorrect} / {d.itemsTotal} items</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Benchmark: 75% required per domain</span>
            <span className="text-slate-400">TOS Adjusted</span>
          </div>
        </div>
      </div>

      {/* 3. PRIORITY REMEDIATION AGENDA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Priority Remediation Agenda</h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Specific competency areas dragging down your projected licensure score. Focus review sessions here.
            </p>
          </div>

          <button
            onClick={() => router.push('/learner/exams')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            Practice Weak Spots
          </button>
        </div>

        {weakSpots.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-100 text-emerald-900">
            <span className="text-3xl block mb-2">🎉</span>
            <h4 className="font-black text-base text-emerald-800">No Critical Deficits Identified!</h4>
            <p className="text-xs font-bold text-emerald-700 mt-1 max-w-md mx-auto leading-relaxed">
              All evaluated competency clusters meet or surpass the 75% mastery benchmark. Keep taking comprehensive simulations to maintain test-taking endurance.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weakSpots.map((spot, index) => (
              <div 
                key={`${spot.competency}-${index}`}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded bg-white border border-slate-200">
                      {spot.subject}
                    </span>
                    <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      {spot.accuracy}% Accuracy
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-800 leading-snug">
                    {spot.competency}
                  </h4>

                  <p className="text-xs text-slate-600 font-bold mt-2 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                    💡 <span className="font-extrabold text-slate-700">Study Tip:</span> {spot.recommendation}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-between items-center text-[11px] text-slate-400 font-bold">
                  <span>Deficit Count: {spot.missed} of {spot.total} missed</span>
                  <button
                    onClick={() => router.push('/learner/exams')}
                    className="text-blue-600 hover:text-blue-700 font-extrabold hover:underline"
                  >
                    Drill Topic &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FullScreenLoader 
        isOpen={isLoading} 
        message="Synthesizing Table of Specifications readiness..." 
      />
    </div>
  );
}