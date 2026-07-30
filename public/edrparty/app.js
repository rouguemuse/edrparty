// EDR Party Rentals Inventory & Party Builder System (Bilingual Engine)

// Product Catalog Database (100% Real Equipment Photography & Spanish Translations)
let PRODUCTS = [];

// --- CENTRALIZED TRANSLATION ENGINE ---
const TRANSLATIONS = {
  rentals: { en: 'Rentals', es: 'Alquileres' },
  packages: { en: 'Packages', es: 'Paquetes' },
  service_area: { en: 'Service Area', es: 'Área de servicio' },
  how_delivery_works: { en: 'How Delivery Works', es: 'Cómo funciona la entrega' },
  faqs: { en: 'FAQs', es: 'Preguntas frecuentes' },
  my_party: { en: 'My Party', es: 'Mi fiesta' },
  check_your_date: { en: 'Check Your Date', es: 'Consulta tu fecha' },
  check_availability: { en: 'Check Availability', es: 'Ver disponibilidad' },
  bounce_houses: { en: 'Bounce Houses', es: 'Brincolines' },
  water_slides: { en: 'Water Slides', es: 'Toboganes acuáticos' },
  tables_and_chairs: { en: 'Tables & Chairs', es: 'Mesas y sillas' },
  add_to_party: { en: 'Add to Party', es: 'Agregar a mi fiesta' },
  view_details: { en: 'View Details', es: 'Ver detalles' },
  reserved_for_this_date: { en: 'Reserved for this date', es: 'Reservado para esta fecha' },
  select_your_date: { en: 'Select Your Date', es: 'Elige la fecha' },
  delivery_address: { en: 'Delivery Address', es: 'Dirección de entrega' },
  request_a_quote: { en: 'Request a Quote', es: 'Solicitar cotización' },
  seats_up_to_8: { en: 'Seats up to 8', es: 'Capacidad para hasta 8 personas' },
  custom_delivery_quote_required: { en: 'Custom delivery quote required', es: 'Se requiere cotización de envío' },
  free_delivery_policy: { en: 'Free local delivery on orders of $349+ within 15 miles.', es: 'Entrega local gratis en pedidos de $349+ dentro de 15 millas.' }
};

function t(key) {
  const lang = state.lang || 'en';
  if (!TRANSLATIONS[key]) {
    console.warn('Missing translation key:', key);
    return key;
  }
  return TRANSLATIONS[key][lang] || TRANSLATIONS[key]['en'];
}
// --------------------------------------

// App State
let state = {
  eventDate: localStorage.getItem("edr_eventDate") || "",
  zipCode: localStorage.getItem("edr_zipCode") || "",
  streetAddress: localStorage.getItem("edr_streetAddress") || "",
  city: localStorage.getItem("edr_city") || "Austin",
  us_state: localStorage.getItem("edr_state") || "TX",
  wishlist: JSON.parse(localStorage.getItem("edr_wishlist")) || [],
  activeStep: "all",
  lang: localStorage.getItem("edr_lang") || "en",
  secondaryFilters: {
    wetDry: "all"
  }
};

const ELIGIBLE_ZIPS = [
  "78701", "78702", "78703", "78704", "78705", "78731", "78746", "78751", "78758", "78759", // Austin
  "78613", "78630", // Cedar Park
  "78641", "78645", "78646", // Leander
  "78642", // Liberty Hill
  "78617", // Del Valle
  "76537", // Jarrell
  "76571", // Salado
  "76527"  // Florence
];

