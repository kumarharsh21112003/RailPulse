'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, AlertCircle, Train, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

function fetchLiveStation(code: string) {
  return fetch(`/api/station/${code}?hrs=4`).then((res) => res.json());
}

export default function LiveStationPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const { data, isLoading, error } = useQuery({
    queryKey: ['liveStation', code],
    queryFn: () => fetchLiveStation(code),
    refetchInterval: 10000,
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
      <div className="flex flex-col items-center justify-center p-10 text-rose-500">
        <AlertCircle className="h-10 w-10 mb-4" />
        <h2 className="text-xl font-bold">Failed to load Live Station data</h2>
      </div>
    );
  }

  const trains = data?.data || [];

  return (
    <div className="space-y-6 py-4">
      <div className="glass-panel p-6 rounded-3xl">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="text-rail-blue h-6 w-6" /> Live Station Board
        </h1>
        <p className="text-slate-500 mt-2">
          Showing trains for <span className="font-bold text-slate-800 dark:text-slate-200">{code}</span> in the next 4 hours
        </p>
      </div>

      <div className="space-y-4">
        {trains.length === 0 ? (
          <div className="p-10 text-center glass-panel rounded-3xl">
            <p className="text-slate-500">No trains scheduled in the next 4 hours.</p>
          </div>
        ) : (
          trains.map((t: any, idx: number) => (
            <Link
              href={`/train/${t.trainNo}`}
              key={idx}
              className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between group hover:border-rail-blue/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-rail-blue font-bold">
                  {t.platformNo || '-'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-rail-blue/10 text-rail-blue px-2 py-0.5 rounded">
                      {t.trainNo}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white">{t.trainName}</h3>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    {t.source} <ArrowRight className="h-3 w-3" /> {t.destination}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex gap-6 text-right">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Expected Arrival</div>
                  <div className={`font-bold ${t.delayArr > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {t.expectedArr || t.schArrTime || '--:--'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Expected Departure</div>
                  <div className={`font-bold ${t.delayDep > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {t.expectedDep || t.schDepTime || '--:--'}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
