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

      {/* SEO Content Block */}
      {station && (
        <div className="mt-8 space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <section className="glass-panel p-6 rounded-3xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              About {station.stnName} ({code})
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>{station.stnName}</strong> (Station Code: <strong>{code}</strong>) is a major railway station{station.stnCity ? ` located in ${station.stnCity}` : ''}. 
              Using RailPulse, you can check the live arrival and departure status of all trains passing through {station.stnName} in real-time. 
              Our live station board provides up-to-the-minute updates on train delays, expected platform numbers, and scheduled timings for the next 4 hours.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <div className="glass-panel p-4 rounded-2xl">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
                  How to check live train arrivals at {station.stnName} ({code})?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  You can check the real-time live arrival and departure board for {station.stnName} directly on this RailPulse page. The board automatically refreshes to show trains arriving in the next 4 hours along with their expected delays and platform numbers.
                </p>
              </div>
              
              <div className="glass-panel p-4 rounded-2xl">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
                  Which city is {code} station located in?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {station.stnName} with the station code {code}{station.stnCity ? ` is located in ${station.stnCity}` : ' is a prominent railway station in India'}.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