async function fetchProducts() {
  try {
    const dateQuery = state.eventDate ? \`?date=\${state.eventDate}\` : '';
    const res = await fetch(\`/api/availability\${dateQuery}\`);
    const data = await res.json();
    if (data.products) {
      PRODUCTS = data.products.map(p => ({
        id: p.id,
        name: p.name_en,
        nameEs: p.name_es,
        category: p.category === 'bounce' ? 'Bounce Houses' : p.category === 'water' ? 'Water Slides' : p.category === 'seating' ? 'Tables & Chairs' : 'Packages',
        categoryEs: p.category === 'bounce' ? 'Bricolines' : p.category === 'water' ? 'Toboganes de Agua' : p.category === 'seating' ? 'Mesas y Sillas' : 'Paquetes',
        categoryKey: p.category,
        step: p.category,
        price: p.base_price,
        priceLabel: \`$\${p.base_price}\`,
        quickFacts: \`Space: \${p.setup_length}'x\${p.setup_width}'\`,
        quickFactsEs: \`Espacio: \${p.setup_length}'x\${p.setup_width}'\`,
        description: p.description_en,
        descriptionEs: p.description_es,
        image: p.image,
        accentColor: '#20D9D5',
        specSpace: \`\${p.setup_length}' x \${p.setup_width}'\`,
        specCapacity: p.tracking_mode === 'quantity' ? 'Quantity item' : 'Capacity info',
        specPower: p.outlets_required ? \`\${p.outlets_required} Blower(s)\` : 'None',
        specAge: 'All Ages',
        wetDry: p.water_required ? 'wet' : 'dry',
        popular: true,
        available: p.available !== false,
        availableQuantity: p.availableQuantity
      }));
    }
  } catch (e) {
    console.error('Failed to fetch products', e);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await fetchProducts();
  initBookingState();
  applyLanguageUI();
  renderCatalog();
  updateWishlistCount();
  setupEventListeners();
  initParallax();
});

function toggleLanguage() {
  state.lang = state.lang === "en" ? "es" : "en";
  localStorage.setItem("edr_lang", state.lang);
  applyLanguageUI();
  renderCatalog();
  updateWishlistCount();
}

function applyLanguageUI() {
  const isEs = state.lang === "es";

  // Toggle button texts
  const langBtns = document.querySelectorAll(".btn-lang-toggle");
  langBtns.forEach(btn => {
    btn.innerHTML = isEs ? "ES | EN" : "EN | ES";
  });

  // Nav links
  const partyLinks = document.querySelectorAll('a[href="#partyBuilderSection"]');
  const navRentals = partyLinks.length > 0 ? partyLinks[0] : null;
  const navPackages = partyLinks.length > 1 ? partyLinks[1] : null;
  const navMap = document.querySelector('a[href="#serviceMapSection"]');
  const navProcess = document.querySelector('a[href="#processSection"]');
  const navFaq = document.querySelector('a[href="#faqSection"]');

  if (navRentals) navRentals.innerText = isEs ? "Alquileres" : "Rentals";
  if (navPackages) navPackages.innerText = isEs ? "Paquetes" : "Packages";
  if (navMap) navMap.innerText = isEs ? "Área de Servicio" : "Service Area";
  if (navProcess) navProcess.innerText = isEs ? "Cómo Funciona" : "How Delivery Works";
  if (navFaq) navFaq.innerText = isEs ? "Preguntas" : "FAQs";

  // Hero Section ("Big Energy." always stays in English as requested)
  const heroEyebrow = document.querySelector(".hero-eyebrow");
  const heroTitle = document.querySelector(".hero-title");
  const heroDesc = document.querySelector(".hero-desc");
  const heroBtnCheck = document.querySelector('.hero-actions a[href="#bookingBar"]');
  const heroBtnRentals = document.querySelector('.hero-actions a[href="#partyBuilderSection"]');
  const heroNote = document.querySelector(".hero-service-area-note");

  if (heroEyebrow) heroEyebrow.innerText = isEs ? "ALQUILERES PARA FIESTAS EN CENTRAL TEXAS" : "CENTRAL TEXAS PARTY RENTALS";
  if (heroTitle) heroTitle.innerText = "Big Energy.";
  if (heroDesc) heroDesc.innerText = isEs ? "Bricolines, mesas, sillas y equipo para fiestas—entregados, desinfectados y listos antes de que lleguen tus invitados." : "Bounce houses, tables, chairs and party gear—delivered, sanitized and ready before your guests arrive.";
  if (heroBtnCheck) heroBtnCheck.innerText = isEs ? "Consulta Tu Fecha" : "Check Your Date";
  if (heroBtnRentals) heroBtnRentals.innerText = isEs ? "Ver Alquileres" : "View Rentals";
  if (heroNote) heroNote.innerHTML = isEs ? '<span>Entrega local gratis en $349+ dentro de 15 millas</span>' : '<span>Free local delivery on $349+ within 15 miles</span>';

  // Booking Bar
  const dateLabel = document.querySelector('label[for="eventDate"]');
  const streetLabel = document.querySelector('label[for="streetAddress"]');
  const cityLabel = document.querySelector('label[for="city"]');
  const stateLabel = document.querySelector('label[for="state"]');
  const zipLabel = document.querySelector('label[for="zipCode"]');
  const checkBtn = document.querySelector('#mainBookingForm button[type="submit"]');

  if (dateLabel) dateLabel.innerText = isEs ? "Fecha del Evento:" : "Event Date:";
  if (streetLabel) streetLabel.innerText = isEs ? "Dirección:" : "Delivery Address:";
  if (cityLabel) cityLabel.innerText = isEs ? "Ciudad:" : "City:";
  if (stateLabel) stateLabel.innerText = isEs ? "Estado:" : "State:";
  if (zipLabel) zipLabel.innerText = isEs ? "Código ZIP:" : "ZIP Code:";
  if (checkBtn && !checkBtn.disabled) checkBtn.innerText = isEs ? "Consultar Disponibilidad" : "Check Availability";

  // Trust Strip
  const trustItems = document.querySelectorAll(".trust-item");
  if (trustItems.length >= 3) {
    trustItems[0].innerHTML = isEs ? '<span class="trust-check">✓</span> Entrega Local Gratis $349+' : '<span class="trust-check">✓</span> Free Local Delivery on $349+';
    trustItems[1].innerHTML = isEs ? '<span class="trust-check">✓</span> Limpio y Desinfectado' : '<span class="trust-check">✓</span> Cleaned & Sanitized';
    trustItems[2].innerHTML = isEs ? '<span class="trust-check">✓</span> Garantía de Puntualidad' : '<span class="trust-check">✓</span> On-Time Guarantee';
  }

  // Spanish Speaking Banner:
  // English Mode: "🇲🇽 We Speak Spanish! Full customer support in English & Spanish."
  // Spanish Mode: "🇲🇽 ¡Hablamos Español! Atención personalizada en tu idioma para eventos."
  const spanishBanner = document.getElementById("spanishSpeakingBanner");
  if (spanishBanner) {
    spanishBanner.innerHTML = isEs 
      ? `<span>🇲🇽 <strong>¡Hablamos Español!</strong> Atención personalizada en tu idioma para eventos en Central Texas.</span>`
      : `<span>🇲🇽 <strong>We Speak Spanish!</strong> Full customer support in English & Spanish.</span>`;
  }

  // Category Quick Jump Cards Titles
  const jumpCards = document.querySelectorAll(".category-jump-card");
  if (jumpCards.length >= 4) {
    jumpCards[0].querySelector(".category-jump-title").innerText = isEs ? "Bricolines" : "Bounce Houses";
    jumpCards[0].querySelector(".category-jump-sub").innerText = isEs ? "Castillos clásicos y combos" : "Classic castles & combos";

    jumpCards[1].querySelector(".category-jump-title").innerText = isEs ? "Toboganes de Agua" : "Water Slides";
    jumpCards[1].querySelector(".category-jump-sub").innerText = isEs ? "Toboganes de 20ft con alberca" : "20ft slides with splash pools";

    jumpCards[2].querySelector(".category-jump-title").innerText = isEs ? "Mesas y Sillas" : "Tables & Chairs";
    jumpCards[2].querySelector(".category-jump-sub").innerText = isEs ? "Juegos de mesas de banquete" : "Commercial white banquet sets";

    jumpCards[3].querySelector(".category-jump-title").innerText = "Packages";
    jumpCards[3].querySelector(".category-jump-sub").innerText = isEs ? "Paquetes que califican para envío gratis" : "Bundles qualifying for free delivery";
  }

  // Builder Header & Category Buttons
  const builderEyebrow = document.querySelector(".builder-eyebrow");
  const builderTitle = document.querySelector(".builder-title");

  if (builderEyebrow) builderEyebrow.innerText = isEs ? "CATÁLOGO DE ALQUILERES" : "STEP-BY-STEP BUILDER";
  if (builderTitle) builderTitle.innerText = isEs ? "Elige Tu Alquiler." : "Build Your Bash.";

  const stepTabs = document.querySelectorAll(".step-tab");
  if (stepTabs.length >= 5) {
    stepTabs[0].querySelector("span").innerText = isEs ? "Todos Los Alquileres" : "All Rentals";
    stepTabs[1].querySelector("span").innerText = isEs ? "Bricolines" : "Bounce Houses";
    stepTabs[2].querySelector("span").innerText = isEs ? "Toboganes de Agua" : "Water Slides";
    stepTabs[3].querySelector("span").innerText = isEs ? "Mesas y Sillas" : "Tables & Chairs";
    stepTabs[4].querySelector("span").innerText = "Packages";
  }

  // Process Section Headings
  const processHeader = document.querySelector("#processSection h2");
  if (processHeader) processHeader.innerText = isEs ? "Cómo Funciona la Entrega." : "How Delivery Works.";

  // Service Map Section Headings
  const mapHeader = document.querySelector("#serviceMapSection h2");
  if (mapHeader) mapHeader.innerText = isEs ? "Área de Servicio en Central Texas." : "Central Texas Service Area.";

  // Refine Toggle Button
  const refineBtn = document.querySelector(".secondary-filter-toggle");
  if (refineBtn) {
    refineBtn.innerHTML = isEs 
      ? `<svg style="width:14px; height:14px; fill:none; stroke:currentColor; stroke-width:2;" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> Buscar Alquiler`
      : `<svg style="width:14px; height:14px; fill:none; stroke:currentColor; stroke-width:2;" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> Find Your Rental`;
  }

  // Payment Form Texts
  const submitResBtn = document.getElementById("submitReservationBtn");
  if (submitResBtn) submitResBtn.innerText = isEs ? "Enviar Solicitud de Reservación" : "Submit Reservation Request";
  
  const paymentLabel = document.getElementById("paymentPreferenceLabel");
  if (paymentLabel) paymentLabel.innerText = isEs ? "Preferencia de Pago" : "Payment Preference";
  
  const paymentSelect = document.getElementById("checkoutPayment");
  if (paymentSelect) {
    paymentSelect.options[0].text = isEs ? "Decidir después" : "Decide later";
    paymentSelect.options[1].text = "Zelle";
    paymentSelect.options[2].text = "Venmo";
    paymentSelect.options[3].text = isEs ? "Efectivo" : "Cash";
  }

  const warningText = document.getElementById("reservationWarningText");
  if (warningText) warningText.innerText = isEs 
    ? "Enviar esta solicitud no garantiza la disponibilidad. Confirmaremos los artículos, los detalles de entrega, el total y el depósito requerido antes de que envíe el pago." 
    : "Submitting this request does not guarantee availability. We will confirm your items, delivery details, total, and required deposit before payment is sent.";
    
  const confHeading = document.getElementById("confirmationHeading");
  if (confHeading) confHeading.innerText = isEs ? "¡Solicitud Recibida!" : "Request Booking Received!";

  const accPay = document.getElementById("acceptedPaymentsText");
  if (accPay) accPay.innerText = isEs ? "Pagos Aceptados: Zelle, Venmo, Efectivo" : "Accepted Payments: Zelle, Venmo, Cash";
}

function initParallax() {
  const bgContainer = document.querySelector(".hero-bg-container");
  const heroContent = document.querySelector(".hero-content");
  
  if (!bgContainer || !heroContent) return;

  let ticking = false;

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (scrollY < 900) {
          bgContainer.style.transform = `translate3d(0, ${scrollY * 0.22}px, 0)`;
          heroContent.style.transform = `translate3d(0, ${scrollY * 0.08}px, 0)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function initBookingState() {
  const dateInput = document.getElementById("eventDate");
  const zipInput = document.getElementById("zipCode");
  const streetInput = document.getElementById("streetAddress");
  const cityInput = document.getElementById("city");
  const stateInput = document.getElementById("state");
  const form = document.getElementById("mainBookingForm");
  const summary = document.getElementById("bookingActiveSummary");

  if (dateInput) dateInput.value = state.eventDate;
  if (zipInput) zipInput.value = state.zipCode;
  if (streetInput) streetInput.value = state.streetAddress || "";
  if (cityInput) cityInput.value = state.city || "Austin";
  if (stateInput) stateInput.value = state.us_state || "TX";

  if (state.eventDate && state.zipCode) {
    if (form) form.style.display = "none";
    if (summary) {
      summary.style.display = "flex";
      document.getElementById("summaryDateStr").innerText = state.eventDate;
      document.getElementById("summaryZipStr").innerText = (state.streetAddress || "") + ", " + (state.city || "") + ", " + (state.us_state || "") + " " + state.zipCode;
      if (typeof renderDeliveryStatus === "function") renderDeliveryStatus();
    }
  } else {
    if (form) form.style.display = "flex";
    if (summary) summary.style.display = "none";
  }
}

function resetBookingBar() {
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
  localStorage.removeItem("edr_routing");
  initBookingState();
  renderCatalog();
}

function renderCatalog() {
  const gridContainer = document.getElementById("catalogGrid");
  const counterText = document.getElementById("catalogCounterText");
  if (!gridContainer) return;

  gridContainer.innerHTML = "";
  const isEs = state.lang === "es";

  const filteredProducts = PRODUCTS.filter(product => {
    if (state.activeStep !== "all" && product.step !== state.activeStep) return false;
    if (state.secondaryFilters.wetDry !== "all" && product.wetDry !== state.secondaryFilters.wetDry) return false;
    return true;
  });

  if (counterText) {
    counterText.innerText = isEs 
      ? `Mostrando ${filteredProducts.length} Alquiler${filteredProducts.length !== 1 ? 'es' : ''}`
      : `Showing ${filteredProducts.length} Rental${filteredProducts.length !== 1 ? 's' : ''}`;
  }

  if (filteredProducts.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; border: var(--border-subtle); border-radius: var(--radius-soft); background-color: var(--white);">
        <h3 style="font-size: 1.8rem; color: var(--red); margin-bottom: 0.5rem;">${isEs ? 'NO SE ENCONTRÓ ALQUILER' : 'NO RENTALS FOUND'}</h3>
        <p style="font-size: 0.95rem;">${isEs ? 'Selecciona otra categoría.' : 'Select another category.'}</p>
      </div>
    `;
    return;
  }

  filteredProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.setAttribute("data-id", product.id);

    let isAvailable = true;
    if (state.eventDate) {
      const seed = state.eventDate.charCodeAt(state.eventDate.length - 1) || 0;
      isAvailable = (product.id + seed) % 5 !== 0;
    }

    let badgeHtml = "";
    if (state.eventDate) {
      badgeHtml = isAvailable 
        ? `<span class="badge badge-available">${isEs ? 'Disponible' : 'Available Date'}</span>`
        : `<span class="badge badge-booked">${isEs ? 'Reservado' : 'Booked Out'}</span>`;
    } else {
      badgeHtml = `<span class="badge badge-available" style="background-color:var(--white)">${isEs ? 'Ver Fecha' : 'Check Date'}</span>`;
    }

    const isInWishlist = state.wishlist.some(item => item.id === product.id);
    const actionBtnText = isInWishlist 
      ? (isEs ? "Agregado" : "Added to Party") 
      : (isEs ? "Agregar a Mi Fiesta" : "Add to Party");
    const actionBtnClass = isInWishlist ? "btn-add-party added" : "btn-add-party";

    const displayName = isEs ? product.nameEs : product.name;
    const displayCategory = isEs ? product.categoryEs : product.category;
    const displayFacts = isEs ? product.quickFactsEs : product.quickFacts;

    card.innerHTML = `
      <div class="product-image-container">
        <div class="badge-container">${badgeHtml}</div>
        <img class="product-image" src="${product.image}" alt="${displayName}" onerror="this.src='images/product_placeholder.jpg'">
      </div>
      <div class="product-info-wrap">
        <span class="product-category-tag">${displayCategory}</span>
        <div class="product-title-row">
          <h4 class="product-name">${displayName}</h4>
          <span class="product-price">${product.priceLabel}</span>
        </div>
        
        <p class="product-quick-facts">${displayFacts}</p>

        <div class="card-actions">
          <button class="${actionBtnClass}" onclick="toggleWishlist(${product.id})">${actionBtnText}</button>
          <button class="btn-view-details-link" onclick="openDetailsDrawer(${product.id})">${isEs ? 'Detalles &rarr;' : 'View details &rarr;'}</button>
        </div>
      </div>
    `;

    gridContainer.appendChild(card);
  });
}

function toggleWishlist(productId) {
  const index = state.wishlist.findIndex(item => item.id === productId);
  const product = PRODUCTS.find(p => p.id === productId);

  if (index === -1) {
    state.wishlist.push(product);
  } else {
    state.wishlist.splice(index, 1);
  }

  localStorage.setItem("edr_wishlist", JSON.stringify(state.wishlist));
  updateWishlistCount();
  renderCatalog();
  renderWishlistDrawer();
}

function updateWishlistCount() {
  const count = state.wishlist.length;
  const isEs = state.lang === "es";

  const counts = document.querySelectorAll(".wishlist-count-badge");
  counts.forEach(badge => {
    badge.innerHTML = count;
  });

  const stickyCount = document.querySelector(".mobile-sticky-count");
  if (stickyCount) {
    stickyCount.innerHTML = `${count} ${isEs ? 'Alquiler(es)' : 'Rental(s)'}`;
  }

  const subtotal = state.wishlist.reduce((acc, item) => acc + item.price, 0);
  
  let deliveryFee = 0;
  if (subtotal > 0) {
    if (subtotal >= 349) {
      deliveryFee = 0;
    } else {
      deliveryFee = 49;
    }
  }

  const total = subtotal + deliveryFee;

  const subtotalLabel = document.querySelector(".wishlist-subtotal");
  const deliveryLabel = document.querySelector(".wishlist-delivery");
  const totalLabel = document.querySelectorAll(".wishlist-total");

  if (subtotalLabel) subtotalLabel.innerHTML = `$${subtotal}`;
  if (deliveryLabel) {
    if (count === 0) {
      deliveryLabel.innerHTML = "$0";
    } else if (subtotal >= 349) {
      deliveryLabel.innerHTML = `<strong style="color:var(--cobalt);">${isEs ? 'GRATIS (Pedido $349+)' : 'FREE ($349+ Tier)'}</strong>`;
    } else {
      const needed = 349 - subtotal;
      deliveryLabel.innerHTML = `$49 <span style="font-size:0.8rem; color:var(--red); display:block;">(${isEs ? 'Agrega $' + needed + ' para envío GRATIS' : 'Add $' + needed + ' for FREE delivery'})</span>`;
    }
  }

  totalLabel.forEach(lbl => lbl.innerHTML = `$${total}`);
}

function renderWishlistDrawer() {
  const container = document.getElementById("wishlistItemsList");
  if (!container) return;

  container.innerHTML = "";
  const isEs = state.lang === "es";

  if (state.wishlist.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem;">
        <h4 style="font-size: 1.2rem; color: var(--red); margin-bottom: 0.4rem;">${isEs ? 'Tu lista está vacía' : 'Your party list is empty'}</h4>
        <p style="font-size: 0.95rem;">${isEs ? 'Selecciona equipo para armar tu paquete de fiesta.' : 'Select items from the catalog to build your plan.'}</p>
      </div>
    `;
    return;
  }

  state.wishlist.forEach(item => {
    const itemEl = document.createElement("div");
    itemEl.className = "wishlist-item";
    const displayName = isEs ? item.nameEs : item.name;

    itemEl.innerHTML = `
      <img src="${item.image}" alt="${displayName}" class="wishlist-item-img" onerror="this.src='images/product_placeholder.jpg'">
      <div>
        <h5 style="font-size:0.95rem;">${displayName}</h5>
        <span style="font-family:var(--font-body); font-weight:700; font-size:0.9rem; color:var(--cobalt);">${item.priceLabel}</span>
      </div>
      <button style="background:none; border:none; color:var(--red); font-weight:700; font-size:0.8rem; cursor:pointer;" onclick="toggleWishlist(${item.id})">${isEs ? 'Quitar' : 'Remove'}</button>
    `;
    container.appendChild(itemEl);
  });
}

function openDetailsDrawer(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const drawer = document.getElementById("detailsDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  const content = document.getElementById("detailsDrawerContent");

  if (!drawer || !backdrop || !content) return;
  const isEs = state.lang === "es";

  let isAvailable = true;
  if (state.eventDate) {
    const seed = state.eventDate.charCodeAt(state.eventDate.length - 1) || 0;
    isAvailable = (product.id + seed) % 5 !== 0;
  }
  const dateBadge = state.eventDate 
    ? (isAvailable ? `<span style="color: var(--cobalt); font-weight:700;">✓ ${isEs ? 'Disponible para tu fecha' : 'Available for your date'}</span>` : `<span style="color: var(--red); font-weight:700;">✕ ${isEs ? 'Reservado en esta fecha' : 'Already booked on this date'}</span>`)
    : `<span style="color: var(--red); font-weight:700;">${isEs ? 'Ingresa tu fecha para garantía' : 'Enter date for guarantee'}</span>`;

  const isInWishlist = state.wishlist.some(item => item.id === product.id);
  const actionBtnText = isInWishlist 
    ? (isEs ? "Quitar de Mi Fiesta" : "Remove from Party") 
    : (isEs ? "Agregar a Mi Plan de Fiesta" : "Add to Party Plan");
  const actionBtnBg = isInWishlist ? "var(--red)" : "var(--lemon)";
  const actionBtnColor = "var(--ink)";

  const displayName = isEs ? product.nameEs : product.name;
  const displayDesc = isEs ? product.descriptionEs : product.description;

  content.innerHTML = `
    <div style="aspect-ratio:4/3; border:var(--border-clean); border-radius:var(--radius-soft); overflow:hidden; margin-bottom:1.2rem;">
      <img src="${product.image}" alt="${displayName}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='images/product_placeholder.jpg'">
    </div>
    
    <h3 style="font-size: 1.8rem; margin-bottom: 0.3rem;">${displayName}</h3>
    <span style="font-family: var(--font-body); font-weight: 700; font-size: 1.3rem; color: var(--cobalt); display: block; margin-bottom: 1rem;">${isEs ? 'Desde' : 'Starting at'} ${product.priceLabel}</span>
    
    <p style="font-size:0.95rem; margin-bottom:1.2rem; line-height:1.5;">${displayDesc}</p>
    
    <table style="width:100%; border-collapse:collapse; margin-bottom:1.2rem; font-size:13.5px;">
      <tr style="border-bottom:1px solid rgba(7,17,43,0.1);"><td style="font-weight:700; padding:0.5rem 0;">${isEs ? 'Espacio Requerido' : 'Clearance Area'}</td><td style="font-weight:600;">${product.specSpace}</td></tr>
      <tr style="border-bottom:1px solid rgba(7,17,43,0.1);"><td style="font-weight:700; padding:0.5rem 0;">${isEs ? 'Capacidad' : 'Capacity'}</td><td style="font-weight:600;">${product.specCapacity}</td></tr>
      <tr style="border-bottom:1px solid rgba(7,17,43,0.1);"><td style="font-weight:700; padding:0.5rem 0;">${isEs ? 'Energía Necesaria' : 'Power Required'}</td><td style="font-weight:600;">${product.specPower}</td></tr>
      <tr style="border-bottom:1px solid rgba(7,17,43,0.1);"><td style="font-weight:700; padding:0.5rem 0;">${isEs ? 'Rango de Edad' : 'Age Range'}</td><td style="font-weight:600;">${product.specAge}</td></tr>
      <tr style="border-bottom:1px solid rgba(7,17,43,0.1);"><td style="font-weight:700; padding:0.5rem 0;">${isEs ? 'Estado de Fecha' : 'Date Status'}</td><td>${dateBadge}</td></tr>
    </table>

    <div style="background-color: var(--bg-subtle); border: var(--border-subtle); border-radius: var(--radius-soft); padding: 1rem; margin-bottom: 1.2rem;">
      <h5 style="font-size:13.5px; margin-bottom:0.4rem; font-weight:700;">${isEs ? 'Política de Envío Gratis ($349+)' : 'Free Delivery Policy ($349+ Orders)'}</h5>
      <p style="font-size:13.5px; line-height:1.5;">${isEs ? 'Entrega local gratis dentro de 15 millas en pedidos de $349+. Pedidos menores a $349 tienen una cuota de $49.' : 'Free local delivery within 15 miles on all party plans $349+. Orders under $349 incur a flat $49 local delivery fee.'}</p>
    </div>

    <button class="btn-brutal" style="background-color: ${actionBtnBg}; color: ${actionBtnColor}; width: 100%;" onclick="toggleWishlist(${product.id}); closeAllDrawers();">${actionBtnText}</button>
  `;

  drawer.classList.add("open");
  backdrop.classList.add("active");
}

function closeAllDrawers() {
  const drawers = document.querySelectorAll(".drawer, .mobile-filter-sheet");
  drawers.forEach(d => d.classList.remove("open"));

  const backdrop = document.getElementById("drawerBackdrop");
  if (backdrop) backdrop.classList.remove("active");
}

function setupEventListeners() {
  const backdrop = document.getElementById("drawerBackdrop");
  if (backdrop) backdrop.addEventListener("click", closeAllDrawers);

  const wishlistOpeners = document.querySelectorAll(".btn-open-wishlist");
  wishlistOpeners.forEach(opener => {
    opener.addEventListener("click", (e) => {
      e.preventDefault();
      renderWishlistDrawer();
      const drawer = document.getElementById("wishlistDrawer");
      if (drawer) {
        drawer.classList.add("open");
        backdrop.classList.add("active");
      }
    });
  });

  const bookingForm = document.getElementById("mainBookingForm");
  if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const dateIn = document.getElementById("eventDate").value;
      const zipIn = document.getElementById("zipCode").value;
      const streetIn = document.getElementById("streetAddress").value;
      const cityIn = document.getElementById("city").value;
      const stateIn = document.getElementById("state").value;
      
      const submitBtn = bookingForm.querySelector('button[type="submit"]');
      const origText = submitBtn.innerText;
      submitBtn.innerText = state.lang === "es" ? "Calculando..." : "Calculating...";
      submitBtn.disabled = true;

      try {
        const res = await fetch('/api/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: streetIn, city: cityIn, state: stateIn, zip: zipIn })
        });
        const routing = await res.json();

        state.eventDate = dateIn;
        state.zipCode = zipIn;
        state.streetAddress = streetIn;
        state.city = cityIn;
        state.us_state = stateIn;
        state.routingState = routing;

        localStorage.setItem("edr_eventDate", dateIn);
        localStorage.setItem("edr_zipCode", zipIn);
        localStorage.setItem("edr_streetAddress", streetIn);
        localStorage.setItem("edr_city", cityIn);
        localStorage.setItem("edr_state", stateIn);
        localStorage.setItem("edr_routing", JSON.stringify(routing));

        initBookingState();
        updateWishlistCount();
        renderCatalog();
      } catch (err) {
        alert(state.lang === "es" ? "Error al calcular el envío." : "Error calculating delivery.");
      } finally {
        submitBtn.innerText = origText;
        submitBtn.disabled = false;
      }
    });
  }

  const stepTabs = document.querySelectorAll(".step-tab");
  stepTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      stepTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      state.activeStep = tab.getAttribute("data-step");
      renderCatalog();
    });
  });

  const wetDrySelects = document.querySelectorAll(".filter-wet-dry");
  wetDrySelects.forEach(sel => {
    sel.addEventListener("change", (e) => {
      state.secondaryFilters.wetDry = e.target.value;
      renderCatalog();
    });
  });

  const checkoutForm = document.getElementById("wishlistCheckoutForm");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const isEs = state.lang === "es";
      
      if (!state.routingState || state.routingState.status === 'failed') {
        alert(isEs ? "Por favor calcule la disponibilidad de entrega con un código postal válido antes de continuar." : "Please calculate delivery availability with a valid ZIP code before checking out.");
        return;
      }
      
      const subtotal = state.wishlist.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const minOrder = state.routingState.minimum_order || 0;
      
      if (subtotal < minOrder) {
        const needed = (minOrder - subtotal).toFixed(2);
        alert(isEs ? `Agrega $${needed} más en equipo para cumplir con el pedido mínimo para su área.` : `Please add $${needed} more in equipment to meet the minimum order for your delivery area.`);
        return;
      }
      
      const clientName = document.getElementById("checkoutName").value;
      const clientEmail = document.getElementById("checkoutEmail").value;
      const clientPhone = document.getElementById("checkoutPhone").value;

      if (!clientName || !clientEmail || !clientPhone) return;
      
      const submitBtn = checkoutForm.querySelector('button[type="submit"]');
      const origText = submitBtn.innerText;
      submitBtn.innerText = isEs ? "Procesando..." : "Processing...";
      submitBtn.disabled = true;

      try {
        const paymentPref = document.getElementById("checkoutPayment") ? document.getElementById("checkoutPayment").value : 'decide_later';

        const payload = {
          customer_name: clientName,
          email: clientEmail,
          phone: clientPhone,
          event_date: state.eventDate || "1970-01-01",
          start_time: "10:00",
          end_time: "18:00",
          event_address: state.streetAddress,
          city: state.city,
          zip: state.zipCode,
          preferred_language: state.lang,
          preferred_payment_method: paymentPref,
          items: state.wishlist.map(w => ({ product_id: w.id || 1, quantity: w.qty }))
        };

        const res = await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        closeAllDrawers();
        
        const modal = document.getElementById("confirmationModal");
        if (modal) {
          modal.querySelector(".confirmation-body").innerHTML = `
            <p style="margin-bottom: 0.8rem;">${isEs ? 'Hola' : 'Hey'} <strong>${clientName}</strong>,</p>
            <p style="margin-bottom: 1rem;">${isEs ? 'Hemos recibido su solicitud. No debe realizar ningún pago hasta que confirmemos la disponibilidad y enviemos los detalles finales de su reservación.' : 'Your request has been received. No payment is due until we confirm availability and send your final reservation details.'}</p>
            <div style="background-color: var(--bg-subtle); border: var(--border-subtle); border-radius: var(--radius-soft); padding: 1rem; margin-bottom: 1rem;">
              <p><strong>${isEs ? 'ID de Consulta' : 'Inquiry ID'}:</strong> ${data.inquiry.inquiry_number}</p>
              <p><strong>${isEs ? 'Total Estimado' : 'Estimated Total'}:</strong> $${data.inquiry.total}</p>
            </div>
            <p style="font-weight: 700; color: var(--cobalt);">✓ ${isEs ? 'El personal revisará y te contactará en menos de 2 horas.' : 'Staff will review and contact you within 2 hours.'}</p>
          `;
          modal.classList.add("active");
          const backdrop = document.getElementById("drawerBackdrop");
          if (backdrop) backdrop.classList.add("active");
        }

        state.wishlist = [];
        localStorage.setItem("edr_wishlist", "[]");
        updateWishlistCount();
        renderCatalog();
        
      } catch (err) {
        alert(isEs ? "Error al procesar la consulta." : "Error processing inquiry.");
      } finally {
        submitBtn.innerText = origText;
        submitBtn.disabled = false;
      }
    });
  }
}

