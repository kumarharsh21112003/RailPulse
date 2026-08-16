"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Train, Info, MapPin } from 'lucide-react';

const STANDARD_CONSIST = [
  'ENG', 'EOG', 'GS', 'GS', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'PC', 
  'B1', 'B2', 'B3', 'B4', 'B5', 'A1', 'A2', 'H1', 'GS', 'SLR'
];

export function CoachPositionVisualizer({ trainNumber }: { trainNumber: string }) {
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const coachRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (selectedCoach && coachRefs.current[selectedCoach] && scrollRef.current) {
      const coachElement = coachRefs.current[selectedCoach];
      const container = scrollRef.current;
      
      const scrollLeft = coachElement.offsetLeft - (container.offsetWidth / 2) + (coachElement.offsetWidth / 2);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
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
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
              Stand approximately {selectedIndex * 25} meters from where the engine stops.
            </p>
          </div>
        </motion.div>
      )}

      {/* Train Track Visualizer */}
      <div className="relative mt-8">
        {/* The Track Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 rounded-full z-0" />
        
        <div 
          ref={scrollRef}
          className="relative z-10 flex items-center gap-2 overflow-x-auto py-4 px-4 scroll-smooth hide-scrollbar snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {STANDARD_CONSIST.map((coach, idx) => {
            const isEngine = coach === 'ENG';
            const isSelected = coach === selectedCoach;
            
            return (
              <div 
                key={`${coach}-${idx}`}
                ref={(el) => { coachRefs.current[coach] = el; }}
                className={`snap-center flex-shrink-0 flex items-center transition-all duration-300 ${isSelected ? 'scale-110 mx-2' : ''}`}
                onClick={() => !isEngine && setSelectedCoach(coach)}
              >
                {/* Connecting Joint */}
                {idx > 0 && (
                  <div className="w-2 h-1 bg-slate-400 dark:bg-slate-600" />
                )}
                
                {/* Coach Body */}
                <div 
                  className={`
                    relative h-16 rounded-lg flex items-center justify-center font-bold text-lg cursor-pointer
                    shadow-sm border-2 transition-colors
                    ${isEngine 
                      ? 'w-24 bg-rose-500 border-rose-600 text-white rounded-l-[2rem] rounded-r-md cursor-default' 
                      : isSelected 
                        ? 'w-20 bg-blue-500 border-blue-600 text-white ring-4 ring-blue-500/20' 
                        : 'w-20 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500'
                    }
                  `}
                >
                  {coach}
                  
                  {/* Wheels */}
                  <div className={`absolute -bottom-1.5 left-2 w-3 h-3 rounded-full ${isEngine ? 'bg-rose-900' : 'bg-slate-800 dark:bg-black'}`} />
                  <div className={`absolute -bottom-1.5 right-2 w-3 h-3 rounded-full ${isEngine ? 'bg-rose-900' : 'bg-slate-800 dark:bg-black'}`} />
                  
                  {/* Engine Window */}
                  {isEngine && (
                    <div className="absolute top-2 left-3 w-4 h-5 bg-sky-200 rounded-sm opacity-80" />
                  )}

                  {/* Coach Windows */}
                  {!isEngine && (
                    <div className="absolute top-2 left-0 right-0 flex justify-center gap-1.5 opacity-30">
                      <div className="w-3 h-3 bg-slate-900 rounded-sm" />
                      <div className="w-3 h-3 bg-slate-900 rounded-sm" />
                      <div className="w-3 h-3 bg-slate-900 rounded-sm" />
                    </div>
                  )}
                  
                  {/* Sequence Number Label */}
                  <div className="absolute -bottom-7 text-[10px] font-medium text-slate-400">
                    {idx === 0 ? 'Engine' : `#${idx}`}
                  </div>
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
