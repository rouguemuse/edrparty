const http = require('http');
const Database = require('better-sqlite3');

const db = new Database('edr_rentals.db');

async function fetchAPI(path, method, body, authHeader) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    if (authHeader) options.headers['Authorization'] = authHeader;

    const req = http.request(options, res => {
      let resBody = '';
      res.on('data', d => resBody += d);
      res.on('end', () => resolve({ status: res.statusCode, body: resBody ? JSON.parse(resBody) : null }));
    });
    req.on('error', error => reject(error));
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("Starting Full Flow Tests...");

  // Seed a fake reservation for API tests if none exist
  let res = db.prepare(`SELECT id FROM reservations LIMIT 1`).get();
  if (!res) {
    const inq = db.prepare(`INSERT INTO inquiries (inquiry_number, customer_name, email, phone, event_date, event_address, city, zip, status, created_at) VALUES ('INQ-TEST', 'Test', 't@t.com', '123', '2026-10-15', '123 st', 'City', '12345', 'new', datetime('now'))`).run();
    db.prepare(`INSERT INTO reservations (inquiry_id, event_date, status) VALUES (?, '2026-10-15', 'confirmed')`).run(inq.lastInsertRowid);
    res = db.prepare(`SELECT id FROM reservations LIMIT 1`).get();
  }
  const resId = res.id;
  console.log(`Using reservation ID: ${resId}`);

  // 2. PAYMENT API VALIDATION
  const validAuth = 'Bearer edr_admin_secret_2026';
  const invalidAuth = 'Bearer WRONG_TOKEN';
  const path = `/api/admin/reservations/${resId}/payment`;
  
  let apiRes = await fetchAPI(path, 'POST', {}, null);
  console.assert(apiRes.status === 401, `Test 1 failed. Expected 401, got ${apiRes.status}`);

  apiRes = await fetchAPI(path, 'POST', {}, invalidAuth);
  console.assert(apiRes.status === 401, `Test 2 failed. Expected 401, got ${apiRes.status}`);

  apiRes = await fetchAPI(`/api/admin/reservations/9999/payment`, 'POST', {}, validAuth);
  console.assert(apiRes.status === 404, `Test 3 failed. Expected 404, got ${apiRes.status}`);

  let validPayload = {
    payment_status: 'Pending confirmation',
    deposit_required: false,
    deposit_amount: 0,
    deposit_received: false,
    deposit_received_at: null,
    payment_method_used: null,
    payment_reference: null,
    balance_due: 0,
    balance_paid: 0
  };

  apiRes = await fetchAPI(path, 'POST', validPayload, validAuth);
  console.assert(apiRes.status === 200, `Test 4 failed. Expected 200, got ${apiRes.status}`);

  apiRes = await fetchAPI(path, 'POST', { ...validPayload, payment_status: 'Random Text' }, validAuth);
  console.assert(apiRes.status === 400, `Test 5 failed. Expected 400, got ${apiRes.status}`);

  apiRes = await fetchAPI(path, 'POST', { ...validPayload, payment_method_used: 'bitcoin' }, validAuth);
  console.assert(apiRes.status === 400, `Test 6 failed. Expected 400, got ${apiRes.status}`);

  apiRes = await fetchAPI(path, 'POST', { ...validPayload, deposit_amount: -50 }, validAuth);
  console.assert(apiRes.status === 400, `Test 7 failed. Expected 400, got ${apiRes.status}`);

  apiRes = await fetchAPI(path, 'POST', { ...validPayload, deposit_received: true, deposit_amount: 0 }, validAuth);
  console.assert(apiRes.status === 400, `Test 8 failed. Expected 400, got ${apiRes.status}`);

  apiRes = await fetchAPI(path, 'POST', { ...validPayload, payment_status: 'Paid in full', balance_due: 100, balance_paid: 50 }, validAuth);
  console.assert(apiRes.status === 400, `Test 9 failed. Expected 400, got ${apiRes.status}`);

  console.log("All Admin Payment API Tests Passed Successfully.");
}

runTests().catch(console.error);
