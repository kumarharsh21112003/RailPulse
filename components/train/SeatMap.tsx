"use client";

import React from 'react';
import { motion } from 'framer-motion';

type BerthType = 'LOWER' | 'MIDDLE' | 'UPPER' | 'SIDE_LOWER' | 'SIDE_UPPER' | 'UNKNOWN';

interface Seat {
  number: number;
  type: BerthType;
}

interface Compartment {
  id: number;
  mainSeats: Seat[];
  sideSeats: Seat[];
}

function getBerthColor(type: BerthType) {
  switch (type) {
    case 'LOWER': return 'bg-blue-500 border-blue-600 text-white';
    case 'MIDDLE': return 'bg-emerald-500 border-emerald-600 text-white';
    case 'UPPER': return 'bg-amber-500 border-amber-600 text-white';
    case 'SIDE_LOWER': return 'bg-indigo-500 border-indigo-600 text-white';
    case 'SIDE_UPPER': return 'bg-purple-500 border-purple-600 text-white';
    default: return 'bg-slate-200 border-slate-300 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300';
  }
}

// Generate 3AC / Sleeper (8 seats per compartment)
function generate3AC(totalSeats: number = 72): Compartment[] {
  const compartments: Compartment[] = [];
  let seatNum = 1;
  let compId = 1;

  while (seatNum <= totalSeats) {
    const mainSeats: Seat[] = [];
    const sideSeats: Seat[] = [];

    // Left side (3 seats)
    if (seatNum <= totalSeats) mainSeats.push({ number: seatNum++, type: 'LOWER' });
    if (seatNum <= totalSeats) mainSeats.push({ number: seatNum++, type: 'MIDDLE' });
    if (seatNum <= totalSeats) mainSeats.push({ number: seatNum++, type: 'UPPER' });

    // Right side (3 seats)
    if (seatNum <= totalSeats) mainSeats.push({ number: seatNum++, type: 'LOWER' });
    if (seatNum <= totalSeats) mainSeats.push({ number: seatNum++, type: 'MIDDLE' });
    if (seatNum <= totalSeats) mainSeats.push({ number: seatNum++, type: 'UPPER' });

    // Side berths (2 seats)
    if (seatNum <= totalSeats) sideSeats.push({ number: seatNum++, type: 'SIDE_LOWER' });
    if (seatNum <= totalSeats) sideSeats.push({ number: seatNum++, type: 'SIDE_UPPER' });

    compartments.push({ id: compId++, mainSeats, sideSeats });
  }
  return compartments;
}

// Generate 2AC (6 seats per compartment)
function generate2AC(totalSeats: number = 54): Compartment[] {
  const compartments: Compartment[] = [];
  let seatNum = 1;
  let compId = 1;

  while (seatNum <= totalSeats) {
    const mainSeats: Seat[] = [];
    const sideSeats: Seat[] = [];

    // Left side (2 seats)
    if (seatNum <= totalSeats) mainSeats.push({ number: seatNum++, type: 'LOWER' });
    if (seatNum <= totalSeats) mainSeats.push({ number: seatNum++, type: 'UPPER' });

    // Right side (2 seats)
    if (seatNum <= totalSeats) mainSeats.push({ number: seatNum++, type: 'LOWER' });
    if (seatNum <= totalSeats) mainSeats.push({ number: seatNum++, type: 'UPPER' });

    // Side berths (2 seats)
    if (seatNum <= totalSeats) sideSeats.push({ number: seatNum++, type: 'SIDE_LOWER' });
    if (seatNum <= totalSeats) sideSeats.push({ number: seatNum++, type: 'SIDE_UPPER' });

    compartments.push({ id: compId++, mainSeats, sideSeats });
  }
  return compartments;
}

function getCoachLayout(coachCode: string) {
  const prefix = coachCode.replace(/[0-9]/g, '');
  if (prefix === 'B' || prefix === 'S' || prefix === 'G') return { type: '3AC/Sleeper', data: generate3AC(prefix === 'S' || prefix === 'G' ? 80 : 72) };
  if (prefix === 'A') return { type: '2AC', data: generate2AC(54) };
  if (prefix === 'H') return { type: '1AC', data: [] }; // 1AC logic is more complex (Coupes/Cabins), skip visual map for now
  if (prefix === 'C' || prefix === 'D' || prefix === 'E') return { type: 'Chair Car', data: [] }; // Chair car layout is 3x2, to be implemented
  return { type: 'UNRESERVED', data: [] };
}

export function SeatMap({ coachCode }: { coachCode: string }) {
  const { type, data } = getCoachLayout(coachCode);

  if (data.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800 mt-4">
        <p className="text-slate-500 font-medium">Visual seat layout is not available for {coachCode} ({type === '1AC' ? 'First AC cabins' : type === 'Chair Car' ? 'Chair Car seating' : 'Unreserved/Pantry'}).</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-6 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm"
    >
      <div className="bg-slate-100 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200">
          Seat Layout: Coach {coachCode} <span className="text-sm font-normal text-slate-500 ml-2">({type})</span>
        </h3>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Lower</div>
          {type !== '2AC' && <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Middle</div>}
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-500 rounded-sm"></div> Upper</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> Side Lower</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-purple-500 rounded-sm"></div> Side Upper</div>
        </div>
      </div>

      <div className="p-4 md:p-6 overflow-x-auto hide-scrollbar">
        <div className="min-w-[600px] flex items-stretch gap-2 bg-slate-200/50 dark:bg-slate-900/50 p-3 rounded-xl">
          
          {/* Render each compartment horizontally */}
          {data.map((comp) => (
            <div key={comp.id} className="flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 gap-4 shadow-sm w-32 flex-shrink-0">
              <div className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider mb-1 border-b border-slate-100 dark:border-slate-700 pb-1">
                Cabin {comp.id}
              </div>
              
              {/* Main Seats (Left & Right facing each other) */}
              <div className="flex justify-between w-full h-32">
                <div className="flex flex-col justify-between h-full w-10">
                  {comp.mainSeats.slice(0, comp.mainSeats.length / 2).map((s) => (
                    <div key={s.number} className={`flex items-center justify-center w-full h-8 text-[11px] font-bold rounded shadow-sm border ${getBerthColor(s.type)}`}>
                      {s.number}
                    </div>
                  ))}
                </div>
                
                {/* Aisle Space */}
                <div className="w-6 h-full flex flex-col items-center justify-center opacity-30">
                  <div className="w-0.5 h-full bg-slate-300 dark:bg-slate-600 border-l border-dashed"></div>
                </div>

                <div className="flex flex-col justify-between h-full w-10">
                  {comp.mainSeats.slice(comp.mainSeats.length / 2).map((s) => (
                    <div key={s.number} className={`flex items-center justify-center w-full h-8 text-[11px] font-bold rounded shadow-sm border ${getBerthColor(s.type)}`}>
                      {s.number}
                    </div>
                  ))}
                </div>
              </div>

              {/* Aisle Horizontal Walkway */}
              <div className="w-full h-6 bg-slate-50 dark:bg-slate-900/50 rounded flex items-center justify-center">
                <div className="w-full h-0.5 bg-slate-300 dark:bg-slate-600 border-t border-dashed opacity-50"></div>
              </div>

              {/* Side Seats */}
              <div className="flex justify-between w-full h-10">
                {comp.sideSeats.map((s) => (
                  <div key={s.number} className={`flex items-center justify-center w-[45%] h-full text-[11px] font-bold rounded shadow-sm border ${getBerthColor(s.type)}`}>
                    {s.number}
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>
      </div>
    </motion.div>
  );
}
