import 'server-only';

import { cookies } from 'next/headers';
import { defaultLocale } from '@/lib/i18n';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://Trustorabe.dacars.ro/api';

const SUPPORTED_LOCALES = new Set(['ro', 'en']);

const normalizeLocale = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return SUPPORTED_LOCALES.has(normalized) ? normalized : null;
};

const resolveLocale = async (explicit?: string | null) => {
  const normalized = normalizeLocale(explicit);
  if (normalized) return normalized;

  const cookieStore = await cookies();
  const cookieLocale = normalizeLocale(cookieStore.get('NEXT_LOCALE')?.value);
  if (cookieLocale) return cookieLocale;

  return normalizeLocale(defaultLocale) ?? null;
};

const buildCookieHeader = (cookieStore: Awaited<ReturnType<typeof cookies>>) =>
  cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

const resolveXsrfToken = (cookieHeader: string) => {
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('XSRF-TOKEN='));
  if (!match) return null;
  return decodeURIComponent(match.slice('XSRF-TOKEN='.length));
};

type ServerRequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: HeadersInit;
  cache?: RequestCache;
  language?: string | null;
};

export async function serverRequest<T>(
  endpoint: string,
  options: ServerRequestOptions = {}
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }

  const selectedLanguage = await resolveLocale(options.language ?? null);
  if (selectedLanguage && !url.searchParams.has('language')) {
    url.searchParams.set('language', selectedLanguage);
  }

  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore);
  const xsrfToken = resolveXsrfToken(cookieHeader);

  const headers = new Headers({ Accept: 'application/json' });
  if (options.headers) {
    const incoming = new Headers(options.headers);
    incoming.forEach((value, key) => headers.set(key, value));
  }
  if (cookieHeader) headers.set('Cookie', cookieHeader);
  if (xsrfToken) headers.set('X-XSRF-TOKEN', xsrfToken);
  headers.set('X-Requested-With', 'XMLHttpRequest');
  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://127.0.0.1:3000';
  headers.set('Origin', appOrigin);
  headers.set('Referer', appOrigin);

  let body = options.body;
  if (body instanceof FormData) {
    // Let fetch set the boundary for multipart/form-data
  } else if (body !== undefined) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers,
    body: body as BodyInit | undefined,
    cache: options.cache ?? 'no-store',
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (error) {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }

  return {} as T;
}
