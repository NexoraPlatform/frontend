import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchPassportUserProfile } from '@/lib/auth/passport';
import { hasSessionAccessToken, hasSessionAuthTokens } from '@/lib/auth/session';
import { normalizeAuthUser, sanitizeAuthResponsePayload } from '@/lib/auth/user';

export async function GET(req: Request) {
  const session = await auth();
  const sessionUser = normalizeAuthUser(session?.user ?? null);
  const hasUsableSession = hasSessionAuthTokens(session as any);
  const hasAccessToken = hasSessionAccessToken(session as any);
  const accessToken = hasAccessToken ? (session as { accessToken: string }).accessToken : null;

  if (!hasUsableSession || !sessionUser) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  if (!hasAccessToken) {
    return NextResponse.json({ user: sessionUser }, { status: 200 });
  }

  try {
    const payload = await fetchPassportUserProfile(accessToken!, {
      origin: req.headers.get('origin'),
      includeConnectedAccounts: true,
    });

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
    return NextResponse.json(
      { message: 'Unable to verify authenticated user' },
      { status: 503 }
    );
  }
}
