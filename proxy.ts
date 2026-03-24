// proxy.ts
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { auth } from '@/auth';
import {
  checkRequirement,
  getRoleSlugs,
  isSuperUser,
  type AccessUser,
  type Requirement,
} from '@/lib/access';
import {
  BROWSER_SESSION_COOKIE_NAME,
  NEXT_AUTH_SESSION_COOKIE_NAMES,
  REMEMBER_ME_COOKIE_NAME,
  isBrowserSessionExpired,
} from '@/lib/auth/session-preferences';
import { enforceApiRateLimit } from '@/lib/server/rate-limit';
import { normalizeAuthUser } from '@/lib/auth/user';
import { buildAllowedInlineScriptHashes } from '@/lib/csp';
import { defaultLocale } from '@/lib/i18n';
import { locales, localePrefix } from '@/lib/navigation';

type RouteRule = { pattern: RegExp; require: Requirement | 'auth-only' };

// Define protections
const ROUTE_RULES: RouteRule[] = [
  // /admin -> role "admin" OR superuser
  { pattern: /\/admin(\/|$)/i, require: { roles: ['admin'] } },

  // authenticated-only sections
  { pattern: /\/dashboard(\/|$)/i, require: 'auth-only' },
  { pattern: /\/profile(\/|$)/i, require: 'auth-only' },
  { pattern: /\/settings(\/|$)/i, require: 'auth-only' },
  { pattern: /^\/provider\/profile\/?$/i, require: { roles: ['provider'] } },
  { pattern: /\/provider\/services(\/|$)/i, require: { roles: ['provider'] } },
  { pattern: /^\/provider\/(?!profile(?:\/|$))[^\/]+\/?$/i, require: 'auth-only' },
  { pattern: /\/tests(\/|$)/i, require: { roles: ['provider'] } },
  // { pattern: /\/client(\/|$)/i, require: { roles: ['client'] } },
  { pattern: /^\/projects\/new\/?$/i, require: { roles: ['client'] } },
  { pattern: /\/projects\/(?!profile(?:\/|$))[^\/]+\/?$/i, require: 'auth-only' },
  { pattern: /^\/integrations\/?$/i, require: 'auth-only' },
];

const AUTH_PAGES = new Set(['/auth/signin', '/auth/signup']);
const AUTH_REQUIRED_PREFIXES = ['/dashboard', '/client', '/provider', '/tests', '/integrations'];

const mergeHeaderValues = (currentValue: string | null, nextValue: string) => {
  if (!currentValue) return nextValue;
  const merged = new Set(
    `${currentValue},${nextValue}`
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );
  return Array.from(merged).join(', ');
};

const createCspNonce = () => btoa(crypto.randomUUID());

let inlineScriptHashPromise: Promise<string[]> | null = null;

const getAllowedInlineScriptHashes = () => {
  if (!inlineScriptHashPromise) {
    inlineScriptHashPromise = buildAllowedInlineScriptHashes();
  }

  return inlineScriptHashPromise;
};

// proxy.ts

const buildPageCsp = async (nonce: string) => {
  const isDev = process.env.NODE_ENV === 'development';
  const vercelPreviewFeedbackEnabled = ['1', 'true'].includes(
    (process.env.VERCEL_PREVIEW_FEEDBACK_ENABLED ?? '').toLowerCase()
  );
  // Keep the Vercel toolbar opt-in on preview deployments so CSP only trusts
  // vercel.live when comments/toolbar are intentionally enabled.
  const allowVercelLive = isDev || vercelPreviewFeedbackEnabled;
  const allowedInlineScriptHashes = await getAllowedInlineScriptHashes();

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    ...allowedInlineScriptHashes,
    "'strict-dynamic'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https:",
    ...(allowVercelLive ? ['https://vercel.live'] : []),
  ];

  const styleSrc = [
    "'self'",
    "'unsafe-inline'", // Recomandat pentru stiluri (GTM modifică des stiluri inline)
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    `script-src-elem ${scriptSrc.join(' ')}`,
    "script-src-attr 'unsafe-inline'",
    `style-src ${styleSrc.join(' ')}`,
    `style-src-elem ${styleSrc.join(' ')}`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https:",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
};

