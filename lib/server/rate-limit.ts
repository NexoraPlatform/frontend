import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

type RateLimitWindow = `${number} ${'s' | 'm' | 'h' | 'd'}`;

type RateLimitRule = {
  id: string;
  pattern: RegExp;
  limit: number;
  window: RateLimitWindow;
  message: string;
};

type RequestLike = {
  headers: Headers;
  method?: string;
  url: string;
  nextUrl?: {
    pathname: string;
  };
};

const normalizeWindow = (
  value: string | undefined,
  fallback: RateLimitWindow,
): RateLimitWindow => {
  if (!value) return fallback;
  const match = value.trim().toLowerCase().match(/^(\d+)\s*([smhd])$/);
  if (!match) return fallback;
  return `${Number(match[1])} ${match[2]}` as RateLimitWindow;
};

const parseLimit = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildRule = ({
  id,
  pattern,
  defaultLimit,
  defaultWindow,
  limitEnv,
  windowEnv,
  message,
}: {
  id: string;
  pattern: RegExp;
  defaultLimit: number;
  defaultWindow: RateLimitWindow;
  limitEnv: string;
  windowEnv: string;
  message: string;
}): RateLimitRule => ({
  id,
  pattern,
  limit: parseLimit(process.env[limitEnv], defaultLimit),
  window: normalizeWindow(process.env[windowEnv], defaultWindow),
  message,
});

const RATE_LIMIT_RULES: RateLimitRule[] = [
  buildRule({
    id: 'api-auth-login',
    pattern: /^\/api\/auth\/login$/i,
    defaultLimit: 10,
    defaultWindow: '1 m',
    limitEnv: 'UPSTASH_RATE_LIMIT_AUTH_LOGIN_MAX',
    windowEnv: 'UPSTASH_RATE_LIMIT_AUTH_LOGIN_WINDOW',
    message: 'Too many login attempts. Please try again in a minute.',
  }),
  buildRule({
    id: 'api-auth-register',
    pattern: /^\/api\/auth\/register$/i,
    defaultLimit: 5,
    defaultWindow: '10 m',
    limitEnv: 'UPSTASH_RATE_LIMIT_AUTH_REGISTER_MAX',
    windowEnv: 'UPSTASH_RATE_LIMIT_AUTH_REGISTER_WINDOW',
    message: 'Too many registration attempts. Please try again later.',
  }),
  buildRule({
    id: 'api-ai-write',
    pattern: /^\/api\/ai\/(recommend-services|recommend-providers|brief-builder)$/i,
    defaultLimit: 20,
    defaultWindow: '1 m',
    limitEnv: 'UPSTASH_RATE_LIMIT_AI_WRITE_MAX',
    windowEnv: 'UPSTASH_RATE_LIMIT_AI_WRITE_WINDOW',
    message: 'AI rate limit reached. Please retry shortly.',
  }),
  buildRule({
    id: 'api-ai-read',
    pattern: /^\/api\/ai\/(brief-builder|final-brief)\/[^/]+$/i,
    defaultLimit: 60,
    defaultWindow: '1 m',
    limitEnv: 'UPSTASH_RATE_LIMIT_AI_READ_MAX',
    windowEnv: 'UPSTASH_RATE_LIMIT_AI_READ_WINDOW',
    message: 'Too many AI status checks. Please retry shortly.',
  }),
  buildRule({
    id: 'api-icons-search',
    pattern: /^\/api\/general\/search\/icons$/i,
    defaultLimit: 120,
    defaultWindow: '1 m',
    limitEnv: 'UPSTASH_RATE_LIMIT_ICONS_SEARCH_MAX',
    windowEnv: 'UPSTASH_RATE_LIMIT_ICONS_SEARCH_WINDOW',
    message: 'Too many icon search requests. Please retry shortly.',
  }),
  buildRule({
    id: 'api-broadcasting-auth',
    pattern: /^\/api\/broadcasting\/auth$/i,
    defaultLimit: 90,
    defaultWindow: '1 m',
    limitEnv: 'UPSTASH_RATE_LIMIT_BROADCAST_AUTH_MAX',
    windowEnv: 'UPSTASH_RATE_LIMIT_BROADCAST_AUTH_WINDOW',
    message: 'Too many realtime auth requests. Please retry shortly.',
  }),
  buildRule({
    id: 'api-global',
    pattern: /^\/api\/.+$/i,
    defaultLimit: 300,
    defaultWindow: '1 m',
    limitEnv: 'UPSTASH_RATE_LIMIT_API_GLOBAL_MAX',
    windowEnv: 'UPSTASH_RATE_LIMIT_API_GLOBAL_WINDOW',
    message: 'Too many requests. Please try again later.',
  }),
];

