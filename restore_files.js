const fs = require('fs');
const readline = require('readline');

async function processTranscript() {
  const fileStream = fs.createReadStream('/Users/kumarharsh/.gemini/antigravity-ide/brain/b5ab64b9-2ccf-4ea6-9c00-f4a897a6a04c/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const targetTime = new Date('2026-08-03T17:42:00Z');
  
  // Track the content of files
  const fileContents = {};

  for await (const line of rl) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    
    // Stop processing if we passed the target time
    if (new Date(entry.created_at) > targetTime) {
      break;
    }
    
    // Check for VIEW_FILE output (contains the whole file)
    if (entry.type === 'VIEW_FILE' && entry.status === 'DONE' && entry.content) {
      const match = entry.content.match(/File Path: `file:\/\/(.+?)`[\s\S]*?Showing lines \d+ to \d+\n([\s\S]*?)The above content shows the entire, complete file contents/);
      if (match) {
        let filePath = decodeURIComponent(match[1]);
        let content = match[2];
        // Remove line numbers
        content = content.replace(/^\d+: /gm, '');
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
    '/Users/kumarharsh/Downloads/resume maker/RailGaadi/components/journey/CoachPosition.tsx',
    '/Users/kumarharsh/Downloads/resume maker/RailGaadi/components/journey/JourneyCard.tsx',
    '/Users/kumarharsh/Downloads/resume maker/RailGaadi/components/journey/PunctualityGauge.tsx',
    '/Users/kumarharsh/Downloads/resume maker/RailGaadi/components/journey/SeatAvailability.tsx'
  ];

  for (const file of targetFiles) {
    if (fileContents[file]) {
      console.log(`Found content for ${file}`);
      fs.writeFileSync(file, fileContents[file]);
    } else {
      console.log(`Could NOT find complete content for ${file} before target time.`);
    }
  }
}

processTranscript().catch(console.error);
