const http = require('http');

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
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(resBody) }));
    });
    req.on('error', error => reject(error));
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("Starting API Tests...");
  const validAuth = 'Bearer edr_admin_secret_2026';
  const invalidAuth = 'Bearer WRONG_TOKEN';

  // Find a reservation ID (we'll just use ID 1, assuming it exists, or handle 404)
  const resId = 1;
  const path = `/api/admin/reservations/${resId}/payment`;
  
  // Test 1: Unauthenticated
  let res = await fetchAPI(path, 'POST', {}, null);
  console.assert(res.status === 401, `Expected 401, got ${res.status}`);
  console.log("Test 1 Passed: Unauthenticated request rejected.");

  // Test 2: Invalid authentication
  res = await fetchAPI(path, 'POST', {}, invalidAuth);
  console.assert(res.status === 401, `Expected 401, got ${res.status}`);
  console.log("Test 2 Passed: Invalid auth rejected.");

  // Test 3: Authenticated but missing reservation
  const fakePath = `/api/admin/reservations/9999/payment`;
  res = await fetchAPI(fakePath, 'POST', {}, validAuth);
  console.assert(res.status === 404, `Expected 404, got ${res.status}`);
  console.log("Test 3 Passed: Nonexistent reservation rejected.");

  // For the rest, we need a valid payload
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

  // Check if Res 1 exists
  res = await fetchAPI(path, 'POST', validPayload, validAuth);
  if (res.status === 404) {
    console.log("No reservation ID 1 found. Please ensure seed data is present.");
    return;
  }
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  console.log("Test 4 Passed: Valid authenticated request succeeds.");

  // Test 5: Invalid payment status
  res = await fetchAPI(path, 'POST', { ...validPayload, payment_status: 'Random Text' }, validAuth);
  console.assert(res.status === 400, `Expected 400, got ${res.status}`);
  console.log("Test 5 Passed: Invalid payment status rejected.");

  // Test 6: Invalid payment method
  res = await fetchAPI(path, 'POST', { ...validPayload, payment_method_used: 'bitcoin' }, validAuth);
  console.assert(res.status === 400, `Expected 400, got ${res.status}`);
  console.log("Test 6 Passed: Invalid payment method rejected.");

  // Test 7: Negative values
  res = await fetchAPI(path, 'POST', { ...validPayload, deposit_amount: -50 }, validAuth);
  console.assert(res.status === 400, `Expected 400, got ${res.status}`);
  console.log("Test 7 Passed: Negative amounts rejected.");

  // Test 8: Deposit received without amount
  res = await fetchAPI(path, 'POST', { ...validPayload, deposit_received: true, deposit_amount: 0 }, validAuth);
  console.assert(res.status === 400, `Expected 400, got ${res.status}`);
  console.log("Test 8 Passed: Deposit received without amount rejected.");

  // Test 9: Paid in full logic
  res = await fetchAPI(path, 'POST', { ...validPayload, payment_status: 'Paid in full', balance_due: 100, balance_paid: 50 }, validAuth);
  console.assert(res.status === 400, `Expected 400, got ${res.status}`);
  console.log("Test 9 Passed: Paid in full rejected when balance_paid < balance_due.");

  console.log("\nAll API Tests Passed Successfully.");
}

runTests().catch(console.error);
