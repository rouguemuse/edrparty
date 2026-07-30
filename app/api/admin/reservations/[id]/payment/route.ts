import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdminSession } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdminSession();
    if (auth.status === 401) return NextResponse.json({ error: auth.error }, { status: 401 });

    const reservationId = parseInt(params.id, 10);
    const body = await request.json();
    const { 
      event_type, 
      amount_cents, 
      payment_method, 
      payment_reference, 
      note, 
      idempotency_key,
      reverses_event_id,
      void_reason
    } = body;

    // Strict Validations
    if (!reservationId || isNaN(reservationId)) {
      return NextResponse.json({ error: 'Invalid reservation ID' }, { status: 400 });
    }

    if (!idempotency_key) {
      return NextResponse.json({ error: 'idempotency_key is required to prevent duplicate submissions' }, { status: 400 });
    }

    if (!['retainer', 'payment', 'refund', 'reversal'].includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 });
    }

    if (typeof amount_cents !== 'number' || amount_cents < 0 || !Number.isInteger(amount_cents)) {
      return NextResponse.json({ error: 'amount_cents must be a positive integer' }, { status: 400 });
    }

    if (event_type === 'reversal' && !reverses_event_id) {
      return NextResponse.json({ error: 'reverses_event_id is required for a reversal' }, { status: 400 });
    }

    if (event_type === 'reversal' && !void_reason) {
      return NextResponse.json({ error: 'void_reason is required for a reversal' }, { status: 400 });
    }

    const transaction = await db.transaction();

    try {
      // 1. Verify idempotency
      const { rows: duplicateCheck } = await transaction.execute({
        sql: 'SELECT id FROM payment_events WHERE idempotency_key = ?',
        args: [idempotency_key]
      });
      if (duplicateCheck.length > 0) {
        throw new Error('Duplicate payment submission detected.');
      }

      // 2. Fetch reservation
      const { rows: reservations } = await transaction.execute({
        sql: 'SELECT * FROM reservations WHERE id = ?',
        args: [reservationId]
      });
      if (reservations.length === 0) {
        throw new Error('Reservation not found');
      }
      const reservation = reservations[0] as any;

      // 3. Insert payment event
      let finalNote = note || '';
      if (event_type === 'reversal') finalNote = `Void Reason: ${void_reason}`;
      
      await transaction.execute({
        sql: `
          INSERT INTO payment_events (
            reservation_id, event_type, amount_cents, payment_method, payment_reference, 
            note, recorded_by, created_at, idempotency_key, reverses_event_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
        `,
        args: [
          reservationId, event_type, amount_cents, payment_method || null, payment_reference || null,
          finalNote, auth.admin, idempotency_key, reverses_event_id || null
        ]
      });

      // 4. Recalculate totals
      const { rows: events } = await transaction.execute({
        sql: 'SELECT event_type, amount_cents FROM payment_events WHERE reservation_id = ?',
        args: [reservationId]
      });

      let total_paid_cents = 0;
      for (const ev of events) {
        const amt = ev.amount_cents as number;
        if (ev.event_type === 'retainer' || ev.event_type === 'payment') {
          total_paid_cents += amt;
        } else if (ev.event_type === 'refund' || ev.event_type === 'reversal') {
          total_paid_cents -= amt;
        }
      }

      const grand_total_cents = reservation.grand_total_cents || 0;
      const balance_due_cents = Math.max(grand_total_cents - total_paid_cents, 0);

      // Check retainer fulfillment for "Confirmed" status
      let newStatus = reservation.status;
      const required_retainer = reservation.booking_retainer_cents || 0;
      
      // Calculate how much retainer money specifically was received (not total payments)
      // Actually, any payment counts towards the retainer requirement.
      if (total_paid_cents >= required_retainer && reservation.status === 'awaiting_deposit' && reservation.agreement_accepted_at) {
        newStatus = 'confirmed';
      }

      // 5. Update reservation
      let paymentStatus = 'Pending confirmation';
      if (grand_total_cents > 0 && total_paid_cents >= grand_total_cents && balance_due_cents === 0) {
        paymentStatus = 'Paid in full';
      } else if (total_paid_cents > 0) {
        paymentStatus = 'Partial payment';
      }

      await transaction.execute({
        sql: `
          UPDATE reservations SET 
            payment_status = ?,
            balance_due_cents = ?,
            status = ?
          WHERE id = ?
        `,
        args: [paymentStatus, balance_due_cents, newStatus, reservationId]
      });

      await transaction.commit();
      
      return NextResponse.json({ 
        success: true, 
        total_paid_cents, 
        balance_due_cents,
        payment_status: paymentStatus
      }, { status: 200 });

    } catch (err: any) {
      await transaction.rollback();
      throw err;
    }

  } catch (error: any) {
    console.error('Payment Error:', error);
    if (error.message.includes('Duplicate payment submission')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Failed to update payment ledger' }, { status: 500 });
  }
}
