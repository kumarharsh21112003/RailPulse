import React from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import fs from 'fs';
import path from 'path';

export const metadata = {
  title: 'Indian Railways Station Directory - RailPulse',
  description: 'Complete directory of all Indian Railways stations. Check live train arrivals, departures, and platform information for over 8000 stations.',
};

export default function StationsDirectoryPage() {
  let stations = [];
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'stations.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    stations = data.stations || [];
  } catch (error) {
    console.error('Error reading stations.json:', error);
  }

  // Sort stations alphabetically
  const sortedStations = stations.sort((a: any, b: any) => {
    return a.stnName.localeCompare(b.stnName);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <MapPin className="h-8 w-8 text-rail-blue" />
          Station Directory
        </h1>
        <p className="text-slate-500 mt-2">
          Browse all {sortedStations.length} Indian Railways stations to check live arrival and departure boards.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {sortedStations.map((station: any) => (
            <Link
              key={station.stnCode}
              href={`/station/${station.stnCode}`}
              className="group flex flex-col p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-rail-blue transition-colors">
                {station.stnName}
              </div>
              <div className="font-mono text-[10px] font-bold text-slate-400 mt-0.5">
                {station.stnCode} {station.stnCity ? `• ${station.stnCity}` : ''}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
