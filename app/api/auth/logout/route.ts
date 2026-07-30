import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import crypto from 'crypto';

export async function POST() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('admin_session');

    if (sessionCookie && sessionCookie.value) {
      const tokenHash = crypto.createHash('sha256').update(sessionCookie.value).digest('hex');
      await db.execute({
        sql: `UPDATE admin_sessions SET revoked_at = datetime('now') WHERE token_hash = ?`,
        args: [tokenHash]
      });
    }

    const response = NextResponse.json({ success: true });
    
    // Expire the cookie
    response.cookies.set('admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0
    });

    return response;
  } catch (error) {
    console.error('Logout Error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
