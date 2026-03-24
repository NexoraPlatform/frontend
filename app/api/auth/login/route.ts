import { NextResponse } from 'next/server';
import {
  exchangePassportPasswordGrant,
  fetchPassportUserProfile,
} from '@/lib/auth/passport';
import { sanitizeAuthResponsePayload } from '@/lib/auth/user';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 422 });
  }

  try {
    const tokenPayload = await exchangePassportPasswordGrant({
      username: email,
      password,
      origin: req.headers.get('origin'),
    });
    const userPayload = await fetchPassportUserProfile(tokenPayload.access_token, {
      origin: req.headers.get('origin'),
      includeConnectedAccounts: true,
    });

    return NextResponse.json(
      sanitizeAuthResponsePayload({
        ...tokenPayload,
        user: userPayload,
      }),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Login failed' },
      { status: 401 }
    );
  }
}
