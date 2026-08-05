import { fetchNtesLiveStatus } from './lib/ntes';
async function test() {
  console.log("Fetching 03-Aug...");
  const data03 = await fetchNtesLiveStatus('12802', '03-Aug-2026');
  console.log("03-Aug:", data03 ? "SUCCESS" : "NULL");
  console.log("Fetching 04-Aug...");
  const data04 = await fetchNtesLiveStatus('12802', '04-Aug-2026');
  console.log("04-Aug:", data04 ? "SUCCESS" : "NULL");
}
test();
