import { MetadataRoute } from 'next';
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

  return [...routes, ...trainRoutes];
}
