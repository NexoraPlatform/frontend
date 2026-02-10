import { NextResponse } from 'next/server';
import { API_BASE_URL, appendSetCookie, buildProxyHeaders } from '@/lib/server/laravel-proxy';

export async function GET(req: Request) {
  const headers = buildProxyHeaders(req);

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
