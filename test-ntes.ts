import { fetchNtesRaw } from './lib/ntes';

async function main() {
  try {
    // 12802 Purushottam Express, check for today or tomorrow
    const trainNo = "12802";
    // We don't strictly need a startDate if we just want live status, let's try with empty first
    // Or we can get the schedule first
    console.log("Fetching live status...");
    const data = await fetchNtesRaw(`service=TrainRunningMob&subService=ShowFullRunJson&trainNo=${trainNo}&startDate=`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
