import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trainNumber = searchParams.get('trainNumber');
  const date = searchParams.get('date');
  const source = searchParams.get('source');
  const destination = searchParams.get('destination');

  if (!trainNumber || !source || !destination) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Simulate network delay for realism
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1000));

  // Pseudo-random number generator based on a seed string
  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const seed = hashString(`${trainNumber}-${date}-${source}-${destination}`);
  
  // Deterministic random between min and max
  const randomRange = (min: number, max: number, offset: number) => {
    const val = (seed + offset) % (max - min + 1);
    return min + val;
  };

  const isWaitlisted = (seed % 100) < 65; // 65% chance of being waitlisted (realistic for Indian Railways)

  // Generate class availability based on seed
  const generateAvailability = (isWl: boolean, baseOffset: number) => {
    const classes = [
      { cls: '1A', price: randomRange(2500, 4500, baseOffset) },
      { cls: '2A', price: randomRange(1500, 2500, baseOffset + 1) },
      { cls: '3A', price: randomRange(1000, 1800, baseOffset + 2) },
      { cls: 'SL', price: randomRange(300, 800, baseOffset + 3) },
    ];

    return classes.map(c => {
      let status = '';
      let prediction = undefined;
      
      const specificWaitlist = isWl || (randomRange(0, 100, c.price) > 70); // Even if generally available, some classes might be WL

      if (specificWaitlist) {
        const wlType = randomRange(0, 100, c.price + 1) > 80 ? 'PQWL' : 'GNWL';
        const wlNum = randomRange(5, 150, c.price + 2);
        
        if (wlNum > 120 && c.cls === 'SL') {
          status = 'REGRET';
          prediction = '0%';
        } else {
          status = `${wlType} ${wlNum}`;
          const chance = wlNum < 20 ? randomRange(75, 95, c.price) : wlNum < 50 ? randomRange(40, 74, c.price) : randomRange(5, 39, c.price);
          prediction = `${chance}%`;
        }
      } else {
        const isRac = randomRange(0, 100, c.price + 3) > 80;
        if (isRac) {
          status = `RAC ${randomRange(1, 40, c.price + 4)}`;
        } else {
          status = `AVAILABLE ${randomRange(1, 150, c.price + 5)}`;
        }
      }

      return {
        class: c.cls,
        status,
        prediction,
        price: c.price
      };
    });
  };

  const primaryAvailability = generateAvailability(isWaitlisted, 0);

  let alternates: any[] = [];
  if (isWaitlisted) {
    // Generate realistic alternate route suggestions based on the actual source/dest
    alternates = [
      {
        id: `alt_${seed}_1`,
        boardingStation: source,
        boardingStationName: source,
        destinationStation: destination,
        delayHours: 0,
        availability: generateAvailability(false, 100).filter(a => a.status.includes('AVAILABLE') || a.status.includes('RAC')).slice(0, 2),
        message: `Hidden Quota: Book in Foreign Tourist / Tatkal Quota.`
      },
      {
        id: `alt_${seed}_2`,
        boardingStation: source,
        destinationStation: destination,
        delayHours: randomRange(2, 6, 200),
        availability: generateAvailability(false, 200).filter(a => a.status.includes('AVAILABLE')).slice(0, 1),
        message: `Board later or get down early for confirmed seats.`
      }
    ];
  }

  return NextResponse.json({
    status: isWaitlisted ? 'waitlist' : 'available',
    primary: {
      source,
      destination,
      availability: primaryAvailability
    },
    alternates
  });
}
