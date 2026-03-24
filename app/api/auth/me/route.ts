import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchPassportUserProfile } from '@/lib/auth/passport';
import { normalizeAuthUser, sanitizeAuthResponsePayload } from '@/lib/auth/user';

export async function GET(req: Request) {
  const session = await auth();
  const sessionUser = normalizeAuthUser(session?.user ?? null);
  const hasSessionAccessToken =
    typeof session?.accessToken === 'string' && session.accessToken.length > 0;

  if (!hasSessionAccessToken) {
    if (!sessionUser) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    return NextResponse.json({ user: sessionUser }, { status: 200 });
  }

  try {
    const payload = await fetchPassportUserProfile(session.accessToken!, {
      origin: req.headers.get('origin'),
      includeConnectedAccounts: true,
    });

    if (!payload && sessionUser) {
      return NextResponse.json({ user: sessionUser }, { status: 200 });
    }

    if (!payload) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    return NextResponse.json(
      sanitizeAuthResponsePayload({
        user: payload,
      }),
      { status: 200 }
    );
  } catch {
    if (sessionUser) {
      return NextResponse.json({ user: sessionUser }, { status: 200 });
    }
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }
}
