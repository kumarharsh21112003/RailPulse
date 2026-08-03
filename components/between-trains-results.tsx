'use client';

import React from 'react';
import Link from 'next/link';
import { Train, Clock, CalendarDays, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TrainResult {
  TrainNumber: string;
  TrainName: string;
  FromStation: string;
  Destination: string;
  DepTimeFrom: string;
  ArrTimeTo: string;
  TravelTime: string;
  DayOfRun: string;
  TrainTypeDesc: string;
}

interface BetweenTrainsResultsProps {
  trains: TrainResult[];
  isLoading: boolean;
  error: string | null;
}

export default function BetweenTrainsResults({ trains, isLoading, error }: BetweenTrainsResultsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-rail-blue/30 border-t-rail-blue rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Searching schedule database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center border border-rose-200 dark:border-rose-900/50">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Search Failed</h3>
        <p className="text-slate-600 dark:text-slate-400">{error}</p>
      </div>
    );
  }

  if (trains.length === 0) {
    return null;
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {trains.length} Direct Trains Found
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trains.map((train, idx) => {
          const isDaily = train.DayOfRun.toLowerCase() === 'daily';
          const runsToday = isDaily || train.DayOfRun.toLowerCase().includes(today.toLowerCase());

          return (
            <div key={`${train.TrainNumber}-${idx}`} className="glass-panel p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-rail-blue/30 transition-colors shadow-glass group flex flex-col h-full">
              
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-bold font-mono tracking-wider">
                      #{train.TrainNumber}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {train.TrainTypeDesc}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {train.TrainName}
                  </h3>
                </div>
              </div>

              {/* Timing info */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 mb-4">
                <div className="text-center">
                  <div className="text-xl font-black text-slate-900 dark:text-white">{train.DepTimeFrom}</div>
                  <div className="text-[10px] font-semibold uppercase text-slate-500">Departure</div>
                </div>
                
                <div className="flex-1 px-4 relative flex flex-col items-center">
                  <div className="text-xs font-semibold text-slate-400 mb-1">{train.TravelTime}h</div>
                  <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-800 rounded-full relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 dark:bg-slate-900 p-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-black text-slate-900 dark:text-white">{train.ArrTimeTo}</div>
                  <div className="text-[10px] font-semibold uppercase text-slate-500">Arrival</div>
                </div>
              </div>

              <div className="mt-auto">
                {/* Running days */}
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Runs on: <strong className={cn("ml-1", runsToday ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200")}>{train.DayOfRun}</strong>
                  </span>
                </div>

                <Link
                  href={`/train/${train.TrainNumber}`}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
                >
                  <Train className="w-4 h-4" />
                  <span>Track Live Status</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-50" />
                </Link>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
