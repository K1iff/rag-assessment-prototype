'use client';

import React, { useState } from 'react';

export default function RoadmapPage() {
  const [expandedPhase, setExpandedPhase] = useState<number>(3);

  const roadmapSteps = [
    { step: 1, title: 'Diagnostic Baseline', description: 'Establish foundational knowledge metrics.', completed: true, content: 'You scored an average of 72 percent on your baseline diagnostic. Your strongest area was Psychological Assessment.' },
    { step: 2, title: 'Core Subject Drills', description: 'Complete dedicated modules for all major board topics.', completed: true, content: 'All four core subject drills are completed. You are well prepared for the dynamic simulations.' },
    { step: 3, title: 'Adaptive Simulation', description: 'Surpass a passing threshold on dynamic exams.', completed: false, current: true, content: 'Active Goal requires you to score 75 percent or higher on three dynamic exams. Current progress is one out of three completed.' },
    { step: 4, title: 'Full Length Board Simulation', description: 'Simulate the exact timing and constraints of the actual PRC exam.', completed: false, content: 'This section is locked. Please clear Phase 3 to access the eight hour mock board simulation.' },
    { step: 5, title: 'PRC Board Readiness Certified', description: 'Final clearance badge achieved.', completed: false, content: 'This section is locked. Achieve a passing mark on the Full Length Simulation to get certified.' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Interactive PRC Progress Roadmap</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6 font-bold">Monitor your macro milestone progression mapped directly against the official board exam syllabus.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative ml-2">
            {roadmapSteps.map((step, index) => (
              <div 
                key={step.step} 
                className="relative pl-12 pb-10 last:pb-0 cursor-pointer group"
                onClick={() => setExpandedPhase(expandedPhase === step.step ? 0 : step.step)}
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
                      Milestone Phase {step.step} {step.current && '(Active Target)'}
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${expandedPhase === step.step ? 'rotate-180 text-blue-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 mt-1 group-hover:text-blue-600 transition-colors">{step.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-lg leading-relaxed font-bold">{step.description}</p>
                  
                  {expandedPhase === step.step && (
                    <div className="mt-4 p-5 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 font-bold leading-relaxed shadow-inner">
                      {step.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-2 mb-3">Roadmap Plotting Logic</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-bold">
              Milestones and structural progressions are dynamically mapped using system competency validation algorithms. 
              Passing any simulation unlocks the subsequent validation phase, while failing items triggers automatic AI background material updates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-base text-slate-800">Active Target Requirements</h3>
            <p className="text-sm text-slate-500 mt-2 font-bold">To clear Phase 3 you must achieve the following specific goals.</p>
            <ul className="mt-5 space-y-4 text-sm text-slate-600 font-bold">
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">●</span> 
                Complete a minimum of 3 dynamic exams.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">●</span> 
                Secure a score of 75 percent or higher on each assessment.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}