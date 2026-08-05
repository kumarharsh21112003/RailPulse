import { fetchNtesLiveStatus } from './lib/ntes';
async function test() {
  const todayStr = '04-Aug-2026';
  const yesterdayStr = '03-Aug-2026';
  
  const dToday = await fetchNtesLiveStatus('13308', todayStr);
  console.log('Today:', dToday ? { status: dToday.status, startDate: dToday.startDate } : 'null');
  
  const dYest = await fetchNtesLiveStatus('13308', yesterdayStr);
  console.log('Yesterday:', dYest ? { status: dYest.status, startDate: dYest.startDate } : 'null');
}
test();
