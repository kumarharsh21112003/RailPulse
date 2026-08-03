import { useState, useEffect } from 'react';

export interface Station {
  stnCode: string;
  stnName: string;
  stnCity: string;
}

export function useStationSearch(query: string) {
  const [stations, setStations] = useState<Station[]>([]);
  const [results, setResults] = useState<Station[]>([]);

  useEffect(() => {
    fetch('/data/stations.json')
      .then(r => r.json())
      .then(d => {
        if (d && d.stations) setStations(d.stations);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const filtered = stations.filter(s => 
      s.stnName.toLowerCase().includes(q) || 
      s.stnCode.toLowerCase().includes(q) ||
      s.stnCity.toLowerCase().includes(q)
    ).slice(0, 10);
    setResults(filtered);
  }, [query, stations]);

  return { data: results };
}
