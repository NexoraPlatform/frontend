// middleware.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  checkRequirement,
  type AccessUser,
  type AccessRole,
  type Requirement,
} from '@/lib/access';
import { locales, defaultLocale } from '@/lib/i18n';

const LOCALE_COOKIE_NAME = 'preferred_locale';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

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
];

const AUTH_PAGES = new Set(['/auth/signin', '/auth/signup']);

function findRequirement(pathname: string): Requirement | 'auth-only' | null {
  for (const r of ROUTE_RULES) {
    if (r.pattern.test(pathname)) return r.require;
  }
  return null;
}

// ---- Helper Functions ----

function redirectToSignin(req: any) {
  const url = req.nextUrl.clone();
  url.pathname = '/auth/signin';
  url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

function getLocale(request: any): string {
  const pathname = request.nextUrl.pathname;

  // Check if pathname already has locale
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (hasLocale) {
    return locales.find((locale) => pathname.startsWith(`/${locale}`)) || defaultLocale;
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (cookieLocale && locales.includes(cookieLocale as (typeof locales)[number])) {
    return cookieLocale;
  }

  const country =
    request.geo?.country ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('x-country');
  if (country) {
    return country.toUpperCase() === 'RO' ? 'ro' : 'en';
  }

  // Get from headers
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) {
    const preferredLanguages = acceptLanguage
      .split(',')
      .map((lang: string) => lang.split(';')[0].trim().toLowerCase());

    for (const lang of preferredLanguages) {
      // @ts-ignore
      const found = locales.find(l => lang.startsWith(l));
      if (found) return found;
    }
  }

  return defaultLocale;
}

function applyLocaleCookie(response: NextResponse, locale: string) {
  if (locales.includes(locale as (typeof locales)[number])) {
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
    });
  }
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

function getBasicAuthCredentials() {
  const users = (process.env.BASIC_AUTH_USERS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const passwords = (process.env.BASIC_AUTH_PASSWORDS || '')
    .split(',')
    .map((value) => value.trim());

  return users
    .map((user, index) => {
      const password = passwords[index];
      if (!password) return null;
      return { user, password };
    })
    .filter(Boolean) as Array<{ user: string; password: string }>;
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
    ? user.roles.some((role) => role.slug?.toLowerCase() === 'admin')
    : false;
}

// ---- Middleware Main ----

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  // Ignore static files and API
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
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

  // 1. Locale Handling
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    const locale = getLocale(req);
    const url = new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, req.url);
    url.search = req.nextUrl.search;
    return applyLocaleCookie(NextResponse.redirect(url), locale);
  }

  const segments = pathname.split('/');
  const locale = segments[1];
  const pathWithoutLocale = '/' + segments.slice(2).join('/') || '/';
  const normalizedPath =
    pathWithoutLocale !== '/' ? pathWithoutLocale.replace(/\/+$/, '') : pathWithoutLocale;

  console.log(`[Middleware] Path: ${pathname}, Normalized: ${normalizedPath}`);

  // req.auth is the session object
  const session = req.auth;
  const user = session?.user as AccessUser | null | undefined; // Cast to our AccessUser
  const isAuthenticated = !!user;

  console.log(`[Middleware] Authenticated: ${isAuthenticated}, Roles: ${user?.roles?.map(r => r.slug).join(', ')}`);

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
      return applyLocaleCookie(NextResponse.next(), locale);
    }

    let adminBypass = false;
    if (isAuthenticated) {
      adminBypass = isAdminUser(user || null);
    }

    if (!adminBypass) {
      const url = new URL(`/${locale}/open-soon`, req.url);
      if (normalizedPath === '/') {
        return applyLocaleCookie(NextResponse.rewrite(url), locale);
      }
      return applyLocaleCookie(NextResponse.redirect(url), locale);
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
      return applyLocaleCookie(NextResponse.next(), locale);
    }

    let adminBypass = false;
    if (isAuthenticated) {
      adminBypass = isAdminUser(user || null);
    }

    if (!adminBypass) {
      const url = new URL(`/${locale}/early-access`, req.url);
      if (normalizedPath === '/') {
        return applyLocaleCookie(NextResponse.rewrite(url), locale);
      }
      return applyLocaleCookie(NextResponse.redirect(url), locale);
    }
  }

  // 2. Auth Flow
  // Redirect authenticated users away from auth pages
  if (AUTH_PAGES.has(normalizedPath) && isAuthenticated) {
    console.log('[Middleware] Redirecting authenticated user to dashboard');
    const url = new URL('/dashboard', req.url);
    url.search = req.nextUrl.search;
    return applyLocaleCookie(NextResponse.redirect(url), locale);
  }

  // 3. Protected Routes
  const requirement = findRequirement(normalizedPath);
  console.log(`[Middleware] Requirement for ${normalizedPath}:`, requirement);

  if (!requirement) {
    console.log('[Middleware] No requirement, allowing.');
    return applyLocaleCookie(NextResponse.next(), locale);
  }

  // 4. Token & Permission Checks
  if (!isAuthenticated) return applyLocaleCookie(redirectToSignin(req), locale);

  if (requirement === 'auth-only') return applyLocaleCookie(NextResponse.next(), locale);

  const allowed = checkRequirement(user || null, requirement);
  console.log(`[Middleware] Check Requirement Result: ${allowed}`);

  if (!allowed) {
    console.log('[Middleware] Access Denied. Redirecting.');
    const url = req.nextUrl.clone();
    url.pathname = '/access-denied';
    url.searchParams.set('from', req.nextUrl.pathname);
    return applyLocaleCookie(NextResponse.redirect(url), locale);
  }

  return applyLocaleCookie(NextResponse.next(), locale);
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)',
  ],
};

