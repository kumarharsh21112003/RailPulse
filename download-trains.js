const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/datameet/railways/master/trains.json';

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const geojson = JSON.parse(data);
      const trains = geojson.features.map(f => ({
        number: f.properties.number,
        name: f.properties.name,
        from: f.properties.from_station_name,
        fromCode: f.properties.from_station_code,
        to: f.properties.to_station_name,
        toCode: f.properties.to_station_code,
      }));
      
      fs.writeFileSync('./lib/all-trains.json', JSON.stringify(trains, null, 2));
      console.log(`Saved ${trains.length} trains to lib/all-trains.json`);
    } catch (err) {
      console.error(err);
    }
  });
}).on('error', (err) => {
  console.error(err);
});