const createPageSecurityContext = async (req: Request) => {
  const nonce = createCspNonce();
  const requestHeaders = new Headers(req.headers);
  const csp = await buildPageCsp(nonce);

  requestHeaders.set('x-nonce', nonce);
  // Next parses the nonce from the request CSP header when rendering server components.
  requestHeaders.set('content-security-policy', csp);

  return { csp, requestHeaders };
};


const applyPageCspHeader = (response: NextResponse, csp: string, requestHeaders: Headers) => {
  response.headers.set('Content-Security-Policy', csp);
  const nonce = requestHeaders.get('x-nonce');
  if (nonce) response.headers.set('x-nonce', nonce);

  return response;
};

const copyMiddlewareHeaders = (
  target: NextResponse,
  source?: NextResponse | Response | null
) => {
  if (!source) return target;

  source.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();

    if (normalizedKey === 'set-cookie') {
      target.headers.append(key, value);
      return;
    }

    if (normalizedKey === 'vary') {
      target.headers.set(key, mergeHeaderValues(target.headers.get(key), value));
      return;
    }

    if (
      (normalizedKey === 'x-middleware-override-headers' ||
        normalizedKey.startsWith('x-middleware-request-')) &&
      target.headers.has(key)
    ) {
      return;
    }

    target.headers.set(key, value);
  });

  return target;
};

const createPageContinuationResponse = (
  intlResponse: NextResponse | Response | null,
  requestHeaders: Headers,
  csp: string
) => {
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  copyMiddlewareHeaders(response, intlResponse);
  return applyPageCspHeader(response, csp, requestHeaders);
};

const createPageRewriteResponse = (url: URL, requestHeaders: Headers, csp: string, ) => {
  const response = NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  });

  return applyPageCspHeader(response, csp, requestHeaders);
};

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
});

const supportedLocales = new Set(locales);

function normalizeLocale(value?: string | null) {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return supportedLocales.has(normalized as (typeof locales)[number]) ? normalized : null;
}

function resolvePreferredLocale(userLanguage: string | null | undefined, country: string) {
  const normalizedUserLanguage = normalizeLocale(userLanguage);
  if (normalizedUserLanguage) return normalizedUserLanguage;
  return country.toUpperCase() === 'RO' ? 'ro' : 'en';
}

function findRequirement(pathname: string): Requirement | 'auth-only' | null {
  for (const r of ROUTE_RULES) {
    if (r.pattern.test(pathname)) return r.require;
  }
  return null;
}

