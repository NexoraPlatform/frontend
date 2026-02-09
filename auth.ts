import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://Trustorabe.dacars.ro/api';

type AuthUser = Record<string, any> | null;

const buildCookieHeader = (cookieHeader: string | null | undefined) => cookieHeader ?? '';

const buildCookieHeaderFromStore = (store: Awaited<ReturnType<typeof cookies>>) =>
  store
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

const getCookieValue = (cookieHeader: string, name: string) => {
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return match.slice(name.length + 1);
};

const hasSessionCookie = (cookieHeader: string) => Boolean(getCookieValue(cookieHeader, 'laravel_session'));

const resolveAppOrigin = (fallback?: string | null) =>
  fallback ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'http://127.0.0.1:3000';

const fetchAuthUser = async (cookieHeader: string, origin?: string | null): Promise<AuthUser> => {
  if (!cookieHeader || !hasSessionCookie(cookieHeader)) return null;

  const headers: HeadersInit = {
    Accept: 'application/json',
    Cookie: cookieHeader,
    'X-Requested-With': 'XMLHttpRequest',
  };

  const appOrigin = resolveAppOrigin(origin ?? null);
  if (appOrigin) {
    headers['Origin'] = appOrigin;
    headers['Referer'] = appOrigin;
  }

  const xsrfToken = getCookieValue(cookieHeader, 'XSRF-TOKEN');
  if (xsrfToken) {
    headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers,
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data?.user ?? data ?? null;
};

const fetchServerSession = async () => {
  const store = await cookies();
  const cookieHeader = buildCookieHeaderFromStore(store);
  const user = await fetchAuthUser(cookieHeader, resolveAppOrigin(null));
  return user ? { user } : null;
};

export function auth(handler?: (req: NextRequest) => Promise<Response> | Response) {
  if (typeof handler === 'function') {
    return async (req: NextRequest) => {
      const cookieHeader = buildCookieHeader(req.headers.get('cookie'));
      const user = await fetchAuthUser(cookieHeader, req.nextUrl.origin);
      (req as any).auth = user ? { user } : null;
      return handler(req);
    };
  }

  return fetchServerSession();
}

export type AuthSession = Awaited<ReturnType<typeof auth>>;
