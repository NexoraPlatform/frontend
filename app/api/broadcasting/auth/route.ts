import { NextResponse } from 'next/server';
import { serverRequest, ServerRequestError } from '@/lib/server/api';
import { assertTrustedMutationRequest } from '@/lib/server/laravel-proxy';

export async function POST(request: Request) {
  try {
    assertTrustedMutationRequest(request);
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

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

  try {
    const data = await serverRequest<any>('/broadcasting/auth', {
      method: 'POST',
      body: payload,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    const message = error?.message ?? 'Broadcast auth failed';
    const status =
      error instanceof ServerRequestError
        ? error.status
        : typeof error?.status === 'number'
          ? error.status
          : 500;
    return NextResponse.json({ message }, { status });
  }
}
