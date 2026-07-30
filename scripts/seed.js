const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'edr_rentals.db');
const db = new Database(dbPath, { verbose: console.log });
db.pragma('foreign_keys = ON');

console.log('Initializing database schema...');
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_es TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_es TEXT NOT NULL,
    base_price REAL NOT NULL,
    tracking_mode TEXT NOT NULL DEFAULT 'serialized',
    total_quantity INTEGER NOT NULL DEFAULT 1,
    actual_length REAL,
    actual_width REAL,
    actual_height REAL,
    setup_length REAL,
    setup_width REAL,
    setup_height REAL,
    outlets_required INTEGER DEFAULT 1,
    water_required INTEGER DEFAULT 0,
    attendant_required INTEGER DEFAULT 0,
    image TEXT NOT NULL,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS inventory_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    internal_inventory_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inquiry_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    event_date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    event_address TEXT NOT NULL,
    city TEXT NOT NULL,
    zip TEXT NOT NULL,
    destination_latitude REAL,
    destination_longitude REAL,
    normalized_address TEXT,
    calculated_driving_miles REAL,
    routing_provider TEXT,
    distance_calculated_at TEXT,
    distance_status TEXT DEFAULT 'estimated',
    delivery_fee REAL DEFAULT 0,
    surface_type TEXT,
    water_access INTEGER DEFAULT 0,
    power_access INTEGER DEFAULT 1,
    gate_or_stairs_notes TEXT,
    customer_notes TEXT,
    preferred_payment_method TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inquiry_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inquiry_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    requested_quantity INTEGER NOT NULL DEFAULT 1,
    quoted_price REAL NOT NULL,
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inquiry_id INTEGER,
    customer_id INTEGER,
    event_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'hold',
    hold_expires_at TEXT,
    payment_status TEXT NOT NULL DEFAULT 'Pending confirmation',
    deposit_required INTEGER NOT NULL DEFAULT 1,
    deposit_amount REAL DEFAULT 0,
    deposit_received INTEGER NOT NULL DEFAULT 0,
    deposit_received_at TEXT,
    payment_method_used TEXT,
    payment_reference TEXT,
    balance_due REAL DEFAULT 0,
    balance_paid REAL DEFAULT 0,
    calculated_delivery_fee REAL DEFAULT 0,
    override_delivery_fee REAL,
    override_reason TEXT,
    overridden_by TEXT,
    overridden_at TEXT,
    internal_notes TEXT,
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
  );

  CREATE TABLE IF NOT EXISTS reservation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    inventory_unit_id INTEGER,
    quantity INTEGER NOT NULL DEFAULT 1,
    event_date TEXT NOT NULL,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (inventory_unit_id) REFERENCES inventory_units(id)
  );

  CREATE TABLE IF NOT EXISTS availability_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    inventory_unit_id INTEGER,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT 'maintenance',
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS delivery_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en TEXT NOT NULL,
    name_es TEXT NOT NULL,
    min_miles REAL NOT NULL,
    max_miles REAL,
    delivery_fee REAL,
    minimum_order REAL NOT NULL DEFAULT 0,
    free_delivery_threshold REAL,
    requires_staff_confirmation INTEGER DEFAULT 0,
    requires_custom_quote INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
  );
`);

console.log('Seeding products...');

const insertProduct = db.prepare(`
  INSERT INTO products (
    slug, category, name_en, name_es, description_en, description_es,
    base_price, tracking_mode, total_quantity,
    setup_length, setup_width, setup_height,
    outlets_required, water_required, image
  ) VALUES (
    @slug, @category, @name_en, @name_es, @description_en, @description_es,
    @base_price, @tracking_mode, @total_quantity,
    @setup_length, @setup_width, @setup_height,
    @outlets_required, @water_required, @image
  )
`);

const insertUnit = db.prepare(`
  INSERT INTO inventory_units (product_id, internal_inventory_number) VALUES (?, ?)
