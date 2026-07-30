"use client";
import React, { useState } from 'react';

export default function PaymentEditor({ reservation }: { reservation: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [eventType, setEventType] = useState('retainer');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [reversesId, setReversesId] = useState('');
  const [voidReason, setVoidReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount && eventType !== 'reversal') {
      alert("Amount is required.");
      return;
    }
    
    setLoading(true);
    const amount_cents = Math.round(parseFloat(amount) * 100) || 0;
    
    try {
      const res = await fetch(`/api/admin/reservations/${reservation.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          amount_cents,
          payment_method: method,
          payment_reference: reference,
          note,
          idempotency_key: crypto.randomUUID(),
          reverses_event_id: reversesId ? parseInt(reversesId) : null,
          void_reason: voidReason
        })
      });
      if (res.ok) {
        alert('Ledger entry recorded successfully');
        window.location.reload();
      } else {
        const err = await res.json();
        alert('Error: ' + err.error);
      }
    } catch (err) {
      alert('Network error');
    }
    setLoading(false);
  };

  const totalPaid = (reservation.total_paid_cents || 0) / 100;
  const balanceDue = (reservation.balance_due_cents || 0) / 100;
  const grandTotal = (reservation.grand_total_cents || 0) / 100;
  const retainer = (reservation.booking_retainer_cents || 0) / 100;

  if (!isOpen) {
    return (
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-slate-800">{reservation.payment_status || 'Pending confirmation'}</span>
        <span className="text-xs text-slate-600">Total: ${grandTotal}</span>
        <span className="text-xs text-slate-600">Paid: <span className="font-medium text-green-700">${totalPaid}</span></span>
        <span className="text-xs text-slate-600">Due: <span className="font-medium text-red-600">${balanceDue}</span></span>
        <button onClick={() => setIsOpen(true)} className="text-blue-600 font-semibold hover:underline text-xs text-left mt-1">Record Ledger Event</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Record Event (RES-{reservation.id})</h3>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-black">&times;</button>
        </div>
        
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
          <p><strong>Customer Preference:</strong> {reservation.preferred_payment_method || 'None/Decide later'}</p>
          <p><strong>Required Retainer:</strong> ${retainer}</p>
          <p><strong>Balance Due:</strong> ${balanceDue}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
          <div>
            <label className="block font-semibold mb-1">Event Type</label>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="retainer">Record Booking Retainer</option>
              <option value="payment">Record Payment</option>
              <option value="refund">Record Refund</option>
              <option value="reversal">Reverse/Void Entry</option>
            </select>
          </div>

          {eventType !== 'reversal' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Amount ($)</label>
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" required />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Method</label>
                  <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select...</option>
                    <option value="zelle">Zelle</option>
                    <option value="venmo">Venmo</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card (Stripe)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Reference ID (Optional)</label>
                <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Trans#123" />
              </div>

              <div>
                <label className="block font-semibold mb-1">Note (Optional)</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Handed to driver" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block font-semibold mb-1">Event ID to Reverse</label>
                <input type="number" value={reversesId} onChange={(e) => setReversesId(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Event ID" required />
              </div>
              <div>
                <label className="block font-semibold mb-1">Void Reason</label>
                <input type="text" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Entered incorrect amount" required />
              </div>
            </>
          )}

          <div className="mt-4 flex gap-2 justify-end">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50 transition-colors">Record Entry</button>
          </div>
        </form>
      </div>
    </div>
  );
}
