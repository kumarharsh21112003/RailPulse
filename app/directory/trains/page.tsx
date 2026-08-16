import React from 'react';
import Link from 'next/link';
import { Train } from 'lucide-react';
import trainsData from '@/lib/all-trains.json';

export const metadata = {
  title: 'Indian Railways Train Directory - RailPulse',
  description: 'Complete directory of all Indian Railways trains. Check live running status, timetable, and route maps for over 5000 trains.',
};

export default function TrainsDirectoryPage() {
  // Sort trains by number
  const sortedTrains = [...trainsData].sort((a: any, b: any) => {
    return parseInt(a.number) - parseInt(b.number);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Train className="h-8 w-8 text-rail-blue" />
          Train Directory
        </h1>
        <p className="text-slate-500 mt-2">
          Browse all {sortedTrains.length} Indian Railways trains to check their live running status and schedule.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedTrains.map((train: any) => (
            <Link
              key={train.number}
              href={`/train/${train.number}`}
              className="group block p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="font-mono text-xs font-bold text-rail-blue mb-1">
                {train.number}
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-rail-blue transition-colors">
                {train.name}
              </div>
              <div className="text-xs text-slate-500 truncate mt-0.5">
                {train.from} → {train.to}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
