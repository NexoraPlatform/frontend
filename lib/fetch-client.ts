const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://Trustorabe.dacars.ro/api';

const API_ROOT_URL = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
const DEFAULT_CURRENCY = 'USD';
const CURRENCY_STORAGE_KEY = 'preferred_currency';
const SUPPORTED_LOCALES = new Set(['ro', 'en']);

type ParamPrimitive = string | number | boolean | null | undefined;
type ParamValue = ParamPrimitive | ParamPrimitive[];
type RequestBody =
  | BodyInit
  | Record<string, unknown>
  | Array<unknown>
  | string
  | number
  | boolean
  | null;

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: RequestBody;
  params?: Record<string, ParamValue>;
  baseURL?: string;
  parseAs?: 'auto' | 'json' | 'text' | 'response';
  skipAuthHandling?: boolean;
  skipCsrfRetry?: boolean;
  skipDefaultParams?: boolean;
  skipDefaultHeaders?: boolean;
}

export interface ApiFetchConfig {
  baseURL?: string;
  headers?: HeadersInit;
}

type UnauthorizedHandler = (error: FetchError) => void;

export class FetchError extends Error {
  status: number;
  response: Response;
  data: unknown;
  url: string;

  constructor(message: string, status: number, response: Response, data: unknown, url: string) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.response = response;
    this.data = data;
    this.url = url;
  }
}

const isBrowser = typeof window !== 'undefined';

const isAbsoluteUrl = (value: string) =>
  /^https?:\/\//i.test(value) || value.startsWith('//');

const normalizeApiUrl = (value: string) => {
  if (!value) return value;
  if (isAbsoluteUrl(value)) return value;
  if (value.startsWith('/sanctum')) return value;
  if (value === '/api' || value.startsWith('/api/')) return value;
  if (value.startsWith('/')) return `/api${value}`;
  return `/api/${value}`;
};

const shouldAttachDefaultQueryParams = (urlPath: string) => {
  const normalized = urlPath.toLowerCase();
  if (normalized.includes('/users/active')) return false;
  return true;
};

const getCookieValue = (name: string) => {
  if (!isBrowser || typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return match.slice(name.length + 1);
};

const getSelectedLanguage = (): string | null => {
  if (!isBrowser) return null;

  const pathnameLocale = window.location.pathname.split('/')[1]?.toLowerCase();
  if (pathnameLocale && SUPPORTED_LOCALES.has(pathnameLocale)) {
    return pathnameLocale;
  }

  const queryLocale = new URLSearchParams(window.location.search).get('language')?.toLowerCase();
  if (queryLocale && SUPPORTED_LOCALES.has(queryLocale)) {
    return queryLocale;
  }

  const storedLocale = localStorage.getItem('NEXT_LOCALE')?.toLowerCase();
  if (storedLocale && SUPPORTED_LOCALES.has(storedLocale)) {
    return storedLocale;
  }

  const cookieLocale = document.cookie
    .split('; ')
    .find((row) => row.startsWith('NEXT_LOCALE='))
    ?.split('=')[1]
    ?.toLowerCase();

  if (cookieLocale && SUPPORTED_LOCALES.has(cookieLocale)) {
    return cookieLocale;
  }

  const htmlLang = document.documentElement?.lang?.toLowerCase();
  if (htmlLang && SUPPORTED_LOCALES.has(htmlLang)) {
    return htmlLang;
  }

  return null;
};

const getSelectedCurrency = (): string => {
  if (!isBrowser) return DEFAULT_CURRENCY;
  const queryCurrency = new URLSearchParams(window.location.search).get('currency');
  if (queryCurrency) return queryCurrency;
  return localStorage.getItem(CURRENCY_STORAGE_KEY) || DEFAULT_CURRENCY;
};

const normalizeParams = (params?: Record<string, ParamValue>) => {
  const normalized: Record<string, ParamValue> = {};
  if (!params) return normalized;

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    normalized[key] = value;
  });

  return normalized;
};

const appendSearchParams = (url: URL, params: Record<string, ParamValue>) => {
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined && entry !== null) {
          url.searchParams.append(key, String(entry));
        }
      });
      return;
    }

    url.searchParams.append(key, String(value));
  });
};

const parseBodyIfNeeded = (body: RequestBody | undefined, headers: Headers): BodyInit | undefined => {
  if (body === undefined) return undefined;
  if (
    body === null ||
    typeof body === 'string' ||
    typeof body === 'number' ||
    typeof body === 'boolean'
  ) {
    if (typeof body === 'string') return body;
    return JSON.stringify(body);
  }
  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof ReadableStream
  ) {
    return body as BodyInit;
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return JSON.stringify(body);
};

const parseResponsePayload = async (
  response: Response,
  parseAs: ApiFetchOptions['parseAs'] = 'auto'
) => {
  if (parseAs === 'response') return response;
  if (parseAs === 'text') return response.text();

  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const raw = await response.text();
  if (!raw) return null;

  if (parseAs === 'json') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return raw;
    }
  }

  return raw;
};

const toErrorMessage = (data: unknown, response: Response) => {
  if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;
    const message = payload.message ?? payload.error;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;
};

