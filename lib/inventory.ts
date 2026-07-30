import db from './db';

// Checks if a specific product is available on a given date
export async function checkProductAvailability(productId: number, date: string): Promise<{ available: boolean; availableQuantity: number }> {
  const { rows: products } = await db.execute({
    sql: 'SELECT * FROM products WHERE id = ?',
    args: [productId]
  });
  if (products.length === 0) return { available: false, availableQuantity: 0 };
  const product = products[0] as any;

  // Calculate blocked units based on reservations and maintenance
  const blockedQuery = `
    SELECT COALESCE(SUM(ri.quantity), 0) as totalBlocked
    FROM reservation_items ri
    JOIN reservations r ON ri.reservation_id = r.id
    WHERE ri.product_id = ? AND ri.event_date = ?
      AND (
        r.status = 'confirmed' 
        OR (r.status = 'hold' AND (r.hold_expires_at IS NULL OR r.hold_expires_at > datetime('now')))
      )
  `;
  const { rows: blockedRes } = await db.execute({
    sql: blockedQuery,
    args: [productId, date]
  });
  const totalBlocked = (blockedRes[0]?.totalBlocked as number) || 0;

  const maintenanceQuery = `
    SELECT COUNT(*) as count 
    FROM availability_blocks 
    WHERE product_id = ? AND date(?) BETWEEN start_date AND end_date
  `;
  const { rows: maintenanceRes } = await db.execute({
    sql: maintenanceQuery,
    args: [productId, date]
  });
  const maintenanceBlocks = (maintenanceRes[0]?.count as number) || 0;

  const availableQuantity = product.total_quantity - totalBlocked - maintenanceBlocks;

  return {
    available: availableQuantity > 0,
    availableQuantity: Math.max(0, availableQuantity)
  };
}

// Get availability for all active products for a specific date
export async function checkDateAvailability(date: string) {
  const { rows: products } = await db.execute('SELECT * FROM products WHERE active = 1');
  
  const results = [];
  for (const product of products) {
    const { available, availableQuantity } = await checkProductAvailability(product.id as number, date);
    results.push({
      ...product,
      available,
      availableQuantity
    });
  }
  return results;
}

// Atomic operation to create a hold and verify availability inside a transaction
export async function createHold(inquiryId: number, items: { product_id: number; quantity: number }[], eventDate: string, holdHours: number = 24) {
  // 1. Verify availability for all items first
  for (const item of items) {
    const { availableQuantity } = await checkProductAvailability(item.product_id, eventDate);
    if (availableQuantity < item.quantity) {
      throw new Error(`Product ID ${item.product_id} does not have enough availability for ${eventDate}.`);
    }
  }

  // 2. Create the reservation record as 'hold' using a transaction
  const transaction = await db.transaction();
  try {
    const expiresAt = `datetime('now', '+${holdHours} hours')`;
    const insertRes = await transaction.execute({
      sql: `INSERT INTO reservations (inquiry_id, event_date, status, hold_expires_at) VALUES (?, ?, 'hold', ${expiresAt})`,
      args: [inquiryId, eventDate]
    });
    
    const reservationId = insertRes.lastInsertRowid;
    if (!reservationId) throw new Error("Failed to insert reservation");

    // 3. Create reservation items
    for (const item of items) {
      await transaction.execute({
        sql: `INSERT INTO reservation_items (reservation_id, product_id, quantity, event_date) VALUES (?, ?, ?, ?)`,
        args: [reservationId, item.product_id, item.quantity, eventDate]
      });
    }

    await transaction.commit();
    return reservationId;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Confirm a reservation
export async function confirmReservation(reservationId: number) {
  const info = await db.execute({
    sql: `UPDATE reservations SET status = 'confirmed', hold_expires_at = NULL WHERE id = ?`,
    args: [reservationId]
  });
  
  return info.rowsAffected > 0;
}
