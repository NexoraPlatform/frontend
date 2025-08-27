// middleware.ts (or src/middleware.ts)
import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose'; // npm i jose
import {
  checkRequirement,
  type AccessUser,
  type AccessRole,
  type Requirement,
} from '@/lib/access';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    'https://nexorabe.dacars.ro/api';

type RouteRule = { pattern: RegExp; require: Requirement | 'auth-only' };

// Define protections
const ROUTE_RULES: RouteRule[] = [
  // /admin -> role "admin" OR superuser (superuser bypass by default)
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

  // examples:
  // { pattern: /\/billing(\/|$)/i, require: { permissions: ['users.read'] } },
  // { pattern: /\/super(\/|$)/i, require: { superuser: true } },
];

const AUTH_PAGES = new Set<string>(['/auth/signin', '/auth/signup']);

function findRequirement(pathname: string): Requirement | 'auth-only' | null {
  for (const r of ROUTE_RULES) {
    if (r.pattern.test(pathname)) return r.require;
  }
  return null;
}

// ---- Normalizers ----

function normalizeRoles(input: any): AccessRole[] {
  if (!input) return [];
  // Accept roles as array of objects with slug, or array of string slugs
  if (Array.isArray(input)) {
    return input
        .map((r) => {
          if (typeof r === 'string') {
            return { slug: r } as AccessRole;
          }
          if (r && typeof r === 'object') {
            const slug = r.slug ?? r.name ?? r.code ?? '';
            const perms: any[] = Array.isArray(r.permissions) ? r.permissions : [];
            return {
              id: r.id,
              slug,
              permissions: perms
                  .map((p) => {
                    if (typeof p === 'string') return { slug: p };
                    if (p && typeof p === 'object') return { id: p.id, slug: p.slug ?? p.name ?? '' };
                    return null;
                  })
                  .filter(Boolean) as { id?: number | string; slug: string }[],
            } as AccessRole;
          }
          return null;
        })
        .filter(Boolean) as AccessRole[];
  }
  return [];
}

function buildUserFromPayload(payload: any): AccessUser {
  const roles = normalizeRoles(payload.roles ?? payload.user?.roles ?? []);
  const extraPerms: string[] =
      (payload.permissions ??
          payload.perms ??
          payload.user?.permissions ??
          []) as string[];

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

    roles,
    permissions: Array.isArray(extraPerms) ? extraPerms : [],
    is_superuser:
        payload.is_superuser ??
        payload.superuser ??
        payload.user?.isSuperUser ??
        false,
  };
}

function buildUserFromProfile(profile: any): AccessUser | null {
  const data = profile?.user ? profile.user : profile;

  const roles = normalizeRoles(data?.roles);
  const extraPerms: string[] = Array.isArray(data?.permissions) ? data.permissions : [];

  const user: AccessUser = {
    id: String(data?.id ?? ''),
    email: String(data?.email ?? ''),
    firstName: data?.firstName,
    lastName: data?.lastName,
    location: data?.location,
    language: data?.language,
    bio: data?.bio,
    avatar: data?.avatar,
    testVerified: data?.testVerified,
    callVerified: data?.callVerified,
    stripe_account_id: data?.stripe_account_id,

    roles,
    permissions: extraPerms,
    is_superuser:
        data?.is_superuser ??
        // treat role slug 'superuser' as superuser
        (Array.isArray(roles) && roles.some(r => r.slug?.toLowerCase() === 'superuser')) ??
        false,
  };

  if (!user.id && !user.email) return null;
  return user;
}

// ---- Token decode / fetch profile ----

function tryDecodeUserFromJwt(token?: string): AccessUser | null {
  if (!token || !token.includes('.')) return null;
  try {
    const payload: any = decodeJwt(token);
    const user = buildUserFromPayload(payload);
    if (!user.id && !user.email) return null;
    return user;
  } catch {
    return null;
  }
}

async function fetchUserFromApi(token: string): Promise<AccessUser | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
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

const locales = ['ro', 'en'];
const defaultLocale = 'ro';

function getLocale(request: NextRequest): string {
  // Check if locale is in pathname
  const pathname = request.nextUrl.pathname;
  const pathnameIsMissingLocale = locales.every(
      (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    // Try to get locale from Accept-Language header
    const acceptLanguage = request.headers.get('Accept-Language');
    let locale = defaultLocale;

    if (acceptLanguage) {
      const preferredLanguages = acceptLanguage
          .split(',')
          .map(lang => lang.split(';')[0].trim().toLowerCase());

      for (const lang of preferredLanguages) {
        if (lang.startsWith('ro')) {
          locale = 'ro';
          break;
        } else if (lang.startsWith('en')) {
          locale = 'en';
          break;
        }
      }
    }

    return locale;
  }

  return locales.find((locale) => pathname.startsWith(`/${locale}`)) || defaultLocale;
}

// ---- Middleware ----

export default async function middleware(req: NextRequest) {
  // keep a log while testing
  // console.log('[MW] path', req.nextUrl.pathname);

  const { pathname } = req.nextUrl;

  if (
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname.includes('.') ||
      pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const pathnameIsMissingLocale = locales.every(
      (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const locale = getLocale(req);
    return NextResponse.redirect(
        new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, req.url)
    );
  }

  const token =
      req.cookies.get('auth_token')?.value ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      undefined;

  // If authenticated, keep users away from signin/signup pages
  if ((pathname === '/auth/signin' || pathname === '/auth/signup') && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  const requirement = findRequirement(pathname);
  if (!requirement) return NextResponse.next();

  // Any protected route requires authentication
  if (!token) return redirectToSignin(req);

  // auth-only routes skip RBAC
  if (requirement === 'auth-only') return NextResponse.next();

  // RBAC routes: get user via JWT or profile
  let user = tryDecodeUserFromJwt(token);

  const needsPerms = requirement.permissions && requirement.permissions.length > 0;
  const needsRole = requirement.roles && requirement.roles.length > 0;
  const needsSuper = !!requirement.superuser;

  const hasEnoughClaims =
      !!user &&
      (!needsPerms || true) && // roles carry permissions; we can always fetch if missing later
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
    url.searchParams.set('from', req.nextUrl.pathname); // optional: track where they came from
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Keep your permissive matcher that was working
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)',
  ],
};
