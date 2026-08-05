const fs = require('fs');
const readline = require('readline');

async function processTranscript() {
  const fileStream = fs.createReadStream('/Users/kumarharsh/.gemini/antigravity-ide/brain/b5ab64b9-2ccf-4ea6-9c00-f4a897a6a04c/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const fileContents = {};

  for await (const line of rl) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    
    if (entry.type === 'VIEW_FILE' && entry.status === 'DONE' && entry.content) {
      const match = entry.content.match(/File Path: `file:\/\/(.+?)`[\s\S]*?Showing lines \d+ to \d+\n([\s\S]*?)The above content shows the entire, complete file contents/);
      if (match) {
        let filePath = decodeURIComponent(match[1]);
        if (filePath.endsWith('lib/ntes.ts')) {
          let content = match[2];
          content = content.replace(/^\d+: /gm, '');
          fileContents[filePath] = content;
        }
      }
    }
  }

  if (fileContents['/Users/kumarharsh/Downloads/resume maker/RailGaadi/lib/ntes.ts']) {
    console.log("Found OLD ntes.ts");
    fs.writeFileSync('ntes_old.ts', fileContents['/Users/kumarharsh/Downloads/resume maker/RailGaadi/lib/ntes.ts']);
  }
}

processTranscript().catch(console.error);
