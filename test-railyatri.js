const https = require('https');

const options = {
  hostname: 'www.railyatri.in',
  path: '/live-train-status/12802',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (match) {
      const json = JSON.parse(match[1]);
      const tt = json.props.pageProps.timeTableData['0'];
      if (tt && tt.length > 0) {
        console.log("timeTableData array length:", tt.length);
        console.log("First element keys:", Object.keys(tt[0]));
        // Find if there is a 'passed' or 'delay' or similar field
        const delayed = tt.filter(s => s.delay > 0 || s.status);
        console.log("First few stations:", tt.slice(0, 3).map(s => ({
            name: s.stn_name, arr: s.arr, dep: s.dep, delay: s.delay, arr_delay: s.arr_delay, dep_delay: s.dep_delay, actual_arr: s.actual_arr, actual_dep: s.actual_dep
        })));
      }
    }
  });
});
