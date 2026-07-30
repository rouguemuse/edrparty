import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { calculateDrivingDistance } from '@/lib/routing';

// Simple in-memory rate limiter for V1 (reset every 1 minute)
const rateLimitMap = new Map<string, number>();
setInterval(() => rateLimitMap.clear(), 60000);

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const count = rateLimitMap.get(ip) || 0;
  if (count > 20) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  rateLimitMap.set(ip, count + 1);

  let address, city, state, zip;
  try {
    const body = await request.json();
    address = body.address;
    city = body.city;
    state = body.state;
    zip = body.zip;
  } catch(e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!address || !city || !state || !zip) {
    return NextResponse.json({ error: 'Missing full address fields (address, city, state, zip)' }, { status: 400 });
  }

  try {
    const routing = await calculateDrivingDistance(address, city, state, zip);
    
    // Default fallback zone if routing failed or > 65
    let zoneObj = {
      name_en: 'Outside Standard Area',
      delivery_fee: null,
      minimum_order: 0,
      free_delivery_threshold: null,
      requires_staff_confirmation: 1,
      requires_custom_quote: 1
    };

    if (routing.status !== 'failed') {
      const { rows } = await db.execute({
        sql: `
          SELECT * FROM delivery_zones 
          WHERE active = 1 
            AND (? > min_miles OR (? = 0 AND min_miles = 0))
            AND (max_miles IS NULL OR ? <= max_miles)
          LIMIT 1
        `,
        args: [routing.distanceMiles, routing.distanceMiles, routing.distanceMiles]
      });
      const dbZone = rows[0] as any;
      
      if (dbZone) {
        zoneObj = dbZone;
      }
    }

    // Never return private origins, coordinates, or API keys.
    return NextResponse.json({
      success: true,
      distance_status: routing.status,
      calculated_miles: routing.status !== 'failed' ? Math.round(routing.distanceMiles * 10) / 10 : null,
      zone_name: zoneObj.name_en,
      delivery_fee: zoneObj.delivery_fee,
      minimum_order: zoneObj.minimum_order,
      free_delivery_threshold: zoneObj.free_delivery_threshold,
      requires_staff_confirmation: zoneObj.requires_staff_confirmation === 1,
      requires_custom_quote: zoneObj.requires_custom_quote === 1 || routing.status === 'failed',
    });

  } catch (error: any) {
    console.error('Distance API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
