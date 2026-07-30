import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:edr_rentals.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({
  url,
  authToken,
});

export async function initDb() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS products (
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
    )`,
    `CREATE TABLE IF NOT EXISTS inventory_units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      internal_inventory_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    `CREATE TABLE IF NOT EXISTS inquiries (
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
    )`,
    `CREATE TABLE IF NOT EXISTS inquiry_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      requested_quantity INTEGER NOT NULL DEFAULT 1,
      quoted_price REAL NOT NULL,
      FOREIGN KEY (inquiry_id) REFERENCES inquiries(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    `CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_id INTEGER,
      customer_id INTEGER,
      event_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'hold',
      hold_expires_at TEXT,
      payment_status TEXT NOT NULL DEFAULT 'Pending confirmation',
      booking_retainer_cents INTEGER,
      retainer_due_at TEXT,
      agreement_accepted_at TEXT,
      confirmed_at TEXT,
      deposit_required INTEGER NOT NULL DEFAULT 1,
      deposit_amount_cents INTEGER DEFAULT 0,
      deposit_received INTEGER NOT NULL DEFAULT 0,
      deposit_received_at TEXT,
      payment_method_used TEXT,
      payment_reference TEXT,
      balance_due REAL DEFAULT 0,
      balance_paid REAL DEFAULT 0,
      grand_total_cents INTEGER,
      balance_due_cents INTEGER DEFAULT 0,
      calculated_delivery_fee REAL DEFAULT 0,
      override_delivery_fee REAL,
      override_reason TEXT,
      overridden_by TEXT,
      overridden_at TEXT,
      internal_notes TEXT,
      FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
    )`,
    `CREATE TABLE IF NOT EXISTS reservation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      inventory_unit_id INTEGER,
      quantity INTEGER NOT NULL DEFAULT 1,
      event_date TEXT NOT NULL,
      FOREIGN KEY (reservation_id) REFERENCES reservations(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (inventory_unit_id) REFERENCES inventory_units(id)
    )`,
    `CREATE TABLE IF NOT EXISTS availability_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      inventory_unit_id INTEGER,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT 'maintenance',
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS delivery_zones (
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
    )`,
    `CREATE TABLE IF NOT EXISTS payment_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      payment_method TEXT,
      payment_reference TEXT,
      note TEXT,
      recorded_by TEXT,
      created_at TEXT NOT NULL,
      idempotency_key TEXT UNIQUE,
      reverses_event_id INTEGER,
      FOREIGN KEY (reservation_id) REFERENCES reservations(id)
    )`,
    `CREATE TABLE IF NOT EXISTS admin_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT NOT NULL UNIQUE,
      admin_identity TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      last_used_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_hash TEXT NOT NULL UNIQUE,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      first_attempt_at TEXT NOT NULL,
      locked_until TEXT
    )`
  ];
  
  await db.batch(statements);
  console.log("Database initialized successfully.");
}

export default db;
