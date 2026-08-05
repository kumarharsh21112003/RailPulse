async function test() {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'RailPulse App/1.0 (harsh@example.com)'
    },
    body: `data=[out:json];node(1);out;`,
  });
  console.log(res.status);
}
test();
