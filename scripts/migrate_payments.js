const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'edr_rentals.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Starting payment fields migration...');

// Safe column addition helper
function addColumn(table, columnDef, columnName) {
  const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = tableInfo.some(col => col.name === columnName);
  if (!exists) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`).run();
    console.log(`[ADDED] ${table}.${columnName}`);
  } else {
    console.log(`[SKIPPED] ${table}.${columnName} already exists`);
  }
}

const migrate = db.transaction(() => {
  // Inquiries table
  addColumn('inquiries', 'preferred_payment_method TEXT', 'preferred_payment_method');
  
  // Reservations table
  addColumn('reservations', "payment_status TEXT NOT NULL DEFAULT 'Pending confirmation'", 'payment_status');
  addColumn('reservations', 'deposit_required INTEGER NOT NULL DEFAULT 1', 'deposit_required');
  // deposit_amount already exists in original schema, but verify
  addColumn('reservations', 'deposit_amount REAL DEFAULT 0', 'deposit_amount');
  addColumn('reservations', 'deposit_received INTEGER NOT NULL DEFAULT 0', 'deposit_received');
  // deposit_received_at already exists, but verify
  addColumn('reservations', 'deposit_received_at TEXT', 'deposit_received_at');
  addColumn('reservations', 'payment_method_used TEXT', 'payment_method_used');
  addColumn('reservations', 'payment_reference TEXT', 'payment_reference');
  // balance_due already exists, but verify
  addColumn('reservations', 'balance_due REAL DEFAULT 0', 'balance_due');
  addColumn('reservations', 'balance_paid REAL DEFAULT 0', 'balance_paid');
});

try {
  migrate();
  console.log('Migration completed successfully.');
} catch (err) {
  console.error('Migration failed:', err);
}