const buildUrl = (
  endpoint: string,
  params: Record<string, ParamValue>,
  baseURL: string,
  skipDefaultParams?: boolean
) => {
  const normalizedPath = normalizeApiUrl(endpoint);
  const target = isAbsoluteUrl(normalizedPath)
    ? new URL(normalizedPath)
    : new URL(normalizedPath, `${baseURL}/`);

  appendSearchParams(target, params);

  if (!skipDefaultParams && shouldAttachDefaultQueryParams(normalizedPath)) {
    const language = getSelectedLanguage();
    const currency = getSelectedCurrency();
    if (language && !target.searchParams.has('language')) {
      target.searchParams.set('language', language);
    }
    if (currency && !target.searchParams.has('currency')) {
      target.searchParams.set('currency', currency);
    }
  }

  return target.toString();
};

let csrfRefreshPromise: Promise<void> | null = null;
const unauthorizedHandlers = new Set<UnauthorizedHandler>();

const dispatchUnauthorized = (error: FetchError, skipAuthHandling?: boolean) => {
  if (!isBrowser || skipAuthHandling) return;
  unauthorizedHandlers.forEach((handler) => handler(error));
  window.dispatchEvent(
    new CustomEvent('api:unauthorized', {
      detail: { status: error.status, message: error.message, url: error.url },
    })
  );
};

const refreshCsrfCookie = async (baseURL: string) => {
  if (!isBrowser) return;

  if (!csrfRefreshPromise) {
    csrfRefreshPromise = fetch(`${baseURL}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      cache: 'no-store',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to refresh CSRF cookie (${response.status})`);
        }
        return undefined;
      })
      .finally(() => {
        csrfRefreshPromise = null;
      });
  }

  await csrfRefreshPromise;
};

export const onApiUnauthorized = (handler: UnauthorizedHandler) => {
  unauthorizedHandlers.add(handler);
  return () => {
    unauthorizedHandlers.delete(handler);
  };
};

const requestWithRetry = async (
  url: string,
  options: RequestInit,
  retryOn419: boolean,
  endpoint: string,
  baseURL: string
): Promise<Response> => {
  const response = await fetch(url, options);
  if (
    retryOn419 &&
    response.status === 419 &&
    isBrowser &&
    !endpoint.includes('/sanctum/csrf-cookie')
  ) {
    await refreshCsrfCookie(baseURL);
    const retryHeaders = new Headers(options.headers);
    const xsrfToken = getCookieValue('XSRF-TOKEN');
    if (xsrfToken) {
      retryHeaders.set('X-XSRF-TOKEN', decodeURIComponent(xsrfToken));
    }
    return fetch(url, { ...options, headers: retryHeaders });
  }
  return response;
};

export const createApiFetch = (config: ApiFetchConfig = {}) => {
  const defaultBaseURL = config.baseURL ?? API_ROOT_URL;
  const defaultHeaders = new Headers({
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  });

  if (config.headers) {
    const fromConfig = new Headers(config.headers);
    fromConfig.forEach((value, key) => defaultHeaders.set(key, value));
  }

  return async function apiFetch<T = unknown>(
    endpoint: string,
    options: ApiFetchOptions = {}
  ): Promise<T> {
    const {
      params,
      body,
      headers: customHeaders,
      baseURL,
      parseAs = 'auto',
      skipAuthHandling,
      skipCsrfRetry,
      skipDefaultParams,
      skipDefaultHeaders,
      ...requestInit
    } = options;

    const resolvedBaseURL = (baseURL ?? defaultBaseURL)
      .replace(/\/+$/, '')
      .replace(/\/api$/, '');
    const url = buildUrl(
      endpoint,
      normalizeParams(params),
      resolvedBaseURL,
      skipDefaultParams
    );

    const headers = skipDefaultHeaders ? new Headers() : new Headers(defaultHeaders);
    if (customHeaders) {
      const incoming = new Headers(customHeaders);
      incoming.forEach((value, key) => headers.set(key, value));
    }

    const parsedBody = parseBodyIfNeeded(body, headers);

    if (isBrowser) {
      const xsrfToken = getCookieValue('XSRF-TOKEN');
      if (xsrfToken && !headers.has('X-XSRF-TOKEN')) {
        headers.set('X-XSRF-TOKEN', decodeURIComponent(xsrfToken));
      }
    }

    if (parsedBody instanceof FormData) {
      headers.delete('Content-Type');
    } else if (parsedBody !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await requestWithRetry(
      url,
      {
        ...requestInit,
        credentials: requestInit.credentials ?? 'include',
        headers,
        body: parsedBody,
      },
      !skipCsrfRetry,
      endpoint,
      resolvedBaseURL
    );

    const data = await parseResponsePayload(response, parseAs);
    if (response.ok) {
      return data as T;
    }

    const error = new FetchError(
      toErrorMessage(data, response),
      response.status,
      response,
      data,
      url
    );
    if (response.status === 401) {
      dispatchUnauthorized(error, skipAuthHandling);
    }
    throw error;
  };
};

export const apiFetch = createApiFetch();
export const fetchClient = apiFetch;

export const http = {
  get: <T = unknown>(endpoint: string, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, body?: RequestBody, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = unknown>(endpoint: string, body?: RequestBody, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = unknown>(endpoint: string, body?: RequestBody, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = unknown>(endpoint: string, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default apiFetch;