`);

const products = [
  {
    slug: 'castle-bounce-house',
    category: 'bounce',
    name_en: 'Castle Bounce House with Slide',
    name_es: 'Bricolín Castillo con Resbaladilla',
    description_en: 'Classic primary-colored commercial castle bouncer with entry slide. High inflatable walls, safety ramp, and deep jumping bed.',
    description_es: 'Bricolín inflable comercial estilo castillo en colores primarios con resbaladilla. Paredes altas de seguridad y gran área de salto.',
    base_price: 225.0,
    tracking_mode: 'serialized',
    total_quantity: 1,
    setup_length: 20, setup_width: 20, setup_height: 15,
    outlets_required: 1, water_required: 0,
    image: '/edrparty/images/category_bounce.jpg'
  },
  {
    slug: 'sunshine-splash',
    category: 'water',
    name_en: 'Sunshine Splash Water Slide',
    name_es: 'Tobogán de Agua Sunshine Splash',
    description_en: 'Bright sunshine yellow and sky blue water slide with steep climbing ladder, safety top canopy, and splash pool.',
    description_es: 'Tobogán acuático amarillo y azul con brillante diseño de sol. Escalera inclinada, toldo de seguridad y alberca.',
    base_price: 225.0,
    tracking_mode: 'serialized',
    total_quantity: 1,
    setup_length: 20, setup_width: 16, setup_height: 20,
    outlets_required: 1, water_required: 1,
    image: '/edrparty/images/sunshine20.16.20.png'
  },
  {
    slug: 'green-monster',
    category: 'water',
    name_en: 'Green Monster Water Slide',
    name_es: 'Tobogán de Agua Monstruo Verde',
    description_en: 'Vibrant green 28ft long commercial water slide. Features deep side rails, slick water runway, and landing pool.',
    description_es: 'Tobogán de agua comercial verde vibrante de 28 pies de largo. Rieles laterales altos y alberca de llegada.',
    base_price: 210.0,
    tracking_mode: 'serialized',
    total_quantity: 1,
    setup_length: 28, setup_width: 14, setup_height: 15,
    outlets_required: 1, water_required: 1,
    image: '/edrparty/images/greenslide28.14.png'
  },
  {
    slug: 'ninja-turtles-bounce',
    category: 'bounce',
    name_en: 'Ninja Turtles Bounce House',
    name_es: 'Bricolín Tortugas Ninja',
    description_en: 'Action-packed Ninja Turtles commercial bouncer featuring high mesh ventilation windows and safety entrance step.',
    description_es: 'Bricolín temático de las Tortugas Ninja. Ventanas de malla de alta ventilación y escalón de seguridad.',
    base_price: 175.0,
    tracking_mode: 'serialized',
    total_quantity: 1,
    setup_length: 18, setup_width: 15, setup_height: 20,
    outlets_required: 1, water_required: 0,
    image: '/edrparty/images/Ninjaturlesbounce_18.15.20.png'
  },
  {
    slug: 'princess-castle',
    category: 'bounce',
    name_en: 'Princess Castle Bounce House',
    name_es: 'Bricolín Castillo de Princesas',
    description_en: 'Royal pink and purple princess castle bouncer. Perfect compact sizing for smaller backyards and birthday parties.',
    description_es: 'Bricolín castillo de princesas rosa y morado. Tamaño compacto ideal para patios residenciales.',
    base_price: 160.0,
    tracking_mode: 'serialized',
    total_quantity: 1,
    setup_length: 12, setup_width: 12, setup_height: 12,
    outlets_required: 1, water_required: 0,
    image: '/edrparty/images/princess12.12.png'
  },
  {
    slug: 'rainbow-double-combo',
    category: 'bounce',
    name_en: 'Rainbow Double Slide Bounce Combo',
    name_es: 'Combo Inflable Arcoíris Doble Resbaladilla',
    description_en: 'Multi-activity rainbow castle bouncer featuring dual side exit slides, onion turrets, and central jump area.',
    description_es: 'Bricolín multi-actividad con doble resbaladilla lateral, torres llamativas y área central de salto.',
    base_price: 250.0,
    tracking_mode: 'serialized',
    total_quantity: 1,
    setup_length: 30, setup_width: 16, setup_height: 15,
    outlets_required: 1, water_required: 0,
    image: '/edrparty/images/obstacle_course.png'
  },
  {
    slug: '20ft-water-slide',
    category: 'water',
    name_en: '20ft Water Slide with Tower & Pool',
    name_es: 'Tobogán de Agua de 20ft con Alberca',
    description_en: 'Towering 20ft tall water slide in blue, yellow, and red. Steep climbing ramp, top safety mesh, and deep splash landing pool.',
    description_es: 'Imponente tobogán acuático de 20 pies de alto. Escalera inclinada, malla superior de seguridad y alberca de llegada.',
    base_price: 275.0,
    tracking_mode: 'serialized',
    total_quantity: 1,
    setup_length: 20, setup_width: 16, setup_height: 20,
    outlets_required: 1, water_required: 1,
    image: '/edrparty/images/bounce_house_combo_20x16.png'
  },
  {
    slug: 'dual-bungee-run',
    category: 'bounce',
    name_en: '20ft Dual Bungee Run',
    name_es: 'Pista Bungee de Carreras Doble de 25ft',
    description_en: 'Head-to-head competitive dual lane bungee run. Features twin runway lanes, velcro marker batons, and padded back wall.',
    description_es: 'Pista de carreras bungee interactiva frente a frente. Dos carriles paralelos, marcadores de velcro y pared acolchada.',
    base_price: 200.0,
    tracking_mode: 'serialized',
    total_quantity: 1,
    setup_length: 25, setup_width: 12, setup_height: 8,
    outlets_required: 1, water_required: 0,
    image: '/edrparty/images/bungee_run.png'
  },
  // QUANTITY ITEMS (Tables & Chairs)
  {
    slug: 'white-folding-chair',
    category: 'seating',
    name_en: 'White Folding Chair',
    name_es: 'Silla Blanca Plegable',
    description_en: 'Commercial heavy-duty white plastic folding chair.',
    description_es: 'Silla plegable comercial de plástico blanco resistente.',
    base_price: 2.50,
    tracking_mode: 'quantity',
    total_quantity: 100,
    setup_length: 2, setup_width: 2, setup_height: 3,
    outlets_required: 0, water_required: 0,
    image: '/edrparty/images/category_seating.jpg'
  },
  {
    slug: '6ft-banquet-table',
    category: 'seating',
    name_en: '6ft White Banquet Table',
    name_es: 'Mesa Blanca de Banquete de 6ft',
    description_en: 'Commercial 6ft white plastic folding banquet table.',
    description_es: 'Mesa plegable blanca tipo banquete de 6 pies.',
    base_price: 10.0,
    tracking_mode: 'quantity',
    total_quantity: 20,
    setup_length: 6, setup_width: 3, setup_height: 3,
    outlets_required: 0, water_required: 0,
    image: '/edrparty/images/category_seating.jpg'
  }
];

const insertTransaction = db.transaction((items) => {
  for (const item of items) {
    const result = insertProduct.run(item);
    const productId = result.lastInsertRowid;
    
    // If serialized, create inventory units (one unit per total_quantity)
    if (item.tracking_mode === 'serialized') {
      for (let i = 1; i <= item.total_quantity; i++) {
        insertUnit.run(productId, `INV-${item.slug.toUpperCase().substring(0, 5)}-00${i}`);
      }
    }
  }
});

try {
  // Clear tables to start fresh
  db.exec('DELETE FROM inventory_units');
  db.exec('DELETE FROM products');
  insertTransaction(products);
  console.log('Seeding complete.');
} catch (e) {
  if (e.message.includes('UNIQUE constraint failed')) {
    console.log('Products already seeded.');
  } else {
    console.error('Error seeding products:', e);
  }
}

// Seed admin settings
db.exec(`
  INSERT OR REPLACE INTO admin_settings (key, value) VALUES ('public_hub_lat', '30.8419');
  INSERT OR REPLACE INTO admin_settings (key, value) VALUES ('public_hub_lon', '-97.7947');
  INSERT OR REPLACE INTO admin_settings (key, value) VALUES ('public_hub_address', 'Florence, Texas 76527');
