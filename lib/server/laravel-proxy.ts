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

const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

export class ProxySecurityError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = 'ProxySecurityError';
    this.status = status;
  }
}

const isStateChangingMethod = (method?: string | null) =>
  !CSRF_SAFE_METHODS.has((method ?? 'GET').toUpperCase());

export type ProxyHeaderOptions = {
  explicitXsrfToken?: string | null;
  skipCsrfCheck?: boolean;
};

const getAllowedOrigins = (req: Request) => {
  const allowed = new Set<string>();

  [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.AUTH_URL,
  ]
    .filter(Boolean)
    .forEach((value) => {
      try {
        allowed.add(new URL(String(value)).origin);
      } catch {}
    });

  try {
    allowed.add(new URL(req.url).origin);
  } catch {}

  return allowed;
};

export const isTrustedOrigin = (req: Request) => {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  return getAllowedOrigins(req).has(origin);
};

export const assertTrustedMutationRequest = (
  req: Request,
  explicitXsrfToken?: string | null,
  options?: Pick<ProxyHeaderOptions, 'skipCsrfCheck'>
) => {
  if (!isStateChangingMethod(req.method)) {
    return;
  }

  if (!isTrustedOrigin(req)) {
    throw new ProxySecurityError('Untrusted origin');
  }

  if (options?.skipCsrfCheck) {
    return;
  }

  const incomingXsrfHeader = req.headers.get('x-xsrf-token');
  const suppliedXsrfToken = explicitXsrfToken?.trim() || incomingXsrfHeader?.trim();

  if (!suppliedXsrfToken) {
    throw new ProxySecurityError('Missing CSRF token');
  }
};

export const buildProxyHeaders = (
  req: Request,
  extra?: HeadersInit,
  options?: ProxyHeaderOptions
) => {
  assertTrustedMutationRequest(req, options?.explicitXsrfToken, options);

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
  }

  const incomingXsrfHeader =
    options?.explicitXsrfToken?.trim() || req.headers.get('x-xsrf-token')?.trim();
  if (incomingXsrfHeader) {
    headers.set('X-XSRF-TOKEN', incomingXsrfHeader);
  }

  const origin = resolveAppOrigin(req);
  if (origin) {
    headers.set('Origin', origin);
    headers.set('Referer', origin);
  }

  const forwardedHeaders = [
    'user-agent',
    'accept-language',
  ];
  forwardedHeaders.forEach((name) => {
    const value = req.headers.get(name);
    if (value && !headers.has(name)) {
      headers.set(name, value);
    }
  });

  return headers;
};

export const mergeProxySearchParams = (req: Request, targetUrl: URL) => {
  const source = new URL(req.url).searchParams;
  for (const [key, value] of source.entries()) {
    targetUrl.searchParams.set(key, value);
  }
  return targetUrl;
};

const isLocalDevelopmentRequest = (req?: Request | null) => {
  if (!req) return process.env.NODE_ENV !== 'production';
  try {
    const url = new URL(req.url);
    return (
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    );
  } catch {
    return process.env.NODE_ENV !== 'production';
  }
};

const normalizeSetCookieForProxy = (cookie: string, req?: Request | null) => {
  let normalized = cookie.replace(/;\s*Domain=[^;]*/gi, '');

  // Browsers reject `Secure` and `SameSite=None` cookies on non-HTTPS localhost.
  if (isLocalDevelopmentRequest(req)) {
    normalized = normalized.replace(/;\s*Secure/gi, '');
    normalized = normalized.replace(/;\s*SameSite=None/gi, '; SameSite=Lax');
  }

  return normalized.trim();
};

export const appendSetCookie = (from: Response, to: NextResponse, req?: Request | null) => {
  const getSetCookie = (from.headers as any).getSetCookie?.bind(from.headers);
  const setCookies: string[] = Array.isArray(getSetCookie?.()) ? getSetCookie() : [];

  if (setCookies.length === 0) {
    const single = from.headers.get('set-cookie');
    if (single) {
      const parsed = single.split(/,(?=[^;,]+=[^;,]+)/g);
      parsed.forEach((cookie) => {
        const value = cookie.trim();
        if (value) {
          to.headers.append('Set-Cookie', normalizeSetCookieForProxy(value, req));
        }
      });
    }
    return;
  }

  setCookies.forEach((cookie) => {
    to.headers.append('Set-Cookie', normalizeSetCookieForProxy(cookie, req));
  });
};

export const buildProxyTextResponse = async (response: Response, req?: Request | null) => {
  const contentType = response.headers.get('content-type');
  const nextResponse = new NextResponse(await response.text(), {
    status: response.status,
    headers: {
      'Content-Type': contentType && contentType.length > 0 ? contentType : 'application/json',
    },
  });
  appendSetCookie(response, nextResponse, req);
  return nextResponse;
};
