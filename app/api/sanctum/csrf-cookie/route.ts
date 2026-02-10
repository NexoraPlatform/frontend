import { NextResponse } from 'next/server';
import { API_ROOT_URL, appendSetCookie, buildProxyHeaders } from '@/lib/server/laravel-proxy';

export async function GET(req: Request) {
  const headers = buildProxyHeaders(req);

  const response = await fetch(`${API_ROOT_URL}/sanctum/csrf-cookie`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  const nextResponse = new NextResponse(null, { status: response.status });
  appendSetCookie(response, nextResponse, req);
  return nextResponse;
}
