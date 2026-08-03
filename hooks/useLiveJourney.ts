'use client';

import { useQuery } from '@tanstack/react-query';
import { LiveJourney } from '@/types/train';
import { ApiResponse } from '@/types/api';
import { useJourneyStore } from '@/store/journey';

async function fetchLiveJourney(trainId: string, date?: string): Promise<LiveJourney> {
  const url = date ? `/api/train/${trainId}?date=${date}` : `/api/train/${trainId}`;
  const res = await fetch(url);
  const json: ApiResponse<LiveJourney> = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Failed to fetch live journey');
  }
  return json.data;
}

export function useLiveJourney(trainId: string, date?: string) {
  const autoRefresh = useJourneyStore((state) => state.autoRefresh);

  return useQuery({
    queryKey: date ? ['liveJourney', trainId, date] : ['liveJourney', trainId],
    queryFn: () => fetchLiveJourney(trainId, date),
    enabled: Boolean(trainId),
    refetchInterval: autoRefresh && !date ? 10 * 1000 : false, // Don't auto-refresh past dates
    staleTime: 5 * 1000,
  });
}
