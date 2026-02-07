import { NextResponse } from 'next/server';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://Trustorabe.dacars.ro/api';

export const API_ROOT_URL = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');

const resolveAppOrigin = (req?: Request | null) =>
  req?.headers.get('origin') ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'http://127.0.0.1:3000';

const extractXsrfToken = (cookieHeader: string) => {
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('XSRF-TOKEN='));
  if (!match) return null;
  return decodeURIComponent(match.slice('XSRF-TOKEN='.length));
};

export const buildProxyHeaders = (req: Request, extra?: HeadersInit) => {
  const headers = new Headers({
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  });

  if (extra) {
    const incoming = new Headers(extra);
    incoming.forEach((value, key) => headers.set(key, value));
  }

  const cookieHeader = req.headers.get('cookie') ?? '';
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
    const xsrfToken = extractXsrfToken(cookieHeader);
    if (xsrfToken) {
      headers.set('X-XSRF-TOKEN', xsrfToken);
    }
  }

  const origin = resolveAppOrigin(req);
  if (origin) {
    headers.set('Origin', origin);
    headers.set('Referer', origin);
  }

  return headers;
};

export const appendSetCookie = (from: Response, to: NextResponse) => {
  const getSetCookie = (from.headers as any).getSetCookie?.bind(from.headers);
  const setCookies: string[] = Array.isArray(getSetCookie?.()) ? getSetCookie() : [];

  if (setCookies.length === 0) {
    const single = from.headers.get('set-cookie');
    if (single) {
      to.headers.append('Set-Cookie', single);
    }
    return;
  }

  setCookies.forEach((cookie) => {
    to.headers.append('Set-Cookie', cookie);
  });
};
