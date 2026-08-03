// Static database of popular Indian trains for instant offline search.
// The live API is used only for tracking — search stays fast and offline.

export interface TrainEntry {
  number: string;
  name: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
}

import allTrains from './all-trains.json';

export interface TrainEntry {
  number: string;
  name: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
}

export const TRAINS_DB: TrainEntry[] = allTrains as TrainEntry[];

/**
 * Search trains from the static database.
 * Matches against number, name, from/to station names and codes.
 */
export function searchLocalTrains(query: string): TrainEntry[] {
  const q = query.trim().toLowerCase();
  
  // Return popular Rajdhani/Shatabdi trains by default if no query
  if (!q) {
    return TRAINS_DB.filter(t => t.name.toLowerCase().includes('rajdhani') || t.name.toLowerCase().includes('shatabdi')).slice(0, 15);
  }

  return TRAINS_DB.filter(
    (t) =>
      (t.number && t.number.startsWith(q)) ||
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.from && t.from.toLowerCase().includes(q)) ||
      (t.to && t.to.toLowerCase().includes(q)) ||
      (t.fromCode && t.fromCode.toLowerCase().includes(q)) ||
      (t.toCode && t.toCode.toLowerCase().includes(q))
  ).slice(0, 15);
}
