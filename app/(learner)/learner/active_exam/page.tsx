'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ActiveExamPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);

  const toggleFlag = () => {
    if (flaggedQuestions.includes(currentQuestion)) {
      setFlaggedQuestions(flaggedQuestions.filter(q => q !== currentQuestion));
    } else {
      setFlaggedQuestions([...flaggedQuestions, currentQuestion]);
    }
  };

  const handleSubmit = () => {
    router.push('/learner/summary');
  };

  return (
    <div className="space-y-6 flex flex-col w-full">
      <div className="w-full flex justify-between items-end border-b border-slate-200 pb-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Active Examination Environment</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">Abnormal Psychology Quiz</p>
        </div>
        <div className="text-rose-600 font-mono font-bold bg-rose-50 border border-rose-100 px-4 py-2 rounded-lg text-lg shadow-sm">
          Time Remaining 44:12
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        
        <div className="flex-1 bg-white p-8 md:p-10 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          
          <div className="mb-10">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4">Question {currentQuestion} of 50</p>
            <h3 className="text-2xl font-bold text-slate-900 leading-relaxed">
              Which of the following personality disorders is characterized by a pervasive and unjustified distrust and suspicion of others?
            </h3>
          </div>

          <div className="space-y-4 mb-10">
            {['Schizoid Personality Disorder', 'Borderline Personality Disorder', 'Paranoid Personality Disorder', 'Antisocial Personality Disorder'].map((option, idx) => (
              <label key={idx} className="flex items-center p-5 rounded-lg border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors w-full">
                <input type="radio" name="answer" className="h-6 w-6 text-blue-600 border-slate-300 focus:ring-blue-500" />
                <span className="ml-4 text-base font-bold text-slate-700">{option}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-between items-center border-t border-slate-100 pt-8 mt-auto">
            <button 
              onClick={() => setCurrentQuestion(Math.max(1, currentQuestion - 1))}
              disabled={currentQuestion === 1}
              className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleFlag}
                className={`px-6 py-3 font-bold rounded-lg transition-colors flex items-center gap-2 ${
                  flaggedQuestions.includes(currentQuestion) 
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={flaggedQuestions.includes(currentQuestion) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                  <line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
                {flaggedQuestions.includes(currentQuestion) ? 'Flagged' : 'Flag for Review'}
              </button>
              
              <button 
                onClick={() => {
                  if (currentQuestion < 50) setCurrentQuestion(currentQuestion + 1);
                  else handleSubmit();
                }}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                {currentQuestion === 50 ? 'Submit Exam' : 'Next Item'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
          <h3 className="font-bold text-slate-800 mb-4">Question Navigation</h3>
          
          <div className="flex flex-wrap gap-4 mb-6 text-xs text-slate-600 font-bold">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-600 rounded-sm"></div> Current</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded-sm"></div> Flagged</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-50 border border-slate-200 rounded-sm"></div> Unanswered</span>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 50 }, (_, i) => i + 1).map(qNum => {
              let btnStyle = "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100";
              
              if (currentQuestion === qNum) {
                btnStyle = "bg-blue-600 border-blue-600 text-white shadow-sm";
              } else if (flaggedQuestions.includes(qNum)) {
                btnStyle = "bg-amber-100 border-amber-300 text-amber-800";
              }
              
              return (
                <button 
                  key={qNum}
                  onClick={() => setCurrentQuestion(qNum)}
                  className={`h-10 w-full rounded border text-xs font-bold flex items-center justify-center transition-colors ${btnStyle}`}
                >
                  {qNum}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}