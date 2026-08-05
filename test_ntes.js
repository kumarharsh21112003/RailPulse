const crypto = require('crypto');

function createNTESPayload(data) {
  const jsonStr = JSON.stringify(data);
  const key = Buffer.from('8082420235263640', 'utf8');
  const iv = Buffer.from('8082420235263640', 'utf8');
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);
  return encrypted.toString('base64');
}

function decryptNTESResponse(base64Data) {
  const key = Buffer.from('8082420235263640', 'utf8');
  const iv = Buffer.from('8082420235263640', 'utf8');
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(base64Data, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}

async function run() {
  const date = new Date();
  const jDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
  const reqData = {
    trainNo: '12951', // Rajdhani
    jStation: 'MMCT',
    jDate: jDate,
    crsKey: 'someKey',
    ver: '13.0',
    aVer: '82'
  };
  const bodyBase64 = createNTESPayload(reqData);
  const res = await fetch('https://enquiry.indianrail.gov.in/crisns/AppServAnd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qry: bodyBase64, action: 'getTrainUpdate' })
  });
  const data = await res.json();
  const decrypted = decryptNTESResponse(data.qry);
  const parsed = JSON.parse(decrypted);
  
  console.log("Total STNS:", parsed.STNS ? parsed.STNS.length : 0);
  console.log(JSON.stringify(parsed, null, 2).substring(0, 1500));
}
run();
