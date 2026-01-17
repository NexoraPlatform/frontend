// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import {
  checkRequirement,
  type AccessUser,
  type AccessRole,
  type Requirement,
} from '@/lib/access';
import { locales, defaultLocale } from '@/lib/i18n';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://backend.trustora.ro/api';

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
  { pattern: /\/client(\/|$)/i, require: { roles: ['client'] } },
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

// ---- Helper Functions (Consider moving to lib/auth.ts if reused) ----

function normalizeRoles(input: any): AccessRole[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((r) => {
      if (typeof r === 'string') return { slug: r } as AccessRole;
      if (r && typeof r === 'object') {
        const slug = r.slug ?? r.name ?? r.code ?? '';
        return {
          id: r.id,
          slug,
          permissions: Array.isArray(r.permissions)
            ? r.permissions.map((p: any) => {
              if (typeof p === 'string') return { slug: p };
              if (p && typeof p === 'object') return { id: p.id, slug: p.slug ?? p.name ?? '' };
              return null;
            }).filter(Boolean)
            : [],
        } as AccessRole;
      }
      return null;
    }).filter(Boolean) as AccessRole[];
  }
  return [];
}

function buildUserFromPayload(payload: any): AccessUser {
  return {
    id: String(payload.id ?? payload.sub ?? payload.user?.id ?? ''),
    email: String(payload.email ?? payload.user?.email ?? ''),
    firstName: payload.firstName ?? payload.user?.firstName,
    lastName: payload.lastName ?? payload.user?.lastName,
    location: payload.location ?? payload.user?.location,
    language: payload.language ?? payload.user?.language,
    bio: payload.bio ?? payload.user?.bio,
    avatar: payload.avatar ?? payload.user?.avatar,
    testVerified: payload.testVerified ?? payload.user?.testVerified,
    callVerified: payload.callVerified ?? payload.user?.callVerified,
    stripe_account_id: payload.stripe_account_id ?? payload.user?.stripe_account_id,
    roles: normalizeRoles(payload.roles ?? payload.user?.roles ?? []),
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    is_superuser: payload.is_superuser ?? payload.superuser ?? payload.user?.isSuperUser ?? false,
  };
}

function buildUserFromProfile(profile: any): AccessUser | null {
  const data = profile?.user ?? profile;
  if (!data?.id && !data?.email) return null;

  return {
    id: String(data.id ?? ''),
    email: String(data.email ?? ''),
    firstName: data.firstName,
    lastName: data.lastName,
    location: data.location,
    language: data.language,
    bio: data.bio,
    avatar: data.avatar,
    testVerified: data.testVerified,
    callVerified: data.callVerified,
    stripe_account_id: data.stripe_account_id,
    roles: normalizeRoles(data.roles),
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    is_superuser: data.is_superuser ?? (Array.isArray(data.roles) && data.roles.some((r: any) => r.slug?.toLowerCase() === 'superuser')) ?? false,
  };
}

function tryDecodeUserFromJwt(token?: string): AccessUser | null {
  if (!token || !token.includes('.')) return null;
  try {
    const payload: any = decodeJwt(token);
    const user = buildUserFromPayload(payload);
    return (user.id || user.email) ? user : null;
  } catch {
    return null;
  }
}

async function fetchUserFromApi(token: string): Promise<AccessUser | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store', // Important for middleware to not cache bad auth states
    });
    if (!res.ok) return null;
    const data = await res.json();
    return buildUserFromProfile(data);
  } catch {
    return null;
  }
}

function redirectToSignin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/auth/signin';
  url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

function getLocale(request: NextRequest): string {
  const pathname = request.nextUrl.pathname;

  // Check if pathname already has locale
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (hasLocale) {
    return locales.find((locale) => pathname.startsWith(`/${locale}`)) || defaultLocale;
  }

  // Get from headers
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) {
    const preferredLanguages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase());

    for (const lang of preferredLanguages) {
      const found = locales.find(l => lang.startsWith(l));
      if (found) return found;
    }
  }

  return defaultLocale;
}

function isEarlyAccessEnabled() {
  return (
    process.env.NEXT_PUBLIC_EARLY_ACCESS_FUNNEL === 'true' ||
    process.env.EARLY_ACCESS_FUNNEL === 'true'
  );
}

