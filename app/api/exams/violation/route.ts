import { NextResponse } from 'next/server';
import {
  API_BASE_URL,
  appendSetCookie,
  buildProxyHeaders,
} from '@/lib/server/laravel-proxy';

export async function POST(req: Request) {
  const body = await req.text();
  const headers = buildProxyHeaders(req, {
    'Content-Type': req.headers.get('content-type') ?? 'application/json',
  });

  const response = await fetch(`${API_BASE_URL}/exams/log-violation`, {
    method: 'POST',
    headers,
    body: body || undefined,
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
