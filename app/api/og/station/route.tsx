import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs'; // Use Node.js runtime since we need 'fs' to read stations.json

function getStationDetails(stationCode: string) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'stations.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return data.stations.find((s: any) => s.stnCode.toUpperCase() === stationCode.toUpperCase());
  } catch (error) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stationCode = searchParams.get('code');

    if (!stationCode) {
      return new Response('Missing code parameter', { status: 400 });
    }

    const station = getStationDetails(stationCode);

    if (!station) {
      return new Response('Station not found', { status: 404 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#020617', // slate-950
            backgroundImage: 'linear-gradient(to bottom right, #020617, #0f172a, #1e3a8a)',
            color: 'white',
            padding: '40px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
          }}
        >
          {/* Top Brand Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'absolute',
              top: '40px',
              left: '50px',
            }}
          >
            <div
              style={{
                background: '#0ea5e9', // sky-500
                padding: '8px 16px',
                borderRadius: '99px',
                color: '#fff',
                fontSize: 24,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)',
              }}
            >
              RailPulse Live
            </div>
            <div style={{ marginLeft: 20, fontSize: 24, color: '#94a3b8', display: 'flex' }}>
              Station Status
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: '40px',
              textAlign: 'center',
            }}
          >
            {/* Live Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(16, 185, 129, 0.2)', // emerald transparent
                border: '1px solid rgba(16, 185, 129, 0.4)',
                padding: '12px 24px',
                borderRadius: '999px',
                color: '#34d399',
                fontSize: 24,
                fontWeight: 'bold',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  background: '#34d399',
                  borderRadius: '50%',
                  marginRight: '12px',
                }}
              />
              Live Departures & Arrivals
            </div>

            {/* Station Details */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  background: 'rgba(14, 165, 233, 0.1)',
                  color: '#38bdf8',
                  padding: '8px 24px',
                  borderRadius: '16px',
                  fontSize: 42,
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  marginRight: '24px',
                  border: '1px solid rgba(14, 165, 233, 0.2)',
                }}
              >
                {stationCode.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 64,
                  fontWeight: '900',
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(to right, #fff, #94a3b8)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {station.stnName}
              </div>
            </div>

            {station.stnCity && (
              <div
                style={{
                  fontSize: 32,
                  color: '#94a3b8',
                  marginTop: '10px',
                  fontWeight: '500',
                }}
              >
                {station.stnCity}
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