const upstashEnabled =
  process.env.NODE_ENV !== 'test' &&
  process.env.UPSTASH_RATE_LIMIT_ENABLED !== 'false' &&
  Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
const failOpenOnProviderError = process.env.UPSTASH_RATE_LIMIT_FAIL_OPEN === 'true';

let redis: Redis | null = null;
if (upstashEnabled) {
  try {
    redis = Redis.fromEnv();
  } catch {
    redis = null;
  }
}
const limiterCache = new Map<string, Ratelimit>();

const getLimiter = (rule: RateLimitRule): Ratelimit | null => {
  if (!redis) return null;
  const cacheKey = `${rule.id}:${rule.limit}:${rule.window}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(rule.limit, rule.window),
    prefix: `trustora:ratelimit:${rule.id}`,
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
};

const getPathname = (req: RequestLike): string => {
  if (req.nextUrl?.pathname) return req.nextUrl.pathname;
  try {
    return new URL(req.url).pathname;
  } catch {
    return '/';
  }
};

const SESSION_COOKIE_NAMES = [
  'laravel_session',
  '__Secure-authjs.session-token',
  'authjs.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
] as const;

const hashIdentifier = (value: string): string => {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(16);
};

const extractCookieValue = (cookieHeader: string, name: string): string | null => {
  const prefix = `${name}=`;
  const cookie = cookieHeader
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));

  if (!cookie) return null;

  const rawValue = cookie.slice(prefix.length).trim();
  if (!rawValue) return null;

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
};

export const getTrustedClientIp = (headers: Headers): string | null => {
  const vercelIp = headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
  if (vercelIp) return vercelIp;

  const cloudflareIp = headers.get('cf-connecting-ip')?.trim();
  if (cloudflareIp) return cloudflareIp;

  if (process.env.TRUST_PROXY_IP_HEADERS === 'true') {
    const proxyIp =
      headers.get('x-real-ip')?.trim() ||
      headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (proxyIp) return proxyIp;
  }

  return null;
};

const getSessionIdentifier = (headers: Headers): string | null => {
  const cookieHeader = headers.get('cookie') ?? '';
  if (!cookieHeader) return null;

  for (const cookieName of SESSION_COOKIE_NAMES) {
    const cookieValue = extractCookieValue(cookieHeader, cookieName);
    if (cookieValue) {
      return `session:${cookieName}:${hashIdentifier(cookieValue)}`;
    }
  }

  return null;
};

export const getClientIdentifier = (headers: Headers): string => {
  const trustedIp = getTrustedClientIp(headers);
  if (trustedIp) return trustedIp;

  const sessionIdentifier = getSessionIdentifier(headers);
  if (sessionIdentifier) return sessionIdentifier;

  const userAgent = (headers.get('user-agent') ?? 'unknown').slice(0, 120);
  return `anonymous:${hashIdentifier(userAgent)}`;
};

const shouldSkipByMethod = (method: string | undefined) => {
  const normalized = method?.toUpperCase();
  return normalized === 'HEAD' || normalized === 'OPTIONS';
};

export async function enforceApiRateLimit(
  req: RequestLike,
): Promise<NextResponse | null> {
  if (!upstashEnabled) return null;
  if (shouldSkipByMethod(req.method)) return null;

  const pathname = getPathname(req);
  const rule = RATE_LIMIT_RULES.find((candidate) =>
    candidate.pattern.test(pathname),
  );
  if (!rule) return null;

  const limiter = getLimiter(rule);
  if (!limiter) return null;

  const key = `${rule.id}:${getClientIdentifier(req.headers)}`;

  try {
    const result = await limiter.limit(key);
    if (result.success) return null;

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1000),
    );

    return NextResponse.json(
      { message: rule.message },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
          'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
        },
      },
    );
  } catch {
    if (failOpenOnProviderError) {
      // Optional backward-compatible behavior.
      return null;
    }

    // Fail closed by default when provider is enabled but unavailable.
    return NextResponse.json(
      { message: 'Rate limiting is temporarily unavailable. Please retry shortly.' },
      { status: 503 },
    );
  }
}
