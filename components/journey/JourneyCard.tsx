'use client';

import React from 'react';
import { Gauge, MapPin, RefreshCw, ArrowRight } from 'lucide-react';
import { LiveJourney } from '@/types/train';
import { DelayBadge } from './DelayBadge';
import { ProgressRing } from './ProgressRing';
import { ETAChip } from './ETAChip';
import { formatDistance, formatTimeAgo } from '@/utils/format';
import { cn } from '@/utils/cn';

interface JourneyCardProps {
  journey: LiveJourney;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function JourneyCard({
  journey,
  onRefresh,
  isRefreshing,
  className,
}: JourneyCardProps) {
  return (
    <div
      className={cn(
        'glass-panel relative overflow-hidden rounded-3xl p-6 shadow-glass transition-all duration-300',
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-rail-blue/10 px-2.5 py-1 font-mono text-xs font-bold text-rail-blue">
              #{journey.number}
            </span>
            {journey.startDate && (
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Started: {journey.startDate}
              </span>
            )}
            <DelayBadge delayMinutes={journey.delayMinutes} />
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {journey.name}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
            <span>{journey.origin.name} ({journey.origin.code})</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            <span>{journey.destination.name} ({journey.destination.code})</span>

            <div className="ml-2 pl-3 border-l border-slate-200 dark:border-slate-700 flex items-center gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                const isRunning = (journey.runDays || ['1','1','1','1','1','1','1'])[i] === '1';
                return (
                  <span
                    key={i}
                    title={isRunning ? `Runs on ${day}` : `Does not run on ${day}`}
                    className={cn(
                      "flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold",
                      isRunning
                        ? "bg-rail-blue text-white"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                    )}
                  >
                    {day}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ETAChip eta={journey.ETA} />
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Refresh Live Status"
            >
              <RefreshCw
                className={cn('h-4 w-4', isRefreshing && 'animate-spin text-rail-blue')}
              />
            </button>
          )}
        </div>
      </div>

      {/* Primary Live Status Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Current / Last Passed Station */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase mb-1">
              Current / Last Station
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight min-w-0">
              {journey.updateMessage ? (
                <span className="text-sm sm:text-base font-semibold line-clamp-2 break-words" title={journey.updateMessage}>{journey.updateMessage}</span>
              ) : (
                <span className="truncate block" title={journey.currentStation?.name || journey.previousStation?.name || journey.origin.name}>
                  {journey.currentStation?.name || journey.previousStation?.name || journey.origin.name}
                </span>
              )}
            </div>
            {journey.currentStation?.platform && !journey.updateMessage && (
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Platform {journey.currentStation.platform}
              </span>
            )}
          </div>
        </div>



        {/* Journey Progress Ring */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-900/50">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Distance Covered
            </span>
            <p className="font-mono text-base font-bold text-slate-900 dark:text-white">
              {formatDistance(journey.distanceCoveredKm)} / {formatDistance(journey.totalDistanceKm)}
            </p>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatDistance(journey.remainingDistanceKm)} remaining
            </span>
          </div>
          <ProgressRing progress={journey.completionPercentage} size={54} strokeWidth={5} />
        </div>
      </div>

      {/* Footer Meta */}
      <div className="mt-6 flex items-center justify-between text-[11px] font-medium tracking-wide text-slate-400">
        <span>Auto-refreshes every 10 seconds</span>
        <span>Updated {formatTimeAgo(journey.lastUpdated)}</span>
      </div>
    </div>
  );
}

