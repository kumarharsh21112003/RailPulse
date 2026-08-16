import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { LiveStationBoard } from '@/components/station/LiveStationBoard';
import fs from 'fs';
import path from 'path';

// Read stations data
function getStationDetails(stationCode: string) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'stations.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return data.stations.find((s: any) => s.stnCode.toUpperCase() === stationCode.toUpperCase());
  } catch (error) {
    return null;
  }
}

export default function LiveStationPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const station = getStationDetails(code);

  return (
    <div className="space-y-6 py-4">
      <div className="glass-panel p-6 rounded-3xl">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="text-rail-blue h-6 w-6" /> Live Station Board
        </h1>
        {station ? (
          <p className="text-slate-500 mt-2 flex items-center gap-1.5">
            Showing upcoming trains for <strong className="text-slate-800 dark:text-slate-200">{station.stnName} ({code})</strong>
            {station.stnCity && (
              <span className="flex items-center gap-1 ml-2 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                <MapPin className="h-3 w-3" /> {station.stnCity}
              </span>
            )}
          </p>
        ) : (
          <p className="text-slate-500 mt-2">
            Showing trains for <span className="font-bold text-slate-800 dark:text-slate-200">{code}</span> in the next 4 hours
          </p>
        )}
      </div>

      <LiveStationBoard code={code} />
    </div>
  );
}
