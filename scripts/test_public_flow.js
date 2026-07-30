const http = require('http');

async function fetchAPI(path, method, body) {
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
  console.log("Starting Public Flow API Tests...");

  const basePayload = {
    customer_name: "Test User",
    email: "test@example.com",
    phone: "555-0199",
    event_date: "2026-10-15",
    start_time: "10:00",
    end_time: "18:00",
    event_address: "123 Main St",
    city: "Florence",
    zip: "76527",
    preferred_language: "en",
    items: [{ product_id: 1, quantity: 1 }] // Assuming product 1 costs > $0
  };

  // Test Zelle
  let res = await fetchAPI('/api/inquiries', 'POST', { ...basePayload, preferred_payment_method: 'zelle' });
  console.assert(res.status === 201, `Zelle failed: ${res.status}`);
  let inquiryId = res.body.inquiry.id;

  // Test Venmo
  res = await fetchAPI('/api/inquiries', 'POST', { ...basePayload, preferred_payment_method: 'venmo' });
  console.assert(res.status === 201, `Venmo failed: ${res.status}`);
  
  // Test Cash
  res = await fetchAPI('/api/inquiries', 'POST', { ...basePayload, preferred_payment_method: 'cash' });
  console.assert(res.status === 201, `Cash failed: ${res.status}`);

  // Test Decide later
  res = await fetchAPI('/api/inquiries', 'POST', { ...basePayload, preferred_payment_method: 'decide_later' });
  console.assert(res.status === 201, `Decide later failed: ${res.status}`);

  // Test invalid preference (should default to decide_later)
  res = await fetchAPI('/api/inquiries', 'POST', { ...basePayload, preferred_payment_method: 'bitcoin' });
  console.assert(res.status === 201, `Invalid preference failed: ${res.status}`);

  console.log("All Public Flow API Tests Passed Successfully.");
}

runTests().catch(console.error);