function isAuthRequiredPath(pathname: string) {
  return AUTH_REQUIRED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

// ---- Helper Functions ----

/**
 * Sanitize callback URL to prevent Open Redirect attacks
 * Only allows relative URLs (same origin)
 */
function sanitizeCallbackUrl(callback: string, fallback: string = '/dashboard'): string {
  if (!callback || callback.trim() === '') return fallback;

  try {
    // Try to parse as URL
    const parsed = new URL(callback, 'http://localhost');

    // Only allow relative URLs (http://localhost means it was relative)
    if (parsed.protocol === 'http:' && parsed.hostname === 'localhost') {
      return callback.startsWith('/') ? callback : `/${callback}`;
    }

    // Absolute URL detected - reject
    return fallback;
  } catch {
    // Invalid URL - only allow if it starts with /
    if (callback.startsWith('/')) {
      return callback;
    }
    return fallback;
  }
}

function redirectToSignin(req: any, locale: string) {
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}/auth/signin`;
  // SECURITY: Sanitize callbackUrl to prevent Open Redirect
  const rawCallback = req.nextUrl.pathname + req.nextUrl.search;
  const safeCallback = sanitizeCallbackUrl(rawCallback);
  url.searchParams.set('callbackUrl', safeCallback);
  return NextResponse.redirect(url);
}

function clearRememberedAuthCookies(response: NextResponse) {
  for (const cookieName of NEXT_AUTH_SESSION_COOKIE_NAMES) {
    response.cookies.set(cookieName, '', { maxAge: 0, path: '/' });
  }
  response.cookies.set(REMEMBER_ME_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  response.cookies.set(BROWSER_SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return response;
}

function isEarlyAccessEnabled() {
  return (
    process.env.NEXT_PUBLIC_EARLY_ACCESS_FUNNEL === 'true' ||
    process.env.EARLY_ACCESS_FUNNEL === 'true'
  );
}

function isOpenSoonEnabled() {
  return (
    process.env.NEXT_PUBLIC_OPEN_SOON === 'true' ||
    process.env.OPEN_SOON === 'true' ||
    process.env.NEXT_PUBLIC_OPEN_SOON_ENABLED === 'true' ||
    process.env.OPEN_SOON_ENABLED === 'true'
  );
}

function isBasicAuthEnabled() {
  return process.env.BASIC_AUTH_ENABLED === 'true' || process.env.BASIC_AUTH === 'true';
}

// Cache credentials in closure to avoid repeated parsing
let cachedBasicAuthCredentials: Array<{ user: string; password: string }> | null = null;

function getBasicAuthCredentials() {
  if (cachedBasicAuthCredentials !== null) {
    return cachedBasicAuthCredentials;
  }

  const users = (process.env.BASIC_AUTH_USERS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const passwords = (process.env.BASIC_AUTH_PASSWORDS || '')
    .split(',')
    .map((value) => value.trim());

  cachedBasicAuthCredentials = users
    .map((user, index) => {
      const password = passwords[index];
      if (!password) return null;
      return { user, password };
    })
    .filter(Boolean) as Array<{ user: string; password: string }>;

  return cachedBasicAuthCredentials;
}

function isBasicAuthAuthorized(request: any) {
  const credentials = getBasicAuthCredentials();
  // Fail closed if auth is enabled but credentials are missing/misconfigured.
  if (credentials.length === 0) return false;

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;

  try {
    const base64Credentials = authHeader.split(' ')[1] ?? '';
    const decoded = atob(base64Credentials);
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) return false;
    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    return credentials.some(
      (credential) => credential.user === username && credential.password === password
    );
  } catch {
    return false;
  }
}

function isAdminUser(user: AccessUser | null) {
  if (!user) return false;
  if (isSuperUser(user)) return true;
  return getRoleSlugs(user).includes('admin');
}

// ---- Proxy Main ----

export const proxy = auth(async (req) => {
  const { pathname } = req.nextUrl;

  if (isBasicAuthEnabled() && !isBasicAuthAuthorized(req)) {
    return new NextResponse('Authentication required.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Trustora"',
      },
    });
  }

  // Ignore static files and API
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.includes('manifest.json') ||
    pathname.startsWith('/favicon')
  ) {
    if (pathname.startsWith('/api')) {
      const rateLimitResponse = await enforceApiRateLimit(req);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }
    return NextResponse.next();
  }

  // SECURITY: Use platform-specific headers for geo-location (harder to spoof)
  // x-vercel-ip-country (Vercel) and cf-ipcountry (Cloudflare) are set by the CDN
  const country = req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    'XX';

  // For IP, prefer x-real-ip over x-forwarded-for
  // If using x-forwarded-for, take only the first IP (client IP)
  const realIp = req.headers.get('x-real-ip');
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null);

  // Block specific countries (example: Russia)
  if (country === 'RU') {
    return new NextResponse('Access Denied', { status: 403 });
  }

  const segments = pathname.split('/');
  const pathLocale = normalizeLocale(segments[1]);
  const pathWithoutLocale = pathLocale ? '/' + segments.slice(2).join('/') : pathname;
  const normalizedPath =
    pathWithoutLocale !== '/' ? pathWithoutLocale.replace(/\/+$/, '') : pathWithoutLocale;

  const session = (req as any).auth;
  const sessionUser = session?.user as AccessUser | null | undefined;
  const rememberMe = session?.rememberMe === true;
  const browserSessionExpired =
    Boolean(sessionUser) && isBrowserSessionExpired(rememberMe, req.cookies);
  const user =
    !browserSessionExpired && sessionUser
      ? ((normalizeAuthUser(sessionUser) as AccessUser | null) ?? sessionUser)
      : null;
  const finalizeResponse = <T extends NextResponse>(response: T) =>
    browserSessionExpired ? (clearRememberedAuthCookies(response) as T) : response;

  const isAuthenticated = Boolean(user);
  const preferredLocale = resolvePreferredLocale(user?.language, country);
  const locale = pathLocale ?? preferredLocale ?? defaultLocale;

  if (!pathLocale) {
    const url = req.nextUrl.clone();
    url.pathname = `/${preferredLocale}${normalizedPath === '/' ? '' : normalizedPath}`;
    return finalizeResponse(NextResponse.redirect(url));
  }

  const pageSecurity = await createPageSecurityContext(req);
  const intlResponse = intlMiddleware(req);

  if (
    intlResponse?.headers.get('location') ||
    intlResponse?.headers.get('x-middleware-rewrite')
  ) {
    return finalizeResponse(intlResponse as NextResponse);
  }

  const baseResponse = createPageContinuationResponse(
    intlResponse,
    pageSecurity.requestHeaders,
    pageSecurity.csp
  );
  baseResponse.headers.set('X-Client-Geo-Country', country);
  if (ip) {
    baseResponse.headers.set('X-Client-Geo-IP', ip as string);
  }

  if (isOpenSoonEnabled()) {
    const openSoonRoutes = new Set([
      '/open-soon',
      '/auth/signin',
      '/auth/signup',
      '/privacy',
      '/terms',
      '/cookies',
    ]);

    const isOpenSoonRoute =
      normalizedPath === '/' ? false : openSoonRoutes.has(normalizedPath);

    if (isOpenSoonRoute) {
      return finalizeResponse(baseResponse);
    }

    let adminBypass = false;
    if (isAuthenticated) {
      adminBypass = isAdminUser(user || null);
    }

    if (!adminBypass) {
      const url = new URL(`/${locale}/open-soon`, req.url);
      if (normalizedPath === '/') {
        return finalizeResponse(
          createPageRewriteResponse(url, pageSecurity.requestHeaders, pageSecurity.csp)
        );
      }
      return finalizeResponse(NextResponse.redirect(url));
    }
  }

  if (isEarlyAccessEnabled()) {
    const earlyAccessRoutes = new Set([
      '/early-access',
      '/early-access/client',
      '/early-access/provider',
      '/privacy',
      '/terms',
      '/cookies',
    ]);

    const isEarlyAccessRoute =
      normalizedPath === '/' ? false : earlyAccessRoutes.has(normalizedPath);

    if (isEarlyAccessRoute) {
      return finalizeResponse(baseResponse);
    }

    let adminBypass = false;
    if (isAuthenticated) {
      adminBypass = isAdminUser(user || null);
    }

    if (!adminBypass) {
      const url = new URL(`/${locale}/early-access`, req.url);
      if (normalizedPath === '/') {
        return finalizeResponse(
          createPageRewriteResponse(url, pageSecurity.requestHeaders, pageSecurity.csp)
        );
      }
      return finalizeResponse(NextResponse.redirect(url));
    }
  }

  // 2. Auth Flow
  // Redirect authenticated users away from auth pages
  // IMPORTANT: Only redirect if we have a valid user session, not just a cookie
  // A cookie might exist but be invalid/expired
  if (AUTH_PAGES.has(normalizedPath) && user) {
    const url = new URL(`/${locale}/dashboard`, req.url);
    return finalizeResponse(NextResponse.redirect(url));
  }

  // Explicitly protect authenticated-only sections and preserve callbackUrl.
  if (!isAuthenticated && isAuthRequiredPath(normalizedPath)) {
    return finalizeResponse(redirectToSignin(req, locale));
  }

  // 3. Protected Routes
  const requirement = findRequirement(normalizedPath);

  if (!requirement) {
    return finalizeResponse(baseResponse);
  }

  // 4. Token & Permission Checks
  if (!isAuthenticated) return finalizeResponse(redirectToSignin(req, locale));

  if (requirement === 'auth-only') return finalizeResponse(baseResponse);

  const allowed = checkRequirement(user || null, requirement);

  if (!allowed) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/access-denied`;
    url.searchParams.set('from', req.nextUrl.pathname);
    return finalizeResponse(NextResponse.redirect(url));
  }

  return finalizeResponse(baseResponse);
});

export default proxy;
