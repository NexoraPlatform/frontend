import { NextResponse } from 'next/server';
import { API_BASE_URL, appendSetCookie, buildProxyHeaders } from '@/lib/server/laravel-proxy';

export async function GET(req: Request) {
  const headers = buildProxyHeaders(req);
  const url = new URL(`${API_BASE_URL}/auth/me`);
  const incomingUrl = new URL(req.url);

  incomingUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  if (!url.searchParams.has('include')) {
    url.searchParams.set('include', 'connected_accounts');
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
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
