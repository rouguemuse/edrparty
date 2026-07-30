const fs = require('fs');

let js = fs.readFileSync('public/edrparty/app.js', 'utf8');

// Update state initialization
js = js.replace(/zipCode: ""/g, 'zipCode: "", streetAddress: "", city: "", us_state: "TX"');

// Update initBookingState
js = js.replace(
`  const dateInput = document.getElementById("eventDate");
  const zipInput = document.getElementById("zipCode");
  const form = document.getElementById("mainBookingForm");`,
`  const dateInput = document.getElementById("eventDate");
  const zipInput = document.getElementById("zipCode");
  const streetInput = document.getElementById("streetAddress");
  const cityInput = document.getElementById("city");
  const stateInput = document.getElementById("state");
  const form = document.getElementById("mainBookingForm");`
);

js = js.replace(
`  if (dateInput) dateInput.value = state.eventDate;
  if (zipInput) zipInput.value = state.zipCode;`,
`  if (dateInput) dateInput.value = state.eventDate;
  if (zipInput) zipInput.value = state.zipCode;
  if (streetInput) streetInput.value = state.streetAddress || "";
  if (cityInput) cityInput.value = state.city || "Austin";
  if (stateInput) stateInput.value = state.us_state || "TX";`
);

js = js.replace(
`      document.getElementById("summaryZipStr").innerText = state.zipCode;`,
`      document.getElementById("summaryZipStr").innerText = (state.streetAddress || "") + ", " + (state.city || "") + ", " + (state.us_state || "") + " " + state.zipCode;`
);

// Update resetBookingBar
js = js.replace(
`function resetBookingBar() {
  state.eventDate = "";
  state.zipCode = "";
  localStorage.removeItem("edr_eventDate");
  localStorage.removeItem("edr_zipCode");`,
`function resetBookingBar() {
  state.eventDate = "";
  state.zipCode = "";
  state.streetAddress = "";
  state.city = "";
  state.us_state = "TX";
  state.routingState = null;
  localStorage.removeItem("edr_eventDate");
  localStorage.removeItem("edr_zipCode");
  localStorage.removeItem("edr_streetAddress");
  localStorage.removeItem("edr_city");
  localStorage.removeItem("edr_state");
  localStorage.removeItem("edr_routing");`
);

// Update state loader at top
js = js.replace(
`  eventDate: localStorage.getItem("edr_eventDate") || "",
  zipCode: localStorage.getItem("edr_zipCode") || "",`,
`  eventDate: localStorage.getItem("edr_eventDate") || "",
  zipCode: localStorage.getItem("edr_zipCode") || "",
  streetAddress: localStorage.getItem("edr_streetAddress") || "",
  city: localStorage.getItem("edr_city") || "Austin",
  us_state: localStorage.getItem("edr_state") || "TX",`
);

// Update mainBookingForm submit
js = js.replace(
`      const dateIn = document.getElementById("eventDate").value;
      const zipIn = document.getElementById("zipCode").value;
      
      const submitBtn = bookingForm.querySelector('button[type="submit"]');`,
`      const dateIn = document.getElementById("eventDate").value;
      const zipIn = document.getElementById("zipCode").value;
      const streetIn = document.getElementById("streetAddress").value;
      const cityIn = document.getElementById("city").value;
      const stateIn = document.getElementById("state").value;
      
      const submitBtn = bookingForm.querySelector('button[type="submit"]');`
);

js = js.replace(
`        const res = await fetch('/api/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zip: zipIn })
        });`,
`        const res = await fetch('/api/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: streetIn, city: cityIn, state: stateIn, zip: zipIn })
        });`
);

js = js.replace(
`        state.eventDate = dateIn;
        state.zipCode = zipIn;
        state.routingState = routing;

        localStorage.setItem("edr_eventDate", dateIn);
        localStorage.setItem("edr_zipCode", zipIn);`,
`        state.eventDate = dateIn;
        state.zipCode = zipIn;
        state.streetAddress = streetIn;
        state.city = cityIn;
        state.us_state = stateIn;
        state.routingState = routing;

        localStorage.setItem("edr_eventDate", dateIn);
        localStorage.setItem("edr_zipCode", zipIn);
        localStorage.setItem("edr_streetAddress", streetIn);
        localStorage.setItem("edr_city", cityIn);
        localStorage.setItem("edr_state", stateIn);`
);

// Update checkout submission
js = js.replace(
`          event_address: state.zipCode, // using ZIP as address since there's no address field in UI yet
          city: "",
          zip: state.zipCode,`,
`          event_address: state.streetAddress,
          city: state.city,
          zip: state.zipCode,`
);

fs.writeFileSync('public/edrparty/app.js', js);
console.log('Patch complete.');
