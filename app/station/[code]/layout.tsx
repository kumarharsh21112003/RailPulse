import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

interface LayoutProps {
  children: React.ReactNode;
  params: { code: string };
}

// Read stations data
function getStationDetails(stationCode: string) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'stations.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return data.stations.find((s: any) => s.stnCode.toUpperCase() === stationCode.toUpperCase());
  } catch (error) {
    console.error('Error reading stations.json:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const code = params.code.toUpperCase();
  const station = getStationDetails(code);
  
  if (!station) {
    return {
      title: `${code} Station Live Status - RailPulse`,
      description: `Check live train arrivals, departures, and schedule for station ${code} on RailPulse.`,
    };
  }

  const title = `${station.stnName} (${code}) Station Live Arrival & Departures - RailPulse`;
  const description = `Check live train running status, upcoming arrivals, departures, and delays for ${station.stnName} (${code}) railway station in real-time.`;

  return {
    title,
    description,
    keywords: [
      `${station.stnName} live departures`, 
      `${station.stnName} station upcoming trains`, 
      `${code} live arrivals`, 
      `trains at ${station.stnName} station`,
      `${station.stnCity} railway station`
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://railpulse.co.in/station/${code}`,
      images: [
        {
          url: `https://railpulse.co.in/api/og/station?code=${code}`,
          width: 1200,
          height: 630,
          alt: `${station.stnName} Live Arrivals and Departures`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`https://railpulse.co.in/api/og/station?code=${code}`],
    }
  };
}

export default function StationLayout({ children, params }: LayoutProps) {
  const code = params.code.toUpperCase();
  const station = getStationDetails(code);

  // Generate JSON-LD Structured Data for Google Rich Snippets
  const jsonLd = station ? {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${station.stnName} (${code}) Live Departures & Arrivals`,
    "description": `Check live train running status, upcoming arrivals, departures, and delays for ${station.stnName} (${code}) railway station in real-time.`,
    "url": `https://railpulse.co.in/station/${code}`,
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "RailPulse Train Tracker",
      "applicationCategory": "TravelApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR"
      }
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