// ---- Middleware Main ----

export default async function middleware(req: NextRequest) {
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

  // 1. Locale Handling
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    const locale = getLocale(req);
    const url = new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, req.url);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url);
  }

  const segments = pathname.split('/');
  const locale = segments[1];
  const pathWithoutLocale = '/' + segments.slice(2).join('/') || '/';
  const normalizedPath =
    pathWithoutLocale !== '/' ? pathWithoutLocale.replace(/\/+$/, '') : pathWithoutLocale;

  if (isEarlyAccessEnabled()) {
    const earlyAccessRoutes = new Set([
      '/early-access',
      '/early-access/client',
      '/early-access/provider',
    ]);

    if (normalizedPath === '/') {
      const url = new URL(`/${locale}/early-access`, req.url);
      return NextResponse.rewrite(url);
    }

    if (!earlyAccessRoutes.has(normalizedPath)) {
      const url = new URL(`/${locale}/early-access`, req.url);
      return NextResponse.redirect(url);
    }
  }

  // 2. Auth Flow
  const token =
    req.cookies.get('auth_token')?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    undefined;

  // Redirect authenticated users away from auth pages
  if (AUTH_PAGES.has(pathname) && token) {
    // Note: we might want to redirect to localized dashboard, but pathname encompasses locale now?
    // Actually pathname includes locale because of step 1 check (or we wouldn't be here if we redirected).
    // Wait, if we just redirected in step 1, this subsequent code doesn't run for THIS request.
    // So here pathname DOES have locale.
    // We need to strip locale to check if it matches /auth/signin strictly? 
    // AUTH_PAGES above are defined as '/auth/signin'.
    // But pathname is '/ro/auth/signin'.

    // segments[0] is empty, segments[1] is locale
    const pathWithoutLocale = '/' + segments.slice(2).join('/');
    const normalizedPath =
      pathWithoutLocale !== '/' ? pathWithoutLocale.replace(/\/+$/, '') : pathWithoutLocale;

    if (AUTH_PAGES.has(normalizedPath)) {
      const url = new URL('/dashboard', req.url);
      url.search = req.nextUrl.search;
      return NextResponse.redirect(url);
      // Ideally clean this to be localized dashboard: already handled by localized router or just let it redirect to default
    }
  }

  // 3. Protected Routes
  // We need to check requirement against the path WITHOUT locale?
  // implementation check: ROUTE_RULES use regex.
  // The regexes in original code: /\/admin(\/|$)/i matches /admin in any position?
  // No, original code: pathname was potentially missing locale or having it?
  // The original findRequirement used 'pathname' directly from req.nextUrl.

  // Imrovement: Strip locale for routing checks to ensure consistence
  const requirement = findRequirement(normalizedPath);

  // Also check if the raw pathname matched (old behavior fallback) if strict strip failed? 
  // Actually, standard practice is to define rules on non-localized paths.

  if (!requirement) return NextResponse.next();

  // 4. Token & Permission Checks
  if (!token) return redirectToSignin(req);

  if (requirement === 'auth-only') return NextResponse.next();

  let user = tryDecodeUserFromJwt(token);

  const needsPerms = requirement.permissions && requirement.permissions.length > 0;
  const needsRole = requirement.roles && requirement.roles.length > 0;
  const needsSuper = !!requirement.superuser;

  const hasEnoughClaims =
    !!user &&
    // Optimistic check: if we have roles, we assume permissions might be implicit, 
    // but strictly we should check if token has them.
    // Original code allowed permissive check if roles were present.
    (!needsRole || (user.roles && user.roles.length > 0)) &&
    (!needsSuper || user.is_superuser !== undefined);

  if (!hasEnoughClaims && token) {
    user = await fetchUserFromApi(token);
  }

  if (!user) return redirectToSignin(req);

  const allowed = checkRequirement(user, requirement);
  if (!allowed) {
    const url = req.nextUrl.clone();
    url.pathname = '/access-denied';
    // Append 'from' but keep existing params if needed, or maybe clean them?
    // usually we just want to know where they came from.
    // clone() keeps the search params.
    url.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)',
  ],
};
