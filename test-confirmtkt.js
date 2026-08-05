const https = require('https');

https.get('https://www.confirmtkt.com/train-running-status/12802', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/var data = (\{.*?\});/);
    if (match) {
      try {
        const json = JSON.parse(match[1]);
        const schedule = json.Schedule;
        console.log("Total Stations:", schedule.length);
        const delayedStations = schedule.filter(s => s.arrivalDelay > 0 || s.departureDelay > 0 || s.DataChanged);
        console.log("Delayed/Changed Stations:", delayedStations.slice(-3).map(s => ({
            name: s.StationName, arr: s.ArrivalTime, del: s.arrivalDelay, changed: s.DataChanged
        })));
      } catch(e) {
        console.error("Parse error", e);
      }
    } else {
      console.log("Not found");
    }
  });
});
