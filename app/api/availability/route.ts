import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  try {
    // No date = browse mode: return all active products, all available
    if (!date) {
      const { rows: products } = await db.execute('SELECT * FROM products WHERE active = 1');
      const result = products.map((p: any) => ({
        ...p,
        available: true,
        availableQuantity: p.total_quantity ?? 1,
      }));
      return NextResponse.json({ products: result });
    }

    // Date provided = check real availability
    const { checkDateAvailability } = await import('@/lib/inventory');
    const availability = await checkDateAvailability(date);
    return NextResponse.json({ date, products: availability });
  } catch (error: any) {
    console.error('Availability Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', detail: error?.message }, { status: 500 });
  }
}
