import { NextResponse } from 'next/server';
import { checkDateAvailability } from '@/lib/inventory';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
  }

  try {
    const availability = checkDateAvailability(date);
    return NextResponse.json({ date, products: availability });
  } catch (error: any) {
    console.error('Availability Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
