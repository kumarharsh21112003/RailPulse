import { NextRequest, NextResponse } from 'next/server';
import { fetchPnrStatus } from '@/lib/confirmtkt';

export async function GET(
  req: NextRequest,
  { params }: { params: { pnr: string } }
) {
  try {
    const pnr = params.pnr;
    
    if (!pnr || pnr.length !== 10) {
      return NextResponse.json({ success: false, error: 'Valid 10-digit PNR is required' }, { status: 400 });
    }

    const data = await fetchPnrStatus(pnr);
    
    if (!data || data.Error) {
       return NextResponse.json({ success: false, error: data?.Error || 'Invalid PNR or data not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error(`PNR Fetch Error:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PNR status' },
      { status: 500 }
    );
  }
}
