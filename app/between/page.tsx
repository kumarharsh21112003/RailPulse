'use client';

import React, { useState } from 'react';
import { Search, ArrowRightLeft } from 'lucide-react';
import BetweenTrainsResults from '@/components/between-trains-results';
import { StationSearch } from '@/components/search/StationSearch';

export default function BetweenStationsPage() {
  const [fromCode, setFromCode] = useState('');
  const [toCode, setToCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCode || !toCode) return;

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
            Trains Between Stations
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Find direct trains, schedules, and live running status.
          </p>
        </div>

        {/* Search Box */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-glass border border-slate-200/60 dark:border-slate-800/60 mb-8 relative z-10">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-4">
            
            <StationSearch 
              label="From Station"
              placeholder="Enter station name..."
              value={fromCode}
              onChange={setFromCode}
            />

            <button 
              type="button"
              onClick={swapStations}
              className="mt-6 sm:mt-6 p-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors shrink-0"
              title="Swap stations"
            >
              <ArrowRightLeft className="w-5 h-5 sm:rotate-0 rotate-90" />
            </button>

            <StationSearch 
              label="To Station"
              placeholder="Enter station name..."
              value={toCode}
              onChange={setToCode}
            />

            <button
              type="submit"
              disabled={isLoading || !fromCode || !toCode}
              className="mt-6 sm:mt-6 w-full sm:w-auto flex items-center justify-center gap-2 bg-rail-blue hover:bg-rail-blue-dark disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg shrink-0"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Find Trains</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && (
          <BetweenTrainsResults 
            trains={results} 
            isLoading={isLoading} 
            error={error} 
          />
        )}
      </div>
    </main>
  );
}
