import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { revokePassportAccessToken } from '@/lib/auth/passport';

export async function POST(req: Request) {
  const session = await auth();
  const accessToken =
    typeof session?.accessToken === 'string' && session.accessToken.length > 0
      ? session.accessToken
      : null;

  if (!accessToken) {
    return NextResponse.json({ message: 'Logged out' }, { status: 200 });
  }

  try {
    const response = await revokePassportAccessToken({
      accessToken,
      origin: req.headers.get('origin'),
    });

    const contentType = response.headers.get('content-type') ?? 'application/json';
    if (contentType.includes('application/json')) {
      const payload = await response.json().catch(() => null);
      return NextResponse.json(payload ?? { message: 'Logged out' }, { status: response.status });
    }

    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch {
    return NextResponse.json({ message: 'Logout failed' }, { status: 500 });
  }
}
