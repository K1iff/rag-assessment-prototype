import React from 'react';
import { parseCitations, CitationItem } from '@/lib/referenceUtils';

interface CitationsListProps {
  citations: any;
  emptyLabel?: string;
  variant?: 'card' | 'pill';
}

export default function CitationsList({
  citations,
  emptyLabel = 'No citation provided',
  variant = 'card',
}: CitationsListProps) {
  const items: CitationItem[] = parseCitations(citations);

  if (items.length === 0) {
    return <p className="text-xs font-bold text-slate-500 italic">{emptyLabel}</p>;
  }

  if (variant === 'pill') {
    return (
      <div className="flex flex-wrap gap-2 w-full min-w-0">
        {items.map((cite) => (
          <div
            key={cite.id}
            className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs max-w-full min-w-0"
          >
            <span className="text-xs font-bold text-slate-800 break-words leading-relaxed">
              {cite.title}
            </span>
            {cite.pages && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded text-[10px] font-bold tracking-wide break-words">
                {cite.pages}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      {items.map((cite) => (
        <div
          key={cite.id}
          className="bg-white border border-slate-200/90 rounded-lg p-3 flex flex-col gap-1.5 shadow-2xs w-full min-w-0"
        >
          <div className="flex items-start gap-2 min-w-0">
            <svg
              className="w-4 h-4 text-blue-600 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-xs font-bold text-slate-900 leading-relaxed break-words min-w-0 flex-1">
              {cite.title}
            </span>
          </div>

          {cite.pages && (
            <div className="ml-6 flex items-center">
              <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded text-[10px] font-bold tracking-wide break-words">
                {cite.pages}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

