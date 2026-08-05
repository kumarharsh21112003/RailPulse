'use client';

import React from 'react';
import { CheckCircle2, Circle, Radio } from 'lucide-react';
import { Station } from '@/types/train';
import { PassingStationsAccordion } from './PassingStationsAccordion';
import { formatDelay } from '@/utils/format';
import { cn } from '@/utils/cn';

function calculateExpectedTime(scheduled: string | undefined, delayMins: number): string {
  if (!scheduled || scheduled === '--:--' || scheduled === '**UA**') return scheduled || '--:--';
  if (!delayMins || delayMins <= 0) return scheduled;
  
  const parts = scheduled.split(':');
  if (parts.length !== 2) return scheduled;
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return scheduled;
  
  m += delayMins;
  h += Math.floor(m / 60);
  m = m % 60;
  h = (h % 24 + 24) % 24;
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

interface TimelineProps {
  stations: Station[];
  currentStationCode?: string;
  className?: string;
  distanceCoveredKm?: number;
}

export function Timeline({ stations, currentStationCode, className, distanceCoveredKm }: TimelineProps) {
  return (
    <div className={cn('glass-panel rounded-3xl p-6 shadow-glass', className)}>
      <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">
        Station Route Timeline
      </h3>

      <div className="relative pl-6 before:absolute before:bottom-3 before:left-3 before:top-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        <div className="space-y-6">
          {stations.map((st, idx) => {
            const isPassed = st.status === 'passed';
            const isCurrent = st.status === 'current' || st.code === currentStationCode;
            const isUpcoming = st.status === 'upcoming';
            const delayInfo = formatDelay(st.delayMinutes);
            
            const baseScheduledTime = (st.scheduledArrival && st.scheduledArrival !== '--:--' && st.scheduledArrival !== '**UA**') 
              ? st.scheduledArrival 
              : st.scheduledDeparture;

            const baseActualTime = (st.actualArrival && st.actualArrival !== '--:--' && st.actualArrival !== '**UA**')
              ? st.actualArrival
              : ((st.actualDeparture && st.actualDeparture !== '--:--' && st.actualDeparture !== '**UA**') ? st.actualDeparture : null);

            return (
            <React.Fragment key={st.code + idx}>
              <div className="relative flex items-start justify-between gap-4">
                {/* Custom Timeline Dot Marker */}
                <div className="absolute -left-6 top-0.5 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-background">
                  {isPassed && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
                  )}
                  {isCurrent && (
                    <div className="relative flex items-center justify-center">
                      <Radio className="h-5 w-5 text-rail-blue animate-pulse" />
                      <span className="absolute h-8 w-8 rounded-full bg-rail-blue/20 animate-ping" />
                    </div>
                  )}
                  {isUpcoming && (
                    <Circle className="h-4 w-4 text-slate-300 dark:text-slate-700" />
                  )}
                </div>

                {/* Station Info */}
                <div className="flex-1 pl-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4
                      className={cn(
                        'font-bold',
                        isCurrent
                          ? 'text-rail-blue text-base'
                          : isPassed
                          ? 'text-slate-800 dark:text-slate-200 text-sm'
                          : 'text-slate-500 dark:text-slate-400 text-sm'
                      )}
                    >
                      {st.name} ({st.code})
                    </h4>

                    {isCurrent && (
                      <span className="rounded-md bg-rail-blue/10 px-2 py-0.5 font-mono text-[10px] font-bold text-rail-blue">
                        LIVE LOCATION
                      </span>
                    )}

                    {st.platform && (
                      <span className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                        PF {st.platform}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>{st.distanceKm} km</span>
                    {st.haltMinutes && <span>Halt: {st.haltMinutes}m</span>}
                  </div>
                </div>

                {/* Schedule vs Actual Timing */}
                <div className="text-right font-mono flex flex-col items-end gap-0.5">
                  {st.delayMinutes > 0 && baseScheduledTime && baseScheduledTime !== '--:--' && baseScheduledTime !== '**UA**' && (
                    <div className="text-[11px] text-slate-400 font-medium">
                      {baseScheduledTime}
                    </div>
                  )}
                  <div className={cn(
                    "font-bold text-sm",
                    st.delayMinutes > 0 ? "text-amber-600 dark:text-amber-500" : "text-slate-800 dark:text-slate-200"
                  )}>
                    {baseActualTime
                      ? baseActualTime 
                      : calculateExpectedTime(baseScheduledTime, st.delayMinutes)}
                  </div>
                  {st.delayMinutes > 0 ? (
                    <div className={cn('text-[10px] font-bold', delayInfo.color)}>
                      +{st.delayMinutes}m delay
                    </div>
                  ) : (
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      On Time
                    </div>
                  )}
                </div>
              </div>
              
              {/* Insert Passing Stations Accordion between this station and the next */}
              {idx < stations.length - 1 && (
                <PassingStationsAccordion from={st} to={stations[idx + 1]} distanceCoveredKm={distanceCoveredKm} />
              )}
            </React.Fragment>
          );
        })}
        </div>
      </div>
    </div>
  );
}

