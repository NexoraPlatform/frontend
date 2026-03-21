import { NextResponse } from 'next/server';
import { API_BASE_URL, appendSetCookie, buildProxyHeaders } from '@/lib/server/laravel-proxy';
import { sanitizeAuthResponsePayload } from '@/lib/auth/user';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  let headers: Headers;
  try {
    headers = buildProxyHeaders(req, {
      'Content-Type': 'application/json',
    });
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const contentType = response.headers.get('content-type') ?? 'application/json';
  let nextResponse: NextResponse;

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => null);
    nextResponse = NextResponse.json(sanitizeAuthResponsePayload(payload), {
      status: response.status,
    });
  } else {
    const payload = await response.text();
    nextResponse = new NextResponse(payload, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  }

  appendSetCookie(response, nextResponse, req);
  return nextResponse;
}
