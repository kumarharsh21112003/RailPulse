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
        // Remove line numbers (e.g. "12: ")
        content = content.replace(/^\d+: /gm, '');
        // Remove the preamble
        content = content.replace(/^The following code has been modified to include a line number.*\n/, '');
        fileContents[filePath] = content;
      }
    }
  }

  const targetFiles = [
    '/Users/kumarharsh/Downloads/resume maker/RailGaadi/app/layout.tsx',
    '/Users/kumarharsh/Downloads/resume maker/RailGaadi/components/layout/Navbar.tsx',
    '/Users/kumarharsh/Downloads/resume maker/RailGaadi/styles/globals.css',
    '/Users/kumarharsh/Downloads/resume maker/RailGaadi/features/maps/MapView.tsx',
    '/Users/kumarharsh/Downloads/resume maker/RailGaadi/components/journey/Timeline.tsx',
    '/Users/kumarharsh/Downloads/resume maker/RailGaadi/components/journey/JourneyCard.tsx',
  ];

  for (const file of targetFiles) {
    if (fileContents[file]) {
      console.log(`Found FULL content for ${file}`);
      fs.writeFileSync(file, fileContents[file]);
    } else {
      console.log(`Could NOT find FULL content for ${file}`);
    }
  }
}

processTranscript().catch(console.error);
