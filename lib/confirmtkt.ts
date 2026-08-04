import { LiveJourney, Station } from '@/types/train';
import * as cheerio from 'cheerio';
import stationCoords from '@/lib/station-coords.json';

function parseDelay(delayStr: string | number): number {
  if (typeof delayStr === 'number') return delayStr;
  if (!delayStr || delayStr === '-') return 0;
  const match = delayStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export async function fetchConfirmTktLiveStatus(trainNumber: string, date?: string): Promise<LiveJourney | null> {
  // ConfirmTkt might ignore the date parameter and always return live running data.
  // We can pass the date in the format they expect if we reverse engineer it, 
  // but for now we'll just hit the main page.
  const url = `https://www.confirmtkt.com/train-running-status/${trainNumber}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for 2G networks
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 0 },
      signal: controller.signal
    });
    
    if (!res.ok) return null;
    
    const html = await res.text();
    const match = html.match(/var data = (\{.*?\});/);
    if (!match) return null;
    
    const json = JSON.parse(match[1]);
    if (!json || !json.Schedule || json.Schedule.length === 0) return null;
    
    const schedule = json.Schedule;
    let totalDist = 0;
    
    const stations: Station[] = schedule.map((s: any) => {
      const dist = parseFloat(s.Distance) || 0;
      totalDist = Math.max(totalDist, dist);
      
      // Determine status
      let status: 'passed' | 'current' | 'upcoming' = 'upcoming';
      if (s.DataChanged || s.arrivalDelay !== '-' || s.departureDelay !== '-' || s.actualArrival) {
         // This is a rough heuristic. If we want we can check if current time is past arrival.
         // Actually, ConfirmTkt has a `passed` boolean? Let's assume upcoming by default.
      }
      
      // ConfirmTkt doesn't easily expose "passed", but usually DataChanged implies it passed.
      // We will refine status later based on current station.
      
      const code = s.StationCode;
      const coords = (stationCoords as any)[code];

      return {
        code,
        name: s.StationName,
        lat: s.Latitude || (coords ? coords[1] : 0),
        lng: s.Longitude || (coords ? coords[0] : 0),
        scheduledArrival: s.ArrivalTime || '--:--',
        scheduledDeparture: s.DepartureTime || '--:--',
        actualArrival: s.actualArrival || undefined,
        actualDeparture: undefined, // Add if available
        delayMinutes: Math.max(parseDelay(s.arrivalDelay), parseDelay(s.departureDelay)),
        distanceKm: dist,
        status: 'upcoming',
        platform: s.ExpectedPlatformNo || s.Platform || '',
      };
    });
    
    // Attempt to guess current station
    let currentIdx = -1;
    if (json.StationCode) {
      currentIdx = schedule.findIndex((s: any) => s.StationCode === json.StationCode);
    } else {
      // Iterate backwards looking for actual arrival or departure time (not just delays)
      for (let i = stations.length - 1; i >= 0; i--) {
        const s = schedule[i];
        if (s.DataChanged || s.actualArrival || s.actualDeparture) {
           currentIdx = i;
           break;
        }
      }
    }
    
    if (currentIdx === -1) {
      // maybe not started
    } else {
      for (let i = 0; i < currentIdx; i++) stations[i].status = 'passed';
      stations[currentIdx].status = 'current';
    }

    const currentStation = currentIdx !== -1 ? stations[currentIdx] : undefined;
    const previousStation = currentIdx > 0 ? stations[currentIdx - 1] : undefined;
    const nextStation = currentIdx !== -1 && currentIdx < stations.length - 1 ? stations[currentIdx + 1] : undefined;
    const distanceCoveredKm = currentStation ? currentStation.distanceKm : 0;
    
    let journeyStatus: LiveJourney['status'] = 'running';
    if (currentIdx === -1) journeyStatus = 'not_started';
    else if (currentIdx === stations.length - 1) journeyStatus = 'completed';
    else if (currentStation && currentStation.delayMinutes > 0) journeyStatus = 'delayed';

    // If the train hasn't started, ConfirmTkt sometimes returns bogus delay values from the previous day.
    // We should zero them out to prevent confusing "+43m delay" UI for a train that hasn't even begun.
    if (journeyStatus === 'not_started') {
      stations.forEach(s => s.delayMinutes = 0);
    }

    return {
      trainId: trainNumber,
      number: trainNumber,
      name: json.TrainName || ('Train ' + trainNumber),
      origin: { code: stations[0].code, name: stations[0].name },
      destination: { code: stations[stations.length - 1].code, name: stations[stations.length - 1].name },
      status: journeyStatus,
      delayMinutes: currentStation ? currentStation.delayMinutes : 0,
      speedKmh: 0,
      distanceCoveredKm,
      remainingDistanceKm: Math.max(0, totalDist - distanceCoveredKm),
      totalDistanceKm: totalDist,
      completionPercentage: totalDist > 0 ? (distanceCoveredKm / totalDist) * 100 : 0,
      lastUpdated: new Date().toISOString(),
      stations,
      currentStation,
      previousStation,
      nextStation,
      ETA: '',
      currentLocation: {
        lat: (currentStation || previousStation || stations[0])?.lat || 0,
        lng: (currentStation || previousStation || stations[0])?.lng || 0,
        heading: 0,
        speedKmh: 0,
        isMoving: journeyStatus === 'running'
      },
      routeGeometry: stations
        .filter(s => s.lat !== 0 && s.lng !== 0)
        .map(s => [s.lng, s.lat] as [number, number])
    };
  } catch (err) {
    console.error("ConfirmTkt fetch error:", err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchPnrStatus(pnr: string): Promise<any | null> {
  const url = `https://www.confirmtkt.com/pnr-status/${pnr}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 0 }
    });
    
    if (!res.ok) return null;
    
    const html = await res.text();
    const match = html.match(/var data = (\{.*?\});/);
    if (!match) return null;
    
    const json = JSON.parse(match[1]);
    return json;
  } catch (err) {
    console.error("ConfirmTkt PNR fetch error:", err);
    return null;
  }
}
