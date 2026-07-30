import { cookies } from 'next/headers';
import db from './db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function requireAdminSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('admin_session');

  if (!sessionCookie || !sessionCookie.value) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = sessionCookie.value;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const { rows } = await db.execute({
    sql: `SELECT * FROM admin_sessions WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > datetime('now')`,
    args: [tokenHash]
  });

  if (rows.length === 0) {
    return { error: 'Unauthorized', status: 401 };
  }

  // Update last_used_at
  await db.execute({
    sql: `UPDATE admin_sessions SET last_used_at = datetime('now') WHERE id = ?`,
    args: [rows[0].id]
  });

  return { success: true, admin: rows[0].admin_identity };
}
