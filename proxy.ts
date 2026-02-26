// proxy.ts
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { auth } from '@/auth';
import {
  checkRequirement,
  type AccessUser,
  type AccessRole,
  type Requirement,
} from '@/lib/access';
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
  if (credentials.length === 0) return true;

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
  if (user.is_superuser) return true;
  return Array.isArray(user.roles)
    ? user.roles.some((role) =>
      typeof role === 'string'
        ? role.toLowerCase() === 'admin'
        : role.slug?.toLowerCase() === 'admin'
    )
    : false;
}

// ---- Proxy Main ----

export const proxy = auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isServiceWorkerScript = /^\/OneSignalSDK(?:Updater)?Worker\.js$/i.test(pathname);

  if (isServiceWorkerScript) {
    return NextResponse.next();
  }

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

  // req.auth is the session object
  const session = (req as any).auth;
  const user = session?.user as AccessUser | null | undefined; // Cast to our AccessUser
  // Treat only validated session data as authenticated to avoid stale-cookie false positives.
  const isAuthenticated = Boolean(user);
  const preferredLocale = resolvePreferredLocale(user?.language, country);
  const locale = pathLocale ?? preferredLocale ?? defaultLocale;

  if (!pathLocale || pathLocale !== preferredLocale) {
    const url = req.nextUrl.clone();
    url.pathname = `/${preferredLocale}${normalizedPath === '/' ? '' : normalizedPath}`;
    return NextResponse.redirect(url);
  }

  const intlResponse = intlMiddleware(req);

  if (
    intlResponse?.headers.get('location') ||
    intlResponse?.headers.get('x-middleware-rewrite')
  ) {
    return intlResponse;
  }

  const baseResponse = intlResponse ?? NextResponse.next();
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
      return baseResponse;
    }

    let adminBypass = false;
    if (isAuthenticated) {
      adminBypass = isAdminUser(user || null);
    }

    if (!adminBypass) {
      const url = new URL(`/${locale}/open-soon`, req.url);
      if (normalizedPath === '/') {
        return NextResponse.rewrite(url);
      }
      return NextResponse.redirect(url);
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
      return baseResponse;
    }

    let adminBypass = false;
    if (isAuthenticated) {
      adminBypass = isAdminUser(user || null);
    }

    if (!adminBypass) {
      const url = new URL(`/${locale}/early-access`, req.url);
      if (normalizedPath === '/') {
        return NextResponse.rewrite(url);
      }
      return NextResponse.redirect(url);
    }
  }

  // 2. Auth Flow
  // Redirect authenticated users away from auth pages
  // IMPORTANT: Only redirect if we have a valid user session, not just a cookie
  // A cookie might exist but be invalid/expired
  if (AUTH_PAGES.has(normalizedPath) && user) {
    const url = new URL(`/${locale}/dashboard`, req.url);
    return NextResponse.redirect(url);
  }

  // Explicitly protect authenticated-only sections and preserve callbackUrl.
  if (!isAuthenticated && isAuthRequiredPath(normalizedPath)) {
    return redirectToSignin(req, locale);
  }

  // 3. Protected Routes
  const requirement = findRequirement(normalizedPath);

  if (!requirement) {
    return baseResponse;
  }

  // 4. Token & Permission Checks
  if (!isAuthenticated) return redirectToSignin(req, locale);

  if (requirement === 'auth-only') return baseResponse;

  const allowed = checkRequirement(user || null, requirement);

  if (!allowed) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/access-denied`;
    url.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return baseResponse;
});

export default proxy;

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|non-critical\\.css|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|avif)|_error).*)',
  ],
};
