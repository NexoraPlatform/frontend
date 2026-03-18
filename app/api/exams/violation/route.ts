import { NextResponse } from 'next/server';
import {
  API_BASE_URL,
  appendSetCookie,
  buildProxyHeaders,
} from '@/lib/server/laravel-proxy';

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') ?? 'application/json';
  let forwardedBody = await req.text();
  let explicitXsrfToken: string | null = null;

  if (contentType.includes('application/json') && forwardedBody) {
    try {
      const parsed = JSON.parse(forwardedBody) as Record<string, unknown>;
      explicitXsrfToken =
        typeof parsed.xsrf_token === 'string' ? parsed.xsrf_token : null;
      if ('xsrf_token' in parsed) {
        delete parsed.xsrf_token;
        forwardedBody = JSON.stringify(parsed);
      }
    } catch {
      return NextResponse.json({ message: 'Invalid request payload' }, { status: 400 });
    }
  }

  let headers: Headers;
  try {
    headers = buildProxyHeaders(
      req,
      {
        'Content-Type': contentType,
      },
      { explicitXsrfToken }
    );
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const response = await fetch(`${API_BASE_URL}/exams/log-violation`, {
    method: 'POST',
    headers,
    body: forwardedBody || undefined,
    cache: 'no-store',
  });

  const payload = await response.text();
  const nextResponse = new NextResponse(payload, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json',
    },
  });

  appendSetCookie(response, nextResponse, req);
  return nextResponse;
}
