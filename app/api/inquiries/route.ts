import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { calculateDrivingDistance } from '@/lib/routing';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      customer_name, phone, email, preferred_language, 
      event_date, start_time, end_time, 
      event_address, city, zip, items,
      preferred_payment_method
    } = body;
    
    // Validate preferred_payment_method
    const allowedPaymentMethods = ['zelle', 'venmo', 'cash', 'decide_later'];
    const safePaymentMethod = allowedPaymentMethods.includes(preferred_payment_method) ? preferred_payment_method : 'decide_later';

    const routing = await calculateDrivingDistance(event_address, city, "TX", zip);
    
    // Calculate subtotal
    let subtotal = 0;
    const itemPrices: { id: number; qty: number; price: number }[] = [];
    
    if (items && items.length > 0) {
      for (const item of items) {
        const { rows: products } = await db.execute({
          sql: 'SELECT base_price FROM products WHERE id = ?',
          args: [item.product_id]
        });
        const product = products[0] as any;
        const price = product ? product.base_price : 0;
        const qty = item.quantity || 1;
        subtotal += (price * qty);
        itemPrices.push({ id: item.product_id, qty, price });
      }
    }

    // Determine zone
    let zoneObj: any = null;
    if (routing.status !== 'failed') {
      const { rows: zones } = await db.execute({
        sql: `
          SELECT * FROM delivery_zones 
          WHERE active = 1 
            AND (? > min_miles OR (? = 0 AND min_miles = 0))
            AND (max_miles IS NULL OR ? <= max_miles)
          LIMIT 1
        `,
        args: [routing.distanceMiles, routing.distanceMiles, routing.distanceMiles]
      });
      zoneObj = zones[0] || null;
    }

    // Strict Server-Side Rejection
    if (routing.status === 'failed' || !zoneObj) {
      return NextResponse.json({ error: 'Delivery address could not be routed or is outside the service area.' }, { status: 400 });
    }
    
    let isBelowMinimum = subtotal > 0 && subtotal < zoneObj.minimum_order;
    if (isBelowMinimum) {
      return NextResponse.json({ error: `Order subtotal ($${subtotal}) is below the required minimum ($${zoneObj.minimum_order}) for this delivery zone.` }, { status: 400 });
    }

    let initialStatus = zoneObj.requires_staff_confirmation ? 'review_required' : 'new';

    const inquiryNumber = `INQ-${Date.now().toString().slice(-6)}`;

    const transaction = await db.transaction();
    let inquiryId: number | bigint | undefined;
    
    try {
      const insertInquiry = await transaction.execute({
        sql: `
          INSERT INTO inquiries (
            inquiry_number, customer_name, phone, email, preferred_language,
            event_date, start_time, end_time, event_address, city, zip,
            destination_latitude, destination_longitude, normalized_address,
            calculated_driving_miles, routing_provider, distance_status,
            delivery_fee, preferred_payment_method, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `,
        args: [
          inquiryNumber, customer_name, phone, email, preferred_language || 'en',
          event_date, start_time, end_time, event_address, city, zip,
          routing.lat || null, routing.lng || null, `${event_address}, ${city}, TX ${zip}`,
          routing.distanceMiles, routing.provider, routing.status,
          zoneObj.delivery_fee || 0, safePaymentMethod, initialStatus
        ]
      });

      inquiryId = insertInquiry.lastInsertRowid;
      if (!inquiryId) throw new Error("Failed to insert inquiry");

      if (itemPrices.length > 0) {
        for (const item of itemPrices) {
          await transaction.execute({
            sql: `INSERT INTO inquiry_items (inquiry_id, product_id, requested_quantity, quoted_price) VALUES (?, ?, ?, ?)`,
            args: [inquiryId, item.id, item.qty, item.price]
          });
        }
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    return NextResponse.json({ 
      success: true, 
      inquiryId: inquiryId ? inquiryId.toString() : undefined, 
      inquiryNumber,
      status: initialStatus,
      subtotal: subtotal,
      minimum_order: zoneObj.minimum_order
    }, { status: 201 });
  } catch (error: any) {
    console.error('Inquiry Creation Error:', error);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
