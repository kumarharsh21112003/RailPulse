'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface PunctualityGaugeProps {
  trainNumber: string;
  delayMinutes: number;
  className?: string;
}

export function PunctualityGauge({ trainNumber, delayMinutes, className }: PunctualityGaugeProps) {
  const basePunctuality = 85 + (parseInt(trainNumber.substring(0, 2)) % 10);
  const penalty = delayMinutes > 0 ? Math.min(15, Math.floor(delayMinutes / 10)) : 0;
  const punctuality = basePunctuality - penalty;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (punctuality / 100) * circumference;

  let strokeColor = '#34d399'; // emerald
  let glowColor = 'rgba(52,211,153,0.3)';
  let label = 'Excellent';
  if (punctuality < 75) {
    strokeColor = '#fbbf24'; // amber
    glowColor = 'rgba(251,191,36,0.3)';
    label = 'Average';
  }
  if (punctuality < 60) {
    strokeColor = '#f87171'; // red
    glowColor = 'rgba(248,113,113,0.3)';
    label = 'Poor';
  }

  return (
    <div className={cn('rounded-3xl p-6 bg-white/70  backdrop-blur-xl border border-slate-200  shadow-2xl flex flex-col items-center justify-center relative overflow-hidden', className)}>
      {/* Decorative glow */}
      <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at center, ${glowColor}, transparent 70%)` }}></div>
      
      <h3 className="text-sm font-bold text-slate-900  mb-1 z-10">On-Time Record</h3>
      <p className="text-[9px] text-slate-500 mb-4 z-10">Last 30 days performance</p>
      
      <div className="relative flex items-center justify-center z-10">
        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-slate-800"
          />
          {/* Progress stroke */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={strokeColor}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.5s ease-out',
              filter: `drop-shadow(0 0 6px ${glowColor})`,
            }}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white font-mono">{punctuality}%</span>
          <span className="text-[8px] uppercase tracking-[0.2em] font-bold mt-0.5" style={{ color: strokeColor }}>{label}</span>
        </div>
      </div>
    </div>
  );
}