window.toggleLanguage = toggleLanguage;
window.toggleWishlist = toggleWishlist;
window.openDetailsDrawer = openDetailsDrawer;
window.closeAllDrawers = closeAllDrawers;
window.resetBookingBar = resetBookingBar;
window.closeConfirmationModal = () => {
  const modal = document.getElementById("confirmationModal");
  if (modal) modal.classList.remove("active");
  closeAllDrawers();
};
window.openWishlistDrawerDirect = () => {
  renderWishlistDrawer();
  const drawer = document.getElementById("wishlistDrawer");
  const overlay = document.getElementById("drawerBackdrop");
  if (overlay) overlay.classList.add("active");
  
  const wDrawer = document.getElementById("wishlistDrawer");
  if (wDrawer) wDrawer.classList.add("active");
};

// Global state for routing
try { state.routingState = JSON.parse(localStorage.getItem("edr_routing")); } catch(e) { state.routingState = null; }

function renderDeliveryStatus() {
  const box = document.getElementById("deliveryStatusBox");
  if (!box) return;
  const isEs = state.lang === "es";
  if (!state.routingState) {
    box.innerHTML = `<span style="color:var(--text-muted)">${isEs ? "Calculando ruta..." : "Calculating route..."}</span>`;
    return;
  }
  
  const rt = state.routingState;
  
  if (rt.status === "failed") {
    box.innerHTML = `<span style="color:#ef4444; font-weight:600;">${isEs ? "⚠️ No se pudo calcular la ruta. Código postal inválido." : "⚠️ Could not calculate route. Invalid ZIP."}</span>`;
    return;
  }
  
  if (rt.delivery_fee === null && rt.requires_custom_quote) {
    box.innerHTML = `<span style="color:#f59e0b; font-weight:600;">${isEs ? "Se requiere cotización manual para esta distancia (" + rt.distanceMiles + " millas)" : "Manual quote required for this distance (" + rt.distanceMiles + " miles)"}</span>`;
    return;
  }

  // Calculate cart subtotal to determine if they met minimum order
  const subtotal = state.wishlist.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const minOrder = rt.minimum_order || 0;
  
  let html = `<div style="font-size:0.95rem;">`;
  html += `<strong>${isEs ? "Distancia Estimada:" : "Estimated Distance:"}</strong> ${rt.distanceMiles} ${isEs ? "millas" : "miles"}<br/>`;
  html += `<strong>${isEs ? "Tarifa de Envío:" : "Delivery Fee:"}</strong> $${rt.delivery_fee}<br/>`;
  html += `<strong>${isEs ? "Pedido Mínimo:" : "Minimum Order:"}</strong> $${minOrder}<br/>`;
  
  if (subtotal < minOrder) {
    const needed = (minOrder - subtotal).toFixed(2);
    html += `<div style="margin-top:0.5rem; color:#ef4444; font-weight:700;">`;
    html += isEs ? `⚠️ Agrega $${needed} más en equipo para calificar.` : `⚠️ Add $${needed} more in equipment to qualify.`;
    html += `</div>`;
  } else {
    html += `<div style="margin-top:0.5rem; color:#10b981; font-weight:700;">`;
    html += isEs ? `✅ ¡Pedido mínimo alcanzado!` : `✅ Minimum order reached!`;
    html += `</div>`;
  }
  html += `</div>`;
  box.innerHTML = html;
}