`);

console.log('Seeding delivery zones...');
db.exec('DELETE FROM delivery_zones');
const insertZone = db.prepare(`
  INSERT INTO delivery_zones (
    name_en, name_es, min_miles, max_miles, delivery_fee, 
    minimum_order, free_delivery_threshold, requires_staff_confirmation, requires_custom_quote
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Zone 1
insertZone.run('Zone 1 — Local', 'Zona 1 — Local', 0, 15, 39.0, 0, 349.0, 0, 0);
// Zone 2
insertZone.run('Zone 2 — Near-Local', 'Zona 2 — Cercana', 15, 25, 49.0, 150.0, null, 0, 0);
// Zone 3
insertZone.run('Zone 3 — Regional', 'Zona 3 — Regional', 25, 35, 79.0, 225.0, null, 0, 0);
// Zone 4
insertZone.run('Zone 4 — Extended', 'Zona 4 — Extendida', 35, 50, 119.0, 325.0, null, 1, 0);
// Zone 5
insertZone.run('Zone 5 — Long-Distance', 'Zona 5 — Larga Distancia', 50, 65, 159.0, 425.0, null, 1, 0);
// Zone 6
insertZone.run('Outside Standard Area', 'Fuera del Área Estándar', 65, null, null, 0, null, 1, 1);

console.log('Delivery zones seeded.');
