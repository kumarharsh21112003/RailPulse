import React from 'react';
import { Loader2, Train } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-rail-blue/20 blur-xl rounded-full" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-rail-blue/10 text-rail-blue border border-rail-blue/20 shadow-glass">
          <Train className="h-10 w-10 animate-pulse" />
        </div>
      </div>
      
      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-rail-blue" />
          <span className="font-bold text-lg tracking-tight">Locating Train...</span>
        </div>
        <p className="text-xs text-slate-500 max-w-[250px] text-center">
          Connecting to railway networks to fetch real-time GPS coordinates and delay analytics.
        </p>
      </div>
    </div>
  );
}
