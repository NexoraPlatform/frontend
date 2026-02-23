import { NextResponse } from 'next/server';
import { API_BASE_URL, appendSetCookie, buildProxyHeaders } from '@/lib/server/laravel-proxy';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const incomingUrl = new URL(req.url);
  const targetUrl = new URL(`${API_BASE_URL}/ai/recommend-providers`);

  incomingUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const headers = buildProxyHeaders(req, {
    'Content-Type': 'application/json',
  });

  const response = await fetch(targetUrl.toString(), {
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
  appendSetCookie(response, nextResponse, req);
  return nextResponse;
}
