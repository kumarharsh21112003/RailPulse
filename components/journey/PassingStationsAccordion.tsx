import React, { useState, useEffect } from 'react';
import { Station } from '@/types/train';
import { ChevronDown, MapPin, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function PassingStationsAccordion({ from, to, distanceCoveredKm = 0 }: { from: Station; to: Station; distanceCoveredKm?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen || stations.length > 0) return;

    const fetchStations = async () => {
      setLoading(true);
      try {
        const url = `/api/passing-stations?fromLat=${from.lat}&fromLng=${from.lng}&toLat=${to.lat}&toLng=${to.lng}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.path) {
          // Exclude the first and last station since they are the halts themselves
          const passing = data.path.slice(1, -1);
          setStations(passing);
        } else {
          setError(true);
        }
      } catch (e) {
        setError(true);
      }
      setLoading(false);
    };

    if (from.lat && from.lng && to.lat && to.lng) {
      fetchStations();
    } else {
      setError(true);
    }
  }, [isOpen, from.lat, from.lng, to.lat, to.lng, stations.length]);

  if (!from.lat || !from.lng || !to.lat || !to.lng) return null;

  const isStationPassed = (s: any) => {
    if (distanceCoveredKm >= to.distanceKm) return true;
    if (distanceCoveredKm <= from.distanceKm) return false;
    
    const distFromStart = haversine(from.lat, from.lng, s.lat, s.lon);
    return (from.distanceKm + distFromStart) <= distanceCoveredKm;
  };

  return (
    <div className="ml-2 my-2 border-l-2 border-dashed border-slate-200 dark:border-slate-800 pl-4 py-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-rail-blue transition-colors"
      >
        <span>{isOpen ? 'Hide' : 'View'} Passing Stations {stations.length > 0 && `(${stations.length})`}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="mt-3 flex flex-col gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {loading && (
            <div className="text-xs text-slate-400 animate-pulse">Calculating shortest path...</div>
          )}
          {error && (
            <div className="text-xs text-red-400">Failed to load route data</div>
          )}
          {!loading && !error && stations.length === 0 && (
            <div className="text-xs text-slate-400">No intermediate stations found</div>
          )}
          {!loading && !error && stations.length > 0 && stations.map((s, idx) => {
            const passed = isStationPassed(s);
            return (
              <div key={idx} className={cn("flex items-center gap-3", passed ? "opacity-75" : "")}>
                {passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                )}
                <span className={cn(
                  "text-xs font-medium truncate",
                  passed ? "text-emerald-600 dark:text-emerald-500" : "text-slate-600 dark:text-slate-400"
                )}>
                  {s.name} {s.ref && !s.ref.includes(':') ? `(${s.ref})` : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
