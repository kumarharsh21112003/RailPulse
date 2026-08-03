'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ticket, AlertCircle, User, CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

function fetchPnr(pnr: string) {
  return fetch(`/api/pnr/${pnr}`).then((res) => res.json());
}

export default function PnrStatusPage({ params }: { params: { pnr: string } }) {
  const pnr = params.pnr;
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['pnr', pnr],
    queryFn: () => fetchPnr(pnr),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    );
  }

  if (error || (data && !data.success)) {
    return (
      <div className="flex flex-col items-center justify-center p-10 glass-panel rounded-3xl text-rose-500 mt-4">
        <AlertCircle className="h-10 w-10 mb-4" />
        <h2 className="text-xl font-bold">Failed to load PNR Status</h2>
        <p className="text-sm mt-2 text-rose-400">{data?.error || 'PNR may be flushed or invalid.'}</p>
      </div>
    );
  }

  const pnrData = data?.data || {};
  const passengers = pnrData.PassengerStatus || [];

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-rail-blue/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="text-rail-blue h-6 w-6" /> PNR Status: {pnr}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono font-bold text-rail-blue bg-rail-blue/10 px-2 py-0.5 rounded text-sm">
                {pnrData.TrainNo}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{pnrData.TrainName}</span>
            </div>
            <div className="text-sm text-slate-500 mt-1">
              {pnrData.Source} → {pnrData.Destination} | Date: {pnrData.Doj}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Chart Status</div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${pnrData.ChartPrepared ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
              {pnrData.ChartPrepared ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              {pnrData.ChartPrepared ? 'Chart Prepared' : 'Chart Not Prepared'}
            </div>
          </div>
        </div>
      </div>

      {/* Passengers List */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 ml-2">Passenger Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {passengers.map((p: any, idx: number) => (
            <div key={idx} className="glass-panel p-5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">Passenger {idx + 1}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Booking: {p.BookingStatus}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Current Status</div>
                <div className={`font-bold ${p.CurrentStatus?.includes('CNF') ? 'text-emerald-500' : p.CurrentStatus?.includes('WL') ? 'text-amber-500' : 'text-rail-blue'}`}>
                  {p.CurrentStatus}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
