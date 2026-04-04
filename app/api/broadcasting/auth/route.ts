import { NextResponse } from 'next/server';
import {
  API_BASE_URL,
  appendSetCookie,
  buildAuthenticatedProxyHeaders,
  ProxySecurityError,
} from '@/lib/server/laravel-proxy';

export async function POST(request: Request) {
  try {
    let payload: Record<string, unknown> = {};

    try {
      const contentType = request.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        payload = (await request.json()) as Record<string, unknown>;
      } else if (
        contentType.includes('application/x-www-form-urlencoded') ||
        contentType.includes('multipart/form-data')
      ) {
        const form = await request.formData();
        payload = Object.fromEntries(form.entries());
      } else {
        const text = await request.text();
        if (text) {
          payload = Object.fromEntries(new URLSearchParams(text));
        }
      }
    } catch {}

    if (!payload.socket_id || !payload.channel_name) {
      return NextResponse.json({ message: 'Invalid broadcasting payload' }, { status: 400 });
    }

    const headers = await buildAuthenticatedProxyHeaders(request, {
      'Content-Type': 'application/json',
    });

    const response = await fetch(`${API_BASE_URL}/broadcasting/auth`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') ?? 'application/json';
    const payloadText = await response.text();
    const nextResponse = new NextResponse(payloadText, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
      },
    });
    appendSetCookie(response, nextResponse, request);
    return nextResponse;
  } catch (error) {
    if (error instanceof ProxySecurityError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
}
