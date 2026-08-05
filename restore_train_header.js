const fs = require('fs');
const readline = require('readline');

async function processTranscript() {
  const fileStream = fs.createReadStream('/Users/kumarharsh/.gemini/antigravity-ide/brain/b5ab64b9-2ccf-4ea6-9c00-f4a897a6a04c/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const targetTime = new Date('2026-08-03T17:42:00Z');
  const fileContents = {};

  for await (const line of rl) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    if (new Date(entry.created_at) > targetTime) {
      break;
    }
    
    if (entry.type === 'VIEW_FILE' && entry.status === 'DONE' && entry.content) {
      const match = entry.content.match(/File Path: `file:\/\/(.+?)`[\s\S]*?Showing lines \d+ to \d+\n([\s\S]*?)The above content shows the entire, complete file contents/);
      if (match) {
        let filePath = decodeURIComponent(match[1]);
        let content = match[2];
        content = content.replace(/^\d+: /gm, '');
        content = content.replace(/^The following code has been modified to include a line number.*\n/, '');
        fileContents[filePath] = content;
      }
    }
  }

  const file = '/Users/kumarharsh/Downloads/resume maker/RailGaadi/components/journey/TrainHeader.tsx';
  if (fileContents[file]) {
    console.log(`Found FULL content for ${file}`);
    fs.writeFileSync(file, fileContents[file]);
  } else {
    console.log(`Could NOT find FULL content for ${file}`);
  }
}

processTranscript().catch(console.error);
