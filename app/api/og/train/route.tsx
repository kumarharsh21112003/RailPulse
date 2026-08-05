import { ImageResponse } from 'next/og';
import trainsData from '@/lib/all-trains.json';

export const runtime = 'edge';

// Font configuration
// We can use default sans-serif font provided by ImageResponse for simplicity, 
// or load a custom font. For speed, we'll stick to system fonts that look great.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trainNo = searchParams.get('trainNo');

    if (!trainNo) {
      return new Response('Missing trainNo parameter', { status: 400 });
    }

    const train = trainsData.find((t: any) => t.number === trainNo);

    if (!train) {
      return new Response('Train not found', { status: 404 });
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
              GPS Train Tracking
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
                  borderRadius: '50%',
                  background: '#10b981',
                  marginRight: '12px',
                }}
              />
              LIVE RUNNING STATUS
            </div>

            {/* Train Name and Number */}
            <div style={{ display: 'flex', fontSize: 72, fontWeight: 900, marginBottom: '20px', color: '#f8fafc', textAlign: 'center', maxWidth: '1000px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {train.name}
            </div>
            
            <div style={{ display: 'flex', fontSize: 48, fontWeight: 700, color: '#38bdf8' }}>
              Train #{train.number}
            </div>

            {/* Route */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '50px',
                fontSize: 32,
                color: '#cbd5e1',
                fontWeight: 500,
                background: 'rgba(255,255,255,0.1)',
                padding: '20px 40px',
                borderRadius: '24px',
              }}
            >
              <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{train.from}</span>
              <span style={{ margin: '0 20px', color: '#64748b' }}> ➔ </span>
              <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{train.to}</span>
            </div>
          </div>

          {/* Footer Call to action */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              bottom: '40px',
              fontSize: 24,
              color: '#94a3b8',
              fontWeight: 500,
            }}
          >
            Click to see exact location and delay on map
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
    return new Response('Failed to generate image', { status: 500 });
  }
}
