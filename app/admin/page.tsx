import React from 'react';
import db from '@/lib/db';
import { redirect } from 'next/navigation';
import PaymentEditor from './PaymentEditor';
import { requireAdminSession } from '@/lib/auth';

export default async function AdminDashboard() {
  const auth = await requireAdminSession();
  if (auth.status === 401) {
    redirect('/admin/login');
  }

  // Fetch data
  const { rows: inquiries } = await db.execute(`
    SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 50
  `);

  const { rows: reservations } = await db.execute(`
    SELECT r.*, i.customer_name, i.inquiry_number, i.event_address, i.city, i.zip, i.destination_latitude, i.destination_longitude, i.delivery_fee as inq_fee, i.preferred_payment_method
    FROM reservations r
    LEFT JOIN inquiries i ON r.inquiry_id = i.id
    ORDER BY r.event_date DESC LIMIT 50
  `);

  const { rows: products } = await db.execute('SELECT * FROM products');

  // Route Grouping Logic (Destination-to-Destination < 15 miles on same date)
  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
    const R = 3958.8; // miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); 
  }

  const sharedRoutes = new Set();
  const confirmedRes = reservations.filter((r: any) => r.status === 'confirmed');
  for (let i = 0; i < confirmedRes.length; i++) {
    for (let j = i + 1; j < confirmedRes.length; j++) {
      if (confirmedRes[i].event_date === confirmedRes[j].event_date) {
        const dist = getDistance(
          confirmedRes[i].destination_latitude as number, 
          confirmedRes[i].destination_longitude as number, 
          confirmedRes[j].destination_latitude as number, 
          confirmedRes[j].destination_longitude as number
        );
        if (dist <= 15) {
          sharedRoutes.add(confirmedRes[i].id);
          sharedRoutes.add(confirmedRes[j].id);
        }
      }
    }
  }

  // Stats
  const newInquiries = inquiries.filter((i: any) => i.status === 'new').length;
  const holds = reservations.filter((r: any) => r.status === 'hold');

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>EDR Admin Dashboard</h1>
        <div className="flex gap-4">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">New Inquiries: {newInquiries}</span>
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">Active Holds: {holds.length}</span>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1 rounded text-sm font-semibold">Logout</button>
          </form>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Pipeline / Inquiries */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Inquiry Pipeline</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 font-semibold">ID</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Event Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.length === 0 ? (
                    <tr><td colSpan={5} className="py-4 text-slate-500">No inquiries found.</td></tr>
                  ) : inquiries.map((inq: any) => (
                    <tr key={inq.id as number} className="border-b last:border-0">
                      <td className="py-3 text-slate-600">{inq.inquiry_number}</td>
                      <td className="py-3 font-medium">{inq.customer_name}</td>
                      <td className="py-3">{inq.event_date}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${inq.status === 'new' ? 'bg-green-100 text-green-800' : 'bg-slate-100'}`}>
                          {inq.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <button className="text-blue-600 font-semibold hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold mb-4">Reservations & Holds</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 font-semibold">Ref</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Event Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Route & Fee</th>
                    <th className="pb-3 font-semibold">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr><td colSpan={5} className="py-4 text-slate-500">No reservations found.</td></tr>
                  ) : reservations.map((res: any) => (
                    <tr key={res.id as number} className="border-b last:border-0">
                      <td className="py-3 text-slate-600">{res.inquiry_number || `RES-${res.id}`}</td>
                      <td className="py-3 font-medium">{res.customer_name || 'N/A'}</td>
                      <td className="py-3">{res.event_date}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${res.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : res.status === 'hold' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100'}`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {sharedRoutes.has(res.id) && (
                          <span className="block text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded mb-1 w-max">
                            Potential nearby event
                          </span>
                        )}
                        <span className="text-xs text-slate-600">
                          Fee: ${res.override_delivery_fee !== null ? res.override_delivery_fee : res.inq_fee} 
                          {res.override_delivery_fee !== null && <span className="line-through ml-1 text-red-400">${res.inq_fee}</span>}
                        </span>
                      </td>
                      <td className="py-3">
                        <PaymentEditor reservation={res} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Inventory Sidebar */}
        <div className="col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold mb-4">Inventory Overview</h2>
            <div className="flex flex-col gap-3">
              {products.map((p: any) => (
                <div key={p.id as number} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-sm">{p.name_en}</h4>
                    <p className="text-xs text-slate-500">{p.tracking_mode === 'serialized' ? 'Serialized' : `Quantity: ${p.total_quantity}`}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${p.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
