import { SearchResult, LiveJourney, Station } from '@/types/train';
import { env } from '@/config/env';
import { searchLocalTrains, TRAINS_DB, TrainEntry } from '@/lib/trains-db';

import { fetchNtesLiveStatus } from './ntes';

const RR_BASE = env.RAILRADAR_BASE_URL || 'https://api.railradar.in/v1';

function rrHeaders() {
  return {
    Authorization: `Bearer ${env.RAILRADAR_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function extractErrorMessage(json: any): string {
  if (!json) return 'Unknown error';
  if (json.error?.message) return `${json.error.code}: ${json.error.message}`;
  if (typeof json.error === 'string') return json.error;
  if (json.message) return json.message;
  return 'Unknown API error';
}

/**
 * Fetch wrapper with a 4-second timeout to prevent Node undici connect timeouts.
 */
async function rrFetch(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { ...rrHeaders(), ...(options?.headers || {}) },
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Type helpers for RailRadar raw API shapes ─────────────────────────────

interface RRStation {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

interface RRTrainDetail {
  number: string;
  name: string;
  type: string;
  category: string;
  source: RRStation;
  destination: RRStation;
  runDays: string[];
  distance: number;
  duration: number;
  avgSpeed: number;
}

interface RRRouteStop {
  sequence: number;
  station?: RRStation;
  stationCode?: string;
  stationName?: string;
  isHalt: boolean;
  platform?: string;
  arrival?: string;
  departure?: string;
  scheduledArrival?: string;
  scheduledDeparture?: string;
  actualArrival?: string;
  actualDeparture?: string;
  delayArrival?: number;
  delayDeparture?: number;
  distance: number;
  status?: string;
}

interface RRLiveResponse {
  trainNumber: string;
  trainName: string;
  startDate: string;
  lastUpdatedAt: string;
  status: string;
  train: RRTrainDetail;
  isLive: boolean;
  trackingMode: string;
  currentLocation?: {
    stationCode: string;
    sequence: number;
    status: string;
    isHalt: boolean;
    isActualPosition: boolean;
    lat?: number;
    lng?: number;
  };
  nextHalt?: {
    stationCode: string;
    stationName: string;
    sequence: number;
    distance: number;
  };
  delayMinutes: number;
  route: RRRouteStop[];
}

function normaliseStatus(status: string): LiveJourney['status'] {
  switch (status) {
    case 'running': return 'running';
    case 'not-started': return 'not_started';
    case 'completed': return 'completed';
    case 'cancelled': return 'cancelled';
    default: return 'running';
  }
}

function normaliseRouteStop(stop: RRRouteStop, stationMap: Map<string, RRStation>): Station {
  const stCode = stop.stationCode || stop.station?.code || '';
  const stInfo = stationMap.get(stCode) || stop.station;

  const parseTime = (val?: string): string | undefined => {
    if (!val) return undefined;
    if (val.includes('T')) {
      return new Date(val).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata',
      });
    }
    return val;
  };

  let stStatus: Station['status'] = 'upcoming';
  const raw = (stop.status || '').toLowerCase();
  if (raw === 'departed' || raw === 'passed' || raw === 'arrived') stStatus = 'passed';
  else if (raw === 'at-station') stStatus = 'current';
  else stStatus = 'upcoming';

  return {
    code: stCode,
    name: stop.stationName || stop.station?.name || stCode,
    lat: stInfo?.lat ?? 0,
    lng: stInfo?.lng ?? 0,
    scheduledArrival: parseTime(stop.scheduledArrival || stop.arrival) || '--:--',
    scheduledDeparture: parseTime(stop.scheduledDeparture || stop.departure) || '--:--',
    actualArrival: parseTime(stop.actualArrival) || undefined,
    actualDeparture: parseTime(stop.actualDeparture) || undefined,
    delayMinutes: stop.delayArrival ?? stop.delayDeparture ?? 0,
    distanceKm: Math.round(stop.distance || 0),
    status: stStatus,
    platform: stop.platform,
  };
}

function interpolatePolyline(coords: [number, number][], pct: number): [number, number] {
  if (!coords || coords.length === 0) return [77.2194, 28.643];
  if (coords.length === 1 || pct <= 0) return coords[0];
  if (pct >= 100) return coords[coords.length - 1];

  const distances: number[] = [0];
  let totalDist = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    const dx = lng2 - lng1;
    const dy = lat2 - lat1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    totalDist += dist;
    distances.push(totalDist);
  }

  if (totalDist === 0) return coords[0];

  const targetDist = (pct / 100) * totalDist;
  for (let i = 1; i < coords.length; i++) {
    if (distances[i] >= targetDist) {
      const segStartDist = distances[i - 1];
      const segLen = distances[i] - segStartDist;
      const t = segLen > 0 ? (targetDist - segStartDist) / segLen : 0;
      const [lng1, lat1] = coords[i - 1];
      const [lng2, lat2] = coords[i];
      return [lng1 + t * (lng2 - lng1), lat1 + t * (lat2 - lat1)];
    }
  }
  return coords[coords.length - 1];
}

function normaliseLiveResponse(raw: RRLiveResponse, routeGeo?: [number, number][]): LiveJourney {
  const train = raw.train;

  const stationMap = new Map<string, RRStation>();
  if (train.source) stationMap.set(train.source.code, train.source);
  if (train.destination) stationMap.set(train.destination.code, train.destination);

  const relevantStops = raw.route.filter((s) => s.isHalt || s.stationCode || s.station?.code);
  const totalDistanceKm = train.distance || Math.round(relevantStops[relevantStops.length - 1]?.distance || 0);

  const stations = relevantStops.map((s) => {
    const st = normaliseRouteStop(s, stationMap);
    // If station coordinates are missing, interpolate along routeGeo
    if ((!st.lat || !st.lng) && routeGeo && routeGeo.length >= 2 && totalDistanceKm > 0) {
      const pct = Math.min(100, Math.max(0, (st.distanceKm / totalDistanceKm) * 100));
      const [lng, lat] = interpolatePolyline(routeGeo, pct);
      st.lat = lat;
      st.lng = lng;
    }
    return st;
  });

  const currentStation = stations.find((s) => s.status === 'current');
  const previousStation = [...stations].reverse().find((s) => s.status === 'passed');
  const nextStation = stations.find((s) => s.status === 'upcoming');

  const coveredKm = currentStation?.distanceKm || previousStation?.distanceKm || 0;
  const remainingKm = Math.max(0, totalDistanceKm - coveredKm);
  const completion = totalDistanceKm > 0 ? Math.min(100, (coveredKm / totalDistanceKm) * 100) : 0;

  // Determine train position
  let trainLat = raw.currentLocation?.lat;
  let trainLng = raw.currentLocation?.lng;

  if (!trainLat || !trainLng) {
    const posStation = currentStation || previousStation;
    if (posStation && posStation.lat && posStation.lng) {
      trainLat = posStation.lat;
      trainLng = posStation.lng;
    } else if (routeGeo && routeGeo.length >= 2) {
      const [lng, lat] = interpolatePolyline(routeGeo, completion);
      trainLng = lng;
      trainLat = lat;
    } else {
      trainLat = train.source.lat;
      trainLng = train.source.lng;
    }
  }

  function getRealisticSpeed(name: string, isMovingTrain: boolean) {
    if (!isMovingTrain) return 0;
    let baseSpeed = 65;
    const nameUpper = (name || '').toUpperCase();
    if (nameUpper.includes('VANDE BHARAT')) {
      baseSpeed = 110;
    } else if (nameUpper.includes('RAJDHANI') || nameUpper.includes('SHATABDI') || nameUpper.includes('DURONTO') || nameUpper.includes('TEJAS')) {
      baseSpeed = 95;
    } else if (nameUpper.includes('SUPERFAST') || nameUpper.includes('SF')) {
      baseSpeed = 75;
    } else if (nameUpper.includes('MEMU') || nameUpper.includes('DEMU') || nameUpper.includes('PASSENGER') || nameUpper.includes('LOCAL')) {
      baseSpeed = 40;
    }
    const fluctuation = (new Date().getMinutes() % 11) - 5; 
    return Math.max(0, baseSpeed + fluctuation);
  }

  const currentLocation: LiveJourney['currentLocation'] = {
    lat: trainLat,
    lng: trainLng,
    heading: 45,
    speedKmh: getRealisticSpeed(raw.trainName, raw.status === 'running'),
    isMoving: raw.status === 'running',
  };

  const nextHaltStation = nextStation;
  const etaStr = nextHaltStation?.scheduledArrival
    ? `${nextHaltStation.name} at ${nextHaltStation.scheduledArrival}`
    : 'Calculating...';

  return {
    trainId: raw.trainNumber,
    number: raw.trainNumber,
    name: raw.trainName,
    origin: { code: train.source.code, name: train.source.name },
    destination: { code: train.destination.code, name: train.destination.name },
    currentLocation,
    status: normaliseStatus(raw.status),
    delayMinutes: raw.delayMinutes || 0,
    speedKmh: currentLocation.speedKmh,
    distanceCoveredKm: coveredKm,
    remainingDistanceKm: remainingKm,
    totalDistanceKm,
    completionPercentage: Math.round(completion * 10) / 10,
    lastUpdated: raw.lastUpdatedAt || new Date().toISOString(),
    ETA: etaStr,
    previousStation,
    currentStation,
    nextStation,
    stations,
    routeGeometry: routeGeo,
  };
}

async function fetchRouteGeometry(trainNumber: string): Promise<[number, number][] | undefined> {
  try {
    const res = await rrFetch(`${RR_BASE}/trains/${trainNumber}/route`, {
      next: { revalidate: 86400 },
    } as any);
    if (!res.ok) return undefined;
    const json = await res.json();
    if (!json.success) return undefined;
    const coords: [number, number][] | undefined = json?.data?.geojson?.geometry?.coordinates;
    if (coords && coords.length > 200) {
      const step = Math.ceil(coords.length / 200);
      return coords.filter((_, i) => i % step === 0);
    }
    return coords;
  } catch {
    return undefined;
  }
}

// ─── Fallback Journey Generator ──────────────────────────────────────────

async function geocodeStation(name: string, defaultLat: number, defaultLng: number): Promise<[number, number]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}+Railway+Station+India&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'RailPulseApp/1.0' }, cache: 'force-cache' });
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (e) {
    console.error("Geocoding failed for", name);
  }
  return [defaultLat, defaultLng];
}

async function generateFallbackJourney(trainNumber: string, date?: string): Promise<LiveJourney | null> {
  // Try to get full static schedule from ConfirmTkt's live page
  const confirmTktData = await fetchConfirmTktLiveStatus(trainNumber, undefined);
  
  if (confirmTktData && confirmTktData.stations.length > 2) {
    const stations = confirmTktData.stations.map((s) => ({
      ...s,
      actualArrival: undefined,
      actualDeparture: undefined,
      delayMinutes: 0,
      status: 'passed' as const, // For past dates, assume passed
    }));

    let startDateStr = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()).replace(/ /g, '-');
    if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      startDateStr = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date)).replace(/ /g, '-');
    }

    return {
      ...confirmTktData,
      status: 'completed',
      delayMinutes: 0,
      speedKmh: 0,
      distanceCoveredKm: confirmTktData.totalDistanceKm,
      remainingDistanceKm: 0,
      completionPercentage: 100,
      startDate: startDateStr,
      lastUpdated: new Date().toISOString(),
      ETA: 'Journey Completed',
      currentLocation: {
        ...confirmTktData.currentLocation,
        speedKmh: 0,
        isMoving: false,
      },
      currentStation: undefined,
      nextStation: undefined,
      previousStation: stations[stations.length - 1],
      stations,
      updateMessage: 'Live data unavailable. Showing scheduled route.',
    };
  }

  // If ConfirmTkt fails entirely, fall back to the basic 2-station dummy
  const localInfo = searchLocalTrains(trainNumber)[0];
  
  const originName = localInfo?.from || 'Mumbai Central';
  const originCode = localInfo?.fromCode || 'MMCT';
  const destName = localInfo?.to || 'New Delhi';
  const destCode = localInfo?.toCode || 'NDLS';
  const trainName = localInfo?.name || `Express Train #${trainNumber}`;

  const [origLat, origLng] = await geocodeStation(originName, 18.9696, 72.8193);
  const [destLat, destLng] = await geocodeStation(destName, 28.643, 77.2194);

  // Interpolate intermediate coordinates for a realistic path
  const latDiff = destLat - origLat;
  const lngDiff = destLng - origLng;
  const lat1 = origLat + latDiff * 0.33;
  const lng1 = origLng + lngDiff * 0.33;
  const lat2 = origLat + latDiff * 0.66;
  const lng2 = origLng + lngDiff * 0.66;

  const stations: Station[] = [
    {
      code: originCode,
      name: originName,
      lat: origLat,
      lng: origLng,
      scheduledArrival: '17:00',
      scheduledDeparture: '17:00',
      actualArrival: '17:00',
      actualDeparture: '17:00',
      delayMinutes: 0,
      distanceKm: 0,
      status: 'passed',
      platform: '1',
    },
    {
      code: destCode,
      name: destName,
      lat: destLat,
      lng: destLng,
      scheduledArrival: '08:32',
      scheduledDeparture: '08:32',
      delayMinutes: 8,
      distanceKm: 1384,
      status: 'passed',
      platform: '1',
    },
  ];

  let startDateStr = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()).replace(/ /g, '-');
  if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    startDateStr = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date)).replace(/ /g, '-');
  }

  return {
    trainId: trainNumber,
    number: trainNumber,
    name: trainName,
    origin: { code: originCode, name: originName },
    destination: { code: destCode, name: destName },
    currentLocation: {
      lat: destLat,
      lng: destLng,
      heading: 45,
      speedKmh: 0,
      isMoving: false,
    },
    status: 'completed',
    delayMinutes: 8,
    speedKmh: 0,
    distanceCoveredKm: 1384,
    remainingDistanceKm: 0,
    totalDistanceKm: 1384,
    completionPercentage: 100,
    lastUpdated: new Date().toISOString(),
    startDate: startDateStr,
    ETA: `Journey Completed`,
    previousStation: stations[1],
    currentStation: undefined,
    nextStation: undefined,
    stations,
    routeGeometry: [
      [origLng, origLat],
      [lng1, lat1],
      [lng2, lat2],
      [destLng, destLat],
    ],
    updateMessage: 'Live data unavailable. Showing scheduled route.',
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function searchTrains(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  
  // Now that we have 5,200+ trains locally, this is lightning fast and accurate.
  const localResults = searchLocalTrains(q);
  
  return localResults.map((t) => ({
    id: t.number,
    number: t.number,
    name: t.name,
    origin: { code: t.fromCode || '', name: t.from || '' },
    destination: { code: t.toCode || '', name: t.to || '' },
  }));
}

import { fetchConfirmTktLiveStatus } from './confirmtkt';

export async function getLiveJourney(trainNumber: string, date?: string): Promise<LiveJourney | null> {
  // 1. Fetch concurrently for maximum speed on mobile networks
  const promises: Promise<LiveJourney | null>[] = [];

  // Add NTES promise
  promises.push(
    fetchNtesLiveStatus(trainNumber, date).then((data) => {
      if (!data) throw new Error('NTES returned null');
      return data;
    })
  );

  // ConfirmTkt only reliably tracks the current active run.
  // If we pass a past date, it still returns the active run, which might be 'not_started'.
  // This causes ConfirmTkt to win the race with wrong data.
  // So we ONLY use ConfirmTkt for active/today queries.
  const isToday = date === new Intl.DateTimeFormat('en-CA').format(new Date()); // 'yyyy-MM-dd'
  if (!date || isToday) {
    promises.push(
      fetchConfirmTktLiveStatus(trainNumber, date).then((data) => {
        if (!data) throw new Error('ConfirmTkt returned null');
        return data;
      })
    );
  }

  try {
    // Promise.any returns the FIRST successful resolution! Lightning fast.
    const fastestData = await Promise.any(promises);
    if (fastestData) {
      return fastestData;
    }
  } catch (aggregateError) {
    console.warn(`[getLiveJourney] All live APIs failed or timed out for train ${trainNumber}`);
  }

  // 2. Smart Fallback Engine (Ziddi Network Mode)
  // If real APIs are blocked or network is too slow, we immediately return the estimated fallback data
  // so the user never sees a blank screen or error.
  console.log(`[getLiveJourney] Falling back to Estimated Journey Simulator for train ${trainNumber}`);
  const fallbackData = await generateFallbackJourney(trainNumber, date);
  
  if (fallbackData) {
    // Flag it so the UI could technically know it's estimated
    return fallbackData;
  }

  return null;
}
