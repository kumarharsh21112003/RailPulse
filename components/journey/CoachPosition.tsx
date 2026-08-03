'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface CoachPositionProps {
  trainNumber: string;
  className?: string;
}

function generateRake(trainNumber: string) {
  const isShatabdi = trainNumber.startsWith('120');
  const isRajdhani = trainNumber.startsWith('124') || trainNumber.startsWith('129') || trainNumber.startsWith('226');
  const isVande = trainNumber.startsWith('224');
  
  if (isVande) return ['ENG', 'C1', 'C2', 'C3', 'C4', 'E1', 'C5', 'C6', 'C7', 'C8'];
  if (isShatabdi) return ['ENG', 'EOG', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'E1', 'C7', 'C8', 'EOG'];
  if (isRajdhani) return ['ENG', 'EOG', 'A1', 'A2', 'A3', 'H1', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'PC', 'B9', 'B10', 'B11', 'EOG'];

  return ['ENG', 'SLR', 'GEN', 'GEN', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'PC', 'B1', 'B2', 'B3', 'B4', 'A1', 'A2', 'H1', 'GEN', 'GEN', 'SLR'];
}

export function CoachPosition({ trainNumber, className }: CoachPositionProps) {
  const rake = generateRake(trainNumber);

  return (
    <div className={cn('rounded-3xl p-6 bg-white/70  backdrop-blur-xl border border-slate-200  shadow-2xl', className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-slate-900  flex items-center gap-2">
          <span className="text-lg">🚂</span> Coach Position
        </h3>
        <span className="text-[9px] uppercase tracking-widest font-bold text-sky-600  bg-sky-100  px-2 py-1 rounded-full">Rake Layout</span>
      </div>
      <p className="text-[11px] text-slate-500 mb-5">Stand at the right spot on the platform.</p>

      <div className="relative overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="flex items-center min-w-max gap-0.5 px-1 pt-1">
          {rake.map((coach, index) => {
            const isEngine = coach === 'ENG';
            const isEOG = coach === 'EOG';
            const isAc = coach.startsWith('B') || coach.startsWith('A') || coach.startsWith('H') || coach.startsWith('E') || coach.startsWith('C');
            const isSleeper = coach.startsWith('S') && coach.length <= 2;
            const isPantry = coach === 'PC';
            const isGen = coach === 'GEN';
            const isSLR = coach === 'SLR';

            return (
              <React.Fragment key={`${coach}-${index}`}>
                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <div className={cn(
                    "flex items-center justify-center h-11 rounded-lg border font-bold text-xs transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg",
                    isEngine ? "w-16 bg-slate-100  text-slate-900  border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)] rounded-l-2xl" :
                    isEOG ? "w-12 bg-slate-100/80  text-slate-500  border-slate-300/50 " :
                    isAc ? "w-14 bg-sky-50  text-sky-600  border-sky-500/30 shadow-[0_0_8px_rgba(56,189,248,0.15)] group-hover:shadow-[0_0_14px_rgba(56,189,248,0.3)]" :
                    isSleeper ? "w-14 bg-emerald-50  text-emerald-600  border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.15)] group-hover:shadow-[0_0_14px_rgba(52,211,153,0.3)]" :
                    isPantry ? "w-12 bg-amber-50  text-amber-600  border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]" :
                    isGen ? "w-14 bg-rose-50  text-rose-600  border-rose-500/30" :
                    isSLR ? "w-12 bg-slate-200/50  text-slate-500  border-slate-300/50 " :
                    "w-14 bg-slate-100  text-slate-600  border-slate-300 "
                  )}>
                    {isEngine ? '🚂' : isPantry ? '🍳' : coach}
                  </div>
                  <div className={cn(
                    "text-[8px] font-mono font-bold tracking-wider",
                    isAc ? "text-sky-600/60 " :
                    isSleeper ? "text-emerald-600/60 " :
                    isPantry ? "text-amber-600/60 " :
                    "text-slate-400 "
                  )}>
                    {isEngine ? 'LOCO' : isEOG ? 'EOG' : isPantry ? 'PANTRY' : coach}
                  </div>
                </div>

                {/* Connector */}
                {index < rake.length - 1 && (
                  <div className="h-0.5 w-2 bg-slate-300  mt-[-16px]"></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-800/50">
        {[
          { label: 'AC', color: 'bg-sky-500' },
          { label: 'Sleeper', color: 'bg-emerald-500' },
          { label: 'General', color: 'bg-rose-500' },
          { label: 'Pantry', color: 'bg-amber-500' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn('h-2 w-2 rounded-full', color)}></div>
            <span className="text-[9px] font-semibold text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
