import 'server-only';

import { cache } from 'react';
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
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

type CachedServerGetOptions = Omit<ServerRequestOptions, 'method' | 'body'>;

type SerializedCachedServerGetOptions = {
  cache?: RequestCache;
  headers?: Record<string, string>;
  language?: string | null;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  query?: Record<string, string>;
};

export class ServerRequestError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ServerRequestError';
    this.status = status;
    this.data = data;
  }
}

const normalizeMethod = (method?: string) => (method ?? 'GET').toUpperCase();

const resolveRequestCache = (
  method: string,
  options: Pick<ServerRequestOptions, 'cache' | 'next'>
): RequestCache => {
  if (options.cache) {
    return options.cache;
  }

  if (method !== 'GET') {
    return 'no-store';
  }

  if (options.next?.revalidate === 0) {
    return 'no-store';
  }

  return 'force-cache';
};

const normalizeCachedHeaders = (headers?: HeadersInit) => {
  if (!headers) {
    return undefined;
  }

  const normalizedHeaders = new Headers(headers);
  const entries = Array.from(normalizedHeaders.entries()).sort(([left], [right]) =>
    left.localeCompare(right)
  );

  return Object.fromEntries(entries);
};

const normalizeCachedQuery = (
  query?: Record<string, string | number | boolean | null | undefined>
) => {
  if (!query) {
    return undefined;
  }

  const entries = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)] as const)
    .sort(([left], [right]) => left.localeCompare(right));

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const normalizeCachedNextOptions = (next?: ServerRequestOptions['next']) => {
  if (!next) {
    return undefined;
  }

  const normalizedTags =
    next.tags && next.tags.length > 0 ? [...new Set(next.tags)].sort() : undefined;

  return {
    ...(next.revalidate !== undefined ? { revalidate: next.revalidate } : {}),
    ...(normalizedTags ? { tags: normalizedTags } : {}),
  };
};

const serializeCachedServerGetOptions = (options: CachedServerGetOptions) =>
  JSON.stringify({
    ...(options.cache ? { cache: options.cache } : {}),
    ...(options.headers ? { headers: normalizeCachedHeaders(options.headers) } : {}),
    ...(options.language !== undefined ? { language: options.language } : {}),
    ...(options.next ? { next: normalizeCachedNextOptions(options.next) } : {}),
    ...(options.query ? { query: normalizeCachedQuery(options.query) } : {}),
  } satisfies SerializedCachedServerGetOptions);

const cachedServerGetInternal = cache(
  async (endpoint: string, serializedOptions: string): Promise<unknown> => {
    const parsedOptions = JSON.parse(serializedOptions) as SerializedCachedServerGetOptions;

    return serverRequest(endpoint, {
      ...parsedOptions,
      method: 'GET',
    });
  }
);

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

  const method = normalizeMethod(options.method);
  const requestCache = resolveRequestCache(method, options);

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body as BodyInit | undefined,
    cache: requestCache,
    ...(options.next ? { next: options.next } : {}),
  });

  if (!response.ok) {
    let errorData: unknown = null;
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      errorData = await response.json();
      if (errorData && typeof errorData === 'object') {
        const payload = errorData as Record<string, unknown>;
        errorMessage =
          (typeof payload.message === 'string' && payload.message) ||
          (typeof payload.error === 'string' && payload.error) ||
          errorMessage;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new ServerRequestError(errorMessage, response.status, errorData);
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

export async function cachedServerGet<T>(
  endpoint: string,
  options: CachedServerGetOptions = {}
): Promise<T> {
  const normalizedOptions = {
    ...options,
    cache: resolveRequestCache('GET', options),
  };

  if (normalizedOptions.cache === 'no-store') {
    return serverRequest<T>(endpoint, {
      ...normalizedOptions,
      method: 'GET',
    });
  }

  return (await cachedServerGetInternal(
    endpoint,
    serializeCachedServerGetOptions(normalizedOptions)
  )) as T;
}
