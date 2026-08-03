'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface Station {
  stnCode: string;
  stnName: string;
  stnCity: string;
}

export function StationSearch({
  value,
  onChange,
  placeholder,
  label
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  label: string;
}) {
  const [stations, setStations] = useState<Station[]>([]);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/data/stations.json')
      .then(r => r.json())
      .then(d => {
        if (d && d.stations) setStations(d.stations);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (value && stations.length > 0) {
      const st = stations.find(s => s.stnCode === value);
      if (st) setQuery(`${st.stnName} (${st.stnCode})`);
    } else if (!value) {
      setQuery('');
    }
  }, [value, stations]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query && !value ? stations.filter(s => 
    s.stnName.toLowerCase().includes(query.toLowerCase()) || 
    s.stnCode.toLowerCase().includes(query.toLowerCase()) ||
    s.stnCity.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 50) : [];

  return (
    <div className="relative flex-1 w-full" ref={wrapperRef}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">{label}</label>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            onChange(''); // clear actual value until selected
          }}
          onFocus={() => {
            setIsOpen(true);
            if (value) {
              setQuery('');
              onChange('');
            }
          }}
          placeholder={placeholder}
          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rail-blue/50"
        />
      </div>

      {isOpen && query.length > 1 && !value && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">No stations found</div>
          ) : (
            filtered.map(st => (
              <button
                key={st.stnCode}
                type="button"
                onClick={() => {
                  onChange(st.stnCode);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 last:border-0"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{st.stnName}</div>
                  <div className="text-xs text-slate-500">{st.stnCity}</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold font-mono">
                  {st.stnCode}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
