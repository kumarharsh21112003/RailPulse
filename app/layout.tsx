import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import QueryProvider from '@/providers/query-provider';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'RailPulse — Live Indian Train Tracker',
  description:
    'Experience train tracking redefined. Real-time Indian Railways tracking with interactive vector maps, delay analytics, weather intelligence, and terrain insights.',
  keywords: [
    'train tracking', 'RailPulse', 'live train status', 'Indian Railways', 'train map', 'IRCTC train', 
    'spot your train', 'ntes live status', 'where is my train', 'train running status', 
    'live station departures', 'train delay status', 'exact train location map', 
    'PNR status', 'seat availability'
  ],
  authors: [{ name: 'Kumar Harsh' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RailPulse',
  },
  openGraph: {
    title: 'RailPulse — Live Indian Train Tracker',
    description: 'Real-time train tracking with interactive maps and delay analytics.',
    type: 'website',
    locale: 'en_IN',
  },
};

export const viewport: Viewport = {
  themeColor: '#0284c7',
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://api.railradar.in" />
        <link rel="preconnect" href="https://api.maptiler.com" />
        <link rel="preconnect" href="https://api.openweathermap.org" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2898236477566874"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${inter.className} min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`}
      >
        <QueryProvider>
          <Navbar />
          <main className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full pb-24 md:pb-6">
            {children}
          </main>
          <BottomNav />
        </QueryProvider>
      </body>
    </html>
  );
}

