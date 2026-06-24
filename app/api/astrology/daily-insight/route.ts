import { NextRequest, NextResponse } from 'next/server';
import { getDailyInsight } from '@/lib/astrology';
import { BirthDetails } from '@/types/profile';

// POST: today's planetary insight for a set of birth details.
// (POST rather than GET so birth details travel in the body, not the query string.)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const birthDetails: BirthDetails = body.birthDetails || body;
    const insight = await getDailyInsight(birthDetails);
    return NextResponse.json(insight);
  } catch (err) {
    console.error('Daily insight error:', err);
    return NextResponse.json({ error: 'Failed to fetch daily insight' }, { status: 502 });
  }
}
