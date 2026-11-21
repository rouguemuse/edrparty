import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyAdminPassword } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const configured = process.env.ADMIN_PASSWORD;
    if (!configured || configured.length < 12) {
      return NextResponse.json({ error: 'Admin login unavailable.' }, { status: 503 });
    }
    const body = await request.json();
    if (!verifyAdminPassword(body?.password)) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    try {
      await db.execute({
        sql: "INSERT INTO admin_sessions (token_hash, admin_identity, created_at, expires_at) VALUES (?, ?, datetime('now'), datetime('now', '+12 hours'))",
        args: [tokenHash, 'admin']
      });
    } catch (error) {
      console.error('Admin session persistence failed');
      return NextResponse.json({ error: 'Admin login unavailable.' }, { status: 503 });
    }
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 12 * 60 * 60
    });
    return response;
  } catch (error) {
    console.error('Admin login failed');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
