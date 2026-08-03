import { NextRequest, NextResponse } from 'next/server';
import { fetchTrainsBetween } from '@/lib/ntes';
import { getCached, setCached } from '@/lib/cache';
import { ApiResponse } from '@/types/api';
import fs from 'fs';
import path from 'path';

function resolveStationCode(code: string): string {
  if (!code || code.length <= 4 && !code.includes(' ')) return code;
  try {
    const p = path.join(process.cwd(), 'public', 'data', 'stations.json');
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    // If it's something like "Gaya Junction (GAYA)", extract the code
    const matchParens = code.match(/\(([A-Z]+)\)$/i);
    if (matchParens) return matchParens[1].toUpperCase();

    const match = d.stations.find((s: any) => 
      s.stnName.toUpperCase() === code || 
      s.stnCity.toUpperCase() === code
    );
    if (match) return match.stnCode;
  } catch(e) {}
  return code;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let from = searchParams.get('from')?.toUpperCase() || '';
  let to = searchParams.get('to')?.toUpperCase() || '';

  if (!from || !to) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Both "from" and "to" station codes are required',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  from = resolveStationCode(from);
  to = resolveStationCode(to);

  const cacheKey = `between:${from}:${to}`;
  const cached = getCached<any[]>(cacheKey);
  
  if (cached) {
    return NextResponse.json<ApiResponse<any[]>>({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const trains = await fetchTrainsBetween(from, to);
    
    if (!trains || trains.length === 0) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'No trains found between these stations',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    setCached(cacheKey, trains, 3600); // cache for 1 hour

    return NextResponse.json<ApiResponse<any[]>>({
      success: true,
      data: trains,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: err.message || 'Failed to fetch trains between stations',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
