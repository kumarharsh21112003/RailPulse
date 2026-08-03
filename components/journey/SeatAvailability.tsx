'use client';

import React, { useState, useEffect } from 'react';
import { Ticket, Lightbulb, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react';
import { cn } from '@/utils/cn';
import { format, addDays, parseISO } from 'date-fns';
import { useSearchParams } from 'next/navigation';

interface SeatClassInfo {
  class: string;
  status: string;
  prediction?: string;
  price?: number;
}

interface AlternateOption {
  id: string;
  boardingStation: string;
  boardingStationName?: string;
  destinationStation: string;
  destinationStationName?: string;
  delayHours: number;
  availability: SeatClassInfo[];
  message: string;
}

interface SeatData {
  status: 'waitlist' | 'available';
  primary: {
    source: string;
    destination: string;
    availability: SeatClassInfo[];
  };
  alternates: AlternateOption[];
}

interface Props {
  trainNumber: string;
  date: string; // The initial search date
  sourceCode: string;
  destCode: string;
  forceExpanded?: boolean;
}

export function SeatAvailability({ trainNumber, date, sourceCode, destCode, forceExpanded }: Props) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SeatData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(forceExpanded || false);
  const baseDate = date ? parseISO(date) : new Date();
  const [selectedDate, setSelectedDate] = useState(date || format(baseDate, 'yyyy-MM-dd'));
  
  // Generate 6 consecutive dates starting from the initial date
  const dateOptions = Array.from({ length: 6 }).map((_, i) => {
    const d = addDays(baseDate, i);
    return format(d, 'yyyy-MM-dd');
  });

  useEffect(() => {
    if (forceExpanded || searchParams.get('action') === 'seat') {
      setExpanded(true);
      if (!data) fetchAvailabilityData(selectedDate);
    }
  }, [searchParams, forceExpanded]);

  const fetchAvailabilityData = async (queryDate: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/availability?trainNumber=${trainNumber}&date=${queryDate}&source=${sourceCode}&destination=${destCode}&t=${Date.now()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    if (expanded && data) {
      if (!forceExpanded) setExpanded(false);
      return;
    }
    setExpanded(true);
    if (!data) {
      await fetchAvailabilityData(selectedDate);
    }
  };

  const handleDateClick = (d: string) => {
    if (d === selectedDate && data) return;
    setSelectedDate(d);
    fetchAvailabilityData(d);
  };

  const getStatusColor = (status: string) => {
    if (status.includes('AVAILABLE') || status.includes('CNF')) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (status.includes('RAC')) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    if (status.includes('WL')) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
  };

  return (
    <div className="rounded-2xl glass-panel border border-slate-200/60  overflow-hidden mt-4">
      <button 
        onClick={fetchAvailability}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 :bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <Ticket className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-800 ">Live Seat Availability</h3>
            <p className="text-xs text-slate-500 ">Check hidden quotas & alternate routes</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-200/60 ">
          {/* Date Slider */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
            {dateOptions.map((d) => {
              const isSelected = d === selectedDate;
              return (
                <button
                  key={d}
                  onClick={() => handleDateClick(d)}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center justify-center px-4 py-2 rounded-xl border transition-all min-w-[70px]",
                    isSelected 
                      ? "bg-rail-blue text-white border-rail-blue shadow-glow" 
                      : "bg-slate-50  border-slate-200  text-slate-600  hover:bg-slate-100 :bg-slate-800"
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{format(parseISO(d), 'EEE')}</span>
                  <span className="text-sm font-extrabold">{format(parseISO(d), 'dd')}</span>
                  <span className="text-[10px] font-semibold opacity-80">{format(parseISO(d), 'MMM')}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-500">Querying IRCTC Database...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-rose-500 p-4 bg-rose-500/10 rounded-xl">
              <XCircle className="h-4 w-4" />
              <p className="text-xs font-semibold">Could not fetch availability at this time.</p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Primary Availability */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {data.primary.availability.map((cls) => (
                  <div key={cls.class} className={cn("p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1", getStatusColor(cls.status))}>
                    <span className="text-xs font-extrabold">{cls.class}</span>
                    <span className="text-[10px] font-bold tracking-tight">{cls.status}</span>
                    {cls.prediction && <span className="text-[9px] font-semibold opacity-70">Chances: {cls.prediction}</span>}
                  </div>
                ))}
              </div>

              {/* Alternate Routes / Hidden Quota */}
              {data.status === 'waitlist' && data.alternates.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 ">
                    <Lightbulb className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Alternate Confirmed Routes</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {data.alternates.map((alt) => (
                      <div key={alt.id} className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800 ">{alt.message}</p>
                          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                            <span>From {alt.boardingStation}</span>
                            <span>•</span>
                            <span>To {alt.destinationStation}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {alt.availability.map(cls => (
                            <div key={cls.class} className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 ">
                              <span className="text-[9px] font-bold">{cls.class}</span>
                              <span className="text-[10px] font-extrabold">{cls.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
