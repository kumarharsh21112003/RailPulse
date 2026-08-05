import { fetchNtesLiveStatus } from './lib/ntes';
async function test() {
  const data = await fetchNtesLiveStatus('12802', '01-Aug-2026');
  console.log(data ? JSON.stringify({
    status: data.status,
    stations: data.stations.length,
    originDate: data.origin,
    lastUpdate: data.lastUpdated
  }) : "NULL");
}
test();
