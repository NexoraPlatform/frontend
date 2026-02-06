// middleware.ts
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { defaultLocale } from '@/lib/i18n';
import { locales, localePrefix } from '@/lib/navigation';

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

function resolvePreferredLocale(country: string, cookieLocale?: string | null) {
  const normalizedCookie = normalizeLocale(cookieLocale);
  if (normalizedCookie) return normalizedCookie;
  return country.toUpperCase() === 'RO' ? 'ro' : 'en';
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

export default function middleware(req: any) {
  const { pathname } = req.nextUrl;
  const isServiceWorkerScript = /^\/OneSignalSDK(?:Updater)?Worker\.js$/i.test(pathname);

  if (isServiceWorkerScript) {
    return NextResponse.next();
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

  if (isBasicAuthEnabled() && !isBasicAuthAuthorized(req)) {
    return new NextResponse('Authentication required.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Trustora"',
      },
    });
  }

  const country = req.headers.get('x-vercel-ip-country') || 'XX';
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');

  if (country === 'RU') {
    return new NextResponse('Access Denied', { status: 403 });
  }

  const segments = pathname.split('/');
  const pathLocale = normalizeLocale(segments[1]);
  const pathWithoutLocale = pathLocale ? '/' + segments.slice(2).join('/') : pathname;
  const normalizedPath =
    pathWithoutLocale !== '/' ? pathWithoutLocale.replace(/\/+$/, '') : pathWithoutLocale;

  const preferredLocale = resolvePreferredLocale(country, req.cookies?.get('NEXT_LOCALE')?.value);
  const locale = pathLocale ?? preferredLocale ?? defaultLocale;

  if (!pathLocale) {
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

    if (!isOpenSoonRoute) {
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

    if (!isEarlyAccessRoute) {
      const url = new URL(`/${locale}/early-access`, req.url);
      if (normalizedPath === '/') {
        return NextResponse.rewrite(url);
      }
      return NextResponse.redirect(url);
    }
  }

  return baseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|non-critical\\.css|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|avif)).*)',
  ],
};
