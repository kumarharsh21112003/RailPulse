import { Metadata } from 'next';
import trainsData from '@/lib/all-trains.json';

interface LayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

// Find train in our static DB
function getTrainDetails(trainId: string) {
  return trainsData.find((t: any) => t.number === trainId);
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const train = getTrainDetails(params.id);
  
  if (!train) {
    return {
      title: `Train ${params.id} Live Status - RailPulse`,
      description: `Track live running status, schedule, and map for Train ${params.id} on RailPulse.`,
    };
  }

  const title = `${train.number} ${train.name} Live Running Status & Map - RailPulse`;
  const description = `Track live train running status, exact location, delay, and route map for ${train.number} ${train.name} running from ${train.from} to ${train.to}.`;

  return {
    title,
    description,
    keywords: [
      `${train.number} live status`, 
      `${train.name} running status`, 
      `where is my train ${train.number}`, 
      `train ${train.number} map`,
      `${train.from} to ${train.to} train`
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://railpulse.co.in/train/${params.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export default function TrainLayout({ children, params }: LayoutProps) {
  const train = getTrainDetails(params.id);

  // Generate JSON-LD Structured Data for Google Rich Snippets
  const jsonLd = train ? {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${train.number} ${train.name} Live Running Status`,
    "description": `Track live train running status, exact location, delay, and route map for ${train.number} ${train.name} running from ${train.from} to ${train.to}.`,
    "url": `https://railpulse.co.in/train/${train.number}`,
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
