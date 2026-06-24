import { NextRequest, NextResponse } from 'next/server';
import { getNatalChart } from '@/lib/astrology';
import { BirthDetails } from '@/types/profile';

// POST: fetch the natal chart for a set of birth details.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const birthDetails: BirthDetails = body.birthDetails || body;
    const chart = await getNatalChart(birthDetails);
    return NextResponse.json(chart);
  } catch (err) {
    console.error('Birth chart error:', err);
    return NextResponse.json({ error: 'Failed to fetch natal chart' }, { status: 502 });
  }
}
