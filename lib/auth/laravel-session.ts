export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://Trustorabe.dacars.ro/api';

type AuthUser = Record<string, any> | null;

export const getCookieValue = (cookieHeader: string, name: string) => {
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return match.slice(name.length + 1);
};

export const hasLaravelSessionCookie = (cookieHeader: string) =>
  Boolean(getCookieValue(cookieHeader, 'laravel_session'));

export const resolveAppOrigin = (fallback?: string | null) =>
  fallback ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  process.env.AUTH_URL ||
  'http://127.0.0.1:3000';

export type CookieStore = {
  getAll: () => Array<{ name: string; value: string }>;
};

export const buildCookieHeaderFromStore = (store: CookieStore) =>
  store
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

export async function fetchLaravelUserFromCookieHeader(
  cookieHeader: string,
  origin?: string | null,
  includeConnectedAccounts = true
): Promise<AuthUser> {
  if (!cookieHeader || !hasLaravelSessionCookie(cookieHeader)) return null;

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

  try {
    const url = new URL(`${API_BASE_URL}/auth/me`);
    if (includeConnectedAccounts && !url.searchParams.has('include')) {
      url.searchParams.set('include', 'connected_accounts');
    }

    const response = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    return data?.user ?? data ?? null;
  } catch {
    return null;
  }
}
