'use client';

import React, { useState } from 'react';
import { Search, ArrowRightLeft, Calendar } from 'lucide-react';
import { StationSearch } from '@/components/search/StationSearch';
import { SeatAvailability } from '@/components/journey/SeatAvailability';
import { format, addDays } from 'date-fns';

export default function SeatAvailabilityPage() {
  const [fromCode, setFromCode] = useState('');
  const [toCode, setToCode] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCode || !toCode || !date) return;

    setIsLoading(true);
    setError(null);
    setSearched(true);
    
    try {
      const res = await fetch(`/api/search/between?from=${fromCode.toUpperCase()}&to=${toCode.toUpperCase()}`);
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch trains');
      }
      
      setResults(json.data || []);
    } catch (err: any) {
      setError(err.message);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const swapStations = () => {
    const temp = fromCode;
    setFromCode(toCode);
    setToCode(temp);
  };

  return (
    <main className="min-h-screen pt-24 pb-32 md:pb-12 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Seat Availability
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Check availability, waitlist chances, and alternate routes.
          </p>
        </div>

        {/* Search Box */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-glass border border-slate-200/60 dark:border-slate-800/60 mb-8 relative z-10">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-end gap-4">
            
            <div className="w-full flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full">
                <StationSearch 
                  label="From Station"
                  placeholder="e.g. NDLS"
                  value={fromCode}
                  onChange={setFromCode}
                />
              </div>

              <button 
                type="button"
                onClick={swapStations}
                className="mt-6 sm:mt-6 p-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors shrink-0"
                title="Swap stations"
              >
                <ArrowRightLeft className="w-5 h-5 sm:rotate-0 rotate-90" />
              </button>

              <div className="w-full">
                <StationSearch 
                  label="To Station"
                  placeholder="e.g. BCT"
                  value={toCode}
                  onChange={setToCode}
                />
              </div>
            </div>

            <div className="w-full md:w-48 flex flex-col items-start gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                Journey Date
              </label>
              <div className="relative w-full">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="date"
                  value={date}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-10 pr-4 py-3.5 text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-rail-blue/50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !fromCode || !toCode || !date}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-rail-blue hover:bg-rail-blue-dark disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg shrink-0"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && (
          <div className="space-y-6">
            {isLoading && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-rail-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500 font-semibold">Finding trains and availability...</p>
              </div>
            )}

            {error && (
              <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center">
                <p className="text-rose-600 dark:text-rose-400 font-semibold">{error}</p>
              </div>
            )}

            {!isLoading && !error && results.length === 0 && (
              <div className="text-center py-12 glass-panel rounded-3xl">
                <p className="text-slate-500 font-bold text-lg">No trains found.</p>
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">
                    Found {results.length} trains
                  </h3>
                </div>

                {results.map((train) => (
                  <div key={train.TrainNumber} className="glass-panel rounded-3xl p-5 border border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-rail-blue bg-rail-blue/10 px-2 py-0.5 rounded-md">
                            {train.TrainNumber}
                          </span>
                          <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                            {train.TrainName}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          Departs {train.FromStation} at {train.DepTimeFrom}
                        </p>
                      </div>
                    </div>
                    
                    {/* Auto-expanded seat availability component */}
                    <SeatAvailability 
                      trainNumber={train.TrainNumber} 
                      date={date} 
                      sourceCode={fromCode.toUpperCase()} 
                      destCode={toCode.toUpperCase()} 
                      forceExpanded={true}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
