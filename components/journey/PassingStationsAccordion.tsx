import React, { useState, useEffect } from 'react';
import { Station } from '@/types/train';
import { ChevronDown, MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';

export function PassingStationsAccordion({ from, to }: { from: Station; to: Station }) {
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
          {!loading && !error && stations.length > 0 && stations.map((s, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate">
                {s.name} {s.ref && !s.ref.includes(':') ? `(${s.ref})` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
