import { NextResponse } from 'next/server';
import { API_BASE_URL, appendSetCookie, buildProxyHeaders } from '@/lib/server/laravel-proxy';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const headers = buildProxyHeaders(req, {
    'Content-Type': 'application/json',
  });

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const payload = await response.text();
  const nextResponse = new NextResponse(payload, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json',
    },
  });
  appendSetCookie(response, nextResponse);
  return nextResponse;
}
