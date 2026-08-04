import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/', // Prevent Google from indexing raw API routes
    },
    sitemap: 'https://railpulse.co.in/sitemap.xml',
  };
}
