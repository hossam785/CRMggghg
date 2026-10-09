import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' && body.email.length > 0
      ? body.email
      : 'admin@scopecrm.com';
    const rememberMe = body.rememberMe !== false;

    const user = {
      id: '00000000-0000-0000-0000-000000000001',
      email,
      role: 'authenticated',
      created_at: new Date().toISOString(),
    };

    const response = NextResponse.json({ success: true, user });

    // Set persistent session cookie (30 days if rememberMe, session cookie if false)
    response.cookies.set({
      name: 'sb-dev-session',
      value: JSON.stringify(user),
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : undefined,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'sb-dev-session',
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
  });
  return response;
}
