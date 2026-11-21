import { cookies } from 'next/headers';
import db from './db';
import crypto from 'crypto';

export async function requireAdminSession() {
  const token = cookies().get('admin_session')?.value;
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return { error: 'Unauthorized', status: 401 };
  }
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { rows } = await db.execute({
      sql: "SELECT id, admin_identity FROM admin_sessions WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > datetime('now') LIMIT 1",
      args: [tokenHash]
    });
    if (rows.length !== 1) return { error: 'Unauthorized', status: 401 };
    await db.execute({
      sql: "UPDATE admin_sessions SET last_used_at = datetime('now') WHERE id = ?",
      args: [rows[0].id]
    });
    return { success: true, admin: String(rows[0].admin_identity) };
  } catch (error) {
    console.error('Admin session validation failed');
    return { error: 'Unauthorized', status: 401 };
  }
}

export function verifyAdminPassword(input: unknown): boolean {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured || configured.length < 12 || typeof input !== 'string') return false;
  const inputHash = crypto.createHash('sha256').update(input).digest();
  const configuredHash = crypto.createHash('sha256').update(configured).digest();
  return crypto.timingSafeEqual(inputHash, configuredHash);
}
