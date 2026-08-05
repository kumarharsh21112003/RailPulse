import { NextRequest, NextResponse } from 'next/server';
import { getTerrainFeatures, TerrainFeature } from '@/lib/overpass';
import { getLiveJourney } from '@/lib/railradar';
import { getCached, setCached } from '@/lib/cache';
import { ApiResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trainId = searchParams.get('trainId');
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');

  if (!trainId && (!latParam || !lngParam)) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'trainId or lat/lng is required', timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }

  let cacheKey = `terrain:${trainId}`;
  if (latParam && lngParam) {
    // Round to 1 decimal place (~11km precision) to reuse cache for nearby locations
    const latRound = parseFloat(latParam).toFixed(1);
    const lngRound = parseFloat(lngParam).toFixed(1);
    cacheKey = `terrain:loc:${latRound},${lngRound}`;
  }

  const cached = getCached<TerrainFeature[]>(cacheKey);
  if (cached) {
    return NextResponse.json<ApiResponse<TerrainFeature[]>>({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    let journey = null;
    if (trainId && (!latParam || !lngParam)) {
      journey = await getLiveJourney(trainId);
      if (!journey) {
        return NextResponse.json<ApiResponse<TerrainFeature[]>>({
          success: true,
          data: [],
          cached: false,
          timestamp: new Date().toISOString(),
        });
      }
    }

    let routeCoords: [number, number][] = [];

    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      // Create a localized bounding box around the current location (roughly ~50km radius)
      routeCoords = [
        [lng - 0.5, lat - 0.5],
        [lng + 0.5, lat + 0.5],
      ];
    } else if (journey) {
      routeCoords =
        journey.routeGeometry ||
        journey.stations.filter((s) => s.lat && s.lng).map((s) => [s.lng, s.lat] as [number, number]);
    }

    const features = await getTerrainFeatures(routeCoords);

    // Compute rough distance from first station for each feature
    const origin = journey?.stations[0];
    if (origin?.lat && origin?.lng) {
      features.forEach((f) => {
        const dlat = f.lat - origin.lat;
        const dlng = f.lng - origin.lng;
        f.distanceKm = Math.round(Math.sqrt(dlat * dlat + dlng * dlng) * 111);
      });
    }

    // Sort by distance
    features.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

    setCached(cacheKey, features, 86400); // 24h

    return NextResponse.json<ApiResponse<TerrainFeature[]>>({
      success: true,
      data: features,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: err.message || 'Terrain fetch failed', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
