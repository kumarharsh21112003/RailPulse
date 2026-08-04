import { NextResponse } from 'next/server';
import { fetchLiveStation } from '@/lib/ntes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request, { params }: { params: { code: string } }) {
  const code = params.code?.toUpperCase();
  
  if (!code) {
    return NextResponse.json({ success: false, error: 'Station code is required' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const hrs = parseInt(searchParams.get('hrs') || '4', 10);

  try {
    const data = await fetchLiveStation(code, hrs);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error(`[LiveStation API Error]`, error);
    return NextResponse.json({ success: false, error: 'Failed to fetch live station data' }, { status: 500 });
  }
}
