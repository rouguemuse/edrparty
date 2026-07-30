import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

function getIp(request: Request) {
  return request.headers.get('x-forwarded-for') || '127.0.0.1';
}

export async function POST(request: Request) {
  try {
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!adminPasswordHash) {
      console.error("ADMIN_PASSWORD_HASH is not configured.");
      return NextResponse.json({ error: "Authentication system unavailable." }, { status: 503 });
    }

    const body = await request.json();
    const { password } = body;

    const ip = getIp(request);
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    // Check rate limit
    const { rows: attemptRows } = await db.execute({
      sql: 'SELECT * FROM login_attempts WHERE ip_hash = ?',
      args: [ipHash]
    });
    
    if (attemptRows.length > 0) {
      const attempt = attemptRows[0] as any;
      if (attempt.locked_until && new Date(attempt.locked_until) > new Date()) {
        return NextResponse.json({ error: 'Too many failed attempts. Try again later.' }, { status: 429 });
      }
    }

    if (!password) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, adminPasswordHash);

    if (!isValid) {
      // Record failed attempt
      if (attemptRows.length > 0) {
        const attempt = attemptRows[0] as any;
        const newCount = attempt.failed_attempts + 1;
        let lockedUntil = null;
        if (newCount >= 5) {
          lockedUntil = `datetime('now', '+15 minutes')`;
        }
        await db.execute({
          sql: `UPDATE login_attempts SET failed_attempts = ?, locked_until = ${lockedUntil || 'NULL'} WHERE ip_hash = ?`,
          args: [newCount, ipHash]
        });
      } else {
        await db.execute({
          sql: `INSERT INTO login_attempts (ip_hash, failed_attempts, first_attempt_at) VALUES (?, 1, datetime('now'))`,
          args: [ipHash]
        });
      }
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // Success - reset attempts
    if (attemptRows.length > 0) {
      await db.execute({
        sql: `DELETE FROM login_attempts WHERE ip_hash = ?`,
        args: [ipHash]
      });
    }

    // Create session
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await db.execute({
      sql: `INSERT INTO admin_sessions (token_hash, admin_identity, created_at, expires_at) VALUES (?, ?, datetime('now'), datetime('now', '+12 hours'))`,
      args: [tokenHash, 'admin']
    });

    const response = NextResponse.json({ success: true });
    
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 12 * 60 * 60 // 12 hours
    });

    return response;
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