// Ensure it updates on wishlist change
const originalUpdateWishlistCount = updateWishlistCount;
window.updateWishlistCount = function() {
  originalUpdateWishlistCount();
  if (document.getElementById("bookingActiveSummary") && document.getElementById("bookingActiveSummary").style.display === "flex") {
    renderDeliveryStatus();
  }
}

// Map Initialization
document.addEventListener("DOMContentLoaded", () => {
  const mapEl = document.getElementById("leafletMap");
  if (!mapEl) return;
  
  // Center on Florence, TX
  const florenceLat = 30.8430;
  const florenceLng = -97.7950;
  
  const map = L.map('leafletMap', { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([florenceLat, florenceLng], 9);
  window.edrMap = map;
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);
  
  // Rings
  const milesToMeters = 1609.34;
  
  // 50 miles (Zone 4)
  L.circle([florenceLat, florenceLng], { radius: 50 * milesToMeters, color: '#ef4444', fillOpacity: 0.05, weight: 1, dashArray: '4' }).addTo(map);
  
  // 35 miles (Zone 3)
  L.circle([florenceLat, florenceLng], { radius: 35 * milesToMeters, color: '#f59e0b', fillOpacity: 0.05, weight: 1.5 }).addTo(map);
  
  // 25 miles (Zone 2)
  L.circle([florenceLat, florenceLng], { radius: 25 * milesToMeters, color: '#3b82f6', fillOpacity: 0.1, weight: 2 }).addTo(map);
  
  // 15 miles (Zone 1)
  L.circle([florenceLat, florenceLng], { radius: 15 * milesToMeters, color: '#10b981', fillOpacity: 0.2, weight: 2 }).addTo(map);
  
  // Florence Hub Marker
  L.circleMarker([florenceLat, florenceLng], { radius: 6, color: '#000', fillColor: '#fff', fillOpacity: 1, weight: 2 }).addTo(map).bindPopup("EDR Dispatch (Florence)");
});
