import { NextResponse } from 'next/server';
import { createHold, confirmReservation } from '@/lib/inventory';
import db from '@/lib/db';
import { requireAdminSession } from '@/lib/auth';

// POST /api/admin/reservations -> Create a Hold
export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (auth.status === 401) return NextResponse.json({ error: auth.error }, { status: 401 });

    const body = await request.json();
    const { inquiryId, items, eventDate, holdHours } = body;

    if (!inquiryId || !items || !eventDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const reservationId = await createHold(inquiryId, items, eventDate, holdHours || 24);
    
    // Update inquiry status
    await db.execute({
      sql: "UPDATE inquiries SET status = 'awaiting_deposit' WHERE id = ?",
      args: [inquiryId]
    });

    return NextResponse.json({ success: true, reservationId }, { status: 201 });
  } catch (error: any) {
    console.error('Reservation Hold Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create hold' }, { status: 500 });
  }
}

// PATCH /api/admin/reservations -> Confirm a Reservation
export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (auth.status === 401) return NextResponse.json({ error: auth.error }, { status: 401 });

    const body = await request.json();
    const { reservationId, action } = body; // action: 'confirm', 'cancel'

    if (!reservationId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'confirm') {
      const success = await confirmReservation(reservationId);
      if (success) {
        // Find inquiry and update status
        const { rows } = await db.execute({
          sql: "SELECT inquiry_id FROM reservations WHERE id = ?",
          args: [reservationId]
        });
        const resData = rows[0] as any;
        if (resData && resData.inquiry_id) {
          await db.execute({
            sql: "UPDATE inquiries SET status = 'confirmed' WHERE id = ?",
            args: [resData.inquiry_id]
          });
        }
      }
      return NextResponse.json({ success });
    } else if (action === 'cancel') {
      const res = await db.execute({
        sql: "UPDATE reservations SET status = 'cancelled' WHERE id = ?",
        args: [reservationId]
      });
      return NextResponse.json({ success: res.rowsAffected > 0 });
    } else if (action === 'override_fee') {
      const { overrideFee, reason } = body;
      const res = await db.execute({
        sql: `
          UPDATE reservations 
          SET override_delivery_fee = ?, override_reason = ?, overridden_by = 'admin', overridden_at = datetime('now')
          WHERE id = ?
        `,
        args: [overrideFee, reason || '', reservationId]
      });
      return NextResponse.json({ success: res.rowsAffected > 0 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Reservation Update Error:', error);
    return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 });
  }
}
