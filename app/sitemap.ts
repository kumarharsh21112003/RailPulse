import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import trainsData from '@/lib/all-trains.json';

// Next.js sitemap generation
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://railpulse.co.in';

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // Add all 5000+ trains to the sitemap
  const trainRoutes = trainsData.map((train: any) => ({
    url: `${baseUrl}/train/${train.number}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const, // Trains update frequently
    priority: 0.8,
  }));

  // Add all 8000+ stations to the sitemap
  let stationRoutes: MetadataRoute.Sitemap = [];
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'stations.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const stationsData = JSON.parse(fileContents);
    
    stationRoutes = stationsData.stations.map((station: any) => ({
      url: `${baseUrl}/station/${station.stnCode}`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const, 
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error generating sitemap for stations:', error);
  }

  return [...routes, ...trainRoutes, ...stationRoutes];
}
