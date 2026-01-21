// middleware.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  checkRequirement,
  type AccessUser,
  type Requirement,
} from '@/lib/access';
import { locales, defaultLocale } from '@/lib/i18n';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
});

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

function getLocaleFromRequest(req: any) {
  const segment = req.nextUrl.pathname.split('/')[1];
  return locales.includes(segment as (typeof locales)[number]) ? segment : defaultLocale;
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
  const intlResponse = intlMiddleware(req);
  if (intlResponse.headers.get('location')) {
    return intlResponse;
  }

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

  const segments = pathname.split('/');
  const locale = getLocaleFromRequest(req);
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
      return intlResponse;
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
      return intlResponse;
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
  if (AUTH_PAGES.has(normalizedPath) && isAuthenticated) {
    console.log('[Middleware] Redirecting authenticated user to dashboard');
    const url = new URL(`/${locale}/dashboard`, req.url);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url);
  }

  // 3. Protected Routes
  const requirement = findRequirement(normalizedPath);
  console.log(`[Middleware] Requirement for ${normalizedPath}:`, requirement);

  if (!requirement) {
    console.log('[Middleware] No requirement, allowing.');
    return intlResponse;
  }

  // 4. Token & Permission Checks
  if (!isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/auth/signin`;
    url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (requirement === 'auth-only') return intlResponse;

  const allowed = checkRequirement(user || null, requirement);
  console.log(`[Middleware] Check Requirement Result: ${allowed}`);

  if (!allowed) {
    console.log('[Middleware] Access Denied. Redirecting.');
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/access-denied`;
    url.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return intlResponse;
});

export const config = {
  matcher: [
    '/((?!api|_next|icons|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)',
  ],
};
