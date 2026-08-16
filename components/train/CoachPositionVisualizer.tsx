"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Train, Info, MapPin, LayoutGrid } from 'lucide-react';
import { SeatMap } from './SeatMap';

const STANDARD_CONSIST = [
  'ENG', 'EOG', 'GS', 'GS', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'PC', 
  'B1', 'B2', 'B3', 'B4', 'B5', 'A1', 'A2', 'H1', 'GS', 'SLR'
];

export function CoachPositionVisualizer({ trainNumber }: { trainNumber: string }) {
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  const [showSeatMap, setShowSeatMap] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const coachRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (selectedCoach && coachRefs.current[selectedCoach] && scrollRef.current) {
      const coachElement = coachRefs.current[selectedCoach];
      const container = scrollRef.current;
      
      const scrollTop = coachElement.offsetTop - (container.offsetHeight / 2) + (coachElement.offsetHeight / 2);
      
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
    // Auto-hide seat map when coach changes
    setShowSeatMap(false);
  }, [selectedCoach]);

  const selectedIndex = selectedCoach ? STANDARD_CONSIST.indexOf(selectedCoach) : -1;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 mt-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Train className="w-6 h-6 text-blue-500" />
            Coach Position & Platform Locator
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Standard composition for train {trainNumber}. Actual layout may vary slightly.
          </p>
        </div>

        <div className="w-full md:w-64">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Your Coach</label>
          <select 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            value={selectedCoach || ''}
            onChange={(e) => setSelectedCoach(e.target.value)}
          >
            <option value="" disabled>Select Coach</option>
            {STANDARD_CONSIST.map((coach, idx) => (
              coach !== 'ENG' && (
                <option key={`${coach}-${idx}`} value={coach}>
                  {coach}
                </option>
              )
            ))}
          </select>
        </div>
      </div>

      {selectedCoach && selectedIndex !== -1 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 flex items-start gap-3"
        >
          <div className="mt-0.5">
            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-blue-900 dark:text-blue-100 font-semibold">
              Coach <span className="text-xl px-1 font-bold">{selectedCoach}</span> is <span className="text-xl px-1 font-bold">{selectedIndex}</span> coaches away from the Engine.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Stand approximately {selectedIndex * 25} meters from where the engine stops.
              </p>
              
              {/* Only show Seat Map button for valid reserved coaches */}
              {!['ENG', 'EOG', 'PC', 'GS', 'SLR'].includes(selectedCoach) && (
                <button
                  onClick={() => setShowSeatMap(!showSeatMap)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  {showSeatMap ? 'Hide Seat Layout' : 'View Seat Layout'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedCoach && showSeatMap && (
          <SeatMap coachCode={selectedCoach} />
        )}
      </AnimatePresence>

      {/* Train Track Visualizer */}
      <div className="relative mt-8 bg-slate-50 dark:bg-slate-900/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
        <div 
          ref={scrollRef}
          className="relative z-10 flex flex-col items-center gap-2 h-[450px] overflow-y-auto py-8 scroll-smooth hide-scrollbar snap-y snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Vertical Track Line */}
          <div className="absolute top-0 bottom-0 w-1 bg-slate-300 dark:bg-slate-700 rounded-full z-0 left-1/2 -translate-x-1/2" />
          
          {STANDARD_CONSIST.map((coach, idx) => {
            const isEngine = coach === 'ENG';
            const isSelected = coach === selectedCoach;
            
            return (
              <div 
                key={`${coach}-${idx}`}
                ref={(el) => { coachRefs.current[coach] = el; }}
                className={`snap-center flex-shrink-0 flex flex-col items-center transition-all duration-300 z-10 ${isSelected ? 'scale-110 my-4' : ''}`}
                onClick={() => !isEngine && setSelectedCoach(coach)}
              >
                {/* Connecting Joint (Vertical) */}
                {idx > 0 && (
                  <div className="w-1 h-3 bg-slate-400 dark:bg-slate-600 my-0.5" />
                )}
                
                {/* Coach Body */}
                <div 
                  className={`
                    relative w-32 h-16 rounded-lg flex flex-col items-center justify-center font-bold text-xl cursor-pointer
                    shadow-sm border-2 transition-colors
                    ${isEngine 
                      ? 'bg-rose-500 border-rose-600 text-white rounded-t-[1.5rem] rounded-b-md cursor-default' 
                      : isSelected 
                        ? 'bg-blue-500 border-blue-600 text-white ring-4 ring-blue-500/30' 
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500'
                    }
                  `}
                >
                  {coach}
                  
                  {/* Sequence Number Label */}
                  <div className={`absolute text-[10px] font-medium opacity-80 ${isEngine ? 'top-1 text-rose-100' : 'bottom-1 text-slate-400 dark:text-slate-500'}`}>
                    {idx === 0 ? 'Engine' : `#${idx}`}
                  </div>

                  {/* Engine specific styling (Headlight etc) */}
                  {isEngine && (
                    <div className="absolute top-1.5 w-10 h-1 bg-rose-300 rounded-full opacity-60" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-8 flex items-start gap-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 text-xs text-slate-500">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>This layout represents the standard ICF/LHB rake composition. The actual coach position on the platform may be reversed depending on the direction of travel and the station layout. Always listen to station announcements.</p>
      </div>
    </div>
  );
}
