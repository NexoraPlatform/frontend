import { NextResponse } from 'next/server';
import {
  API_BASE_URL,
  appendSetCookie,
  buildAuthenticatedProxyHeaders,
} from '@/lib/server/laravel-proxy';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const incomingUrl = new URL(req.url);
  const targetUrl = new URL(
    `${API_BASE_URL}/ai/final-brief/${encodeURIComponent(String(id))}`
  );

  incomingUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const headers = await buildAuthenticatedProxyHeaders(req);
  const response = await fetch(targetUrl.toString(), {
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
