import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import proxy from '../proxy';
import {
  BROWSER_SESSION_COOKIE_NAME,
  REMEMBER_ME_COOKIE_NAME,
} from '../lib/auth/session-preferences';

const makeResponse = (type: string, url?: string, status = 200) => ({
  type,
  url,
  status,
  headers: new Headers(),
  cookies: {
    set: vi.fn(),
  },
});

vi.mock('next/server', () => {
  class NextResponseMock {
    body?: any;
    status: number;
    headers: Headers;
    type: string;
    url?: string;
    constructor(body?: any, init?: { status?: number; headers?: HeadersInit }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = new Headers(init?.headers);
      this.type = 'constructor';
      this.cookies = {
        set: vi.fn(),
      };
    }
    static next() {
      return makeResponse('next');
    }
    static redirect(url: URL) {
      return makeResponse('redirect', url.toString(), 307);
    }
    static rewrite(url: URL) {
      return makeResponse('rewrite', url.toString(), 200);
    }
  }

  return { NextResponse: NextResponseMock };
});

vi.mock('next-intl/middleware', () => ({
  default: () => () => null,
}));

vi.mock('@/lib/navigation', () => ({
  locales: ['en', 'ro'],
  localePrefix: 'always',
}));

vi.mock('@/auth', () => ({
  auth: (handler: any) => handler,
}));

describe('proxy', () => {
  const baseUrl = 'https://example.com';
  beforeEach(() => {
    process.env.NEXT_PUBLIC_EARLY_ACCESS_FUNNEL = 'false';
    process.env.EARLY_ACCESS_FUNNEL = 'false';
    process.env.NEXT_PUBLIC_OPEN_SOON = 'false';
    process.env.OPEN_SOON = 'false';
    process.env.NEXT_PUBLIC_OPEN_SOON_ENABLED = 'false';
    process.env.OPEN_SOON_ENABLED = 'false';
    process.env.BASIC_AUTH_ENABLED = 'false';
    process.env.BASIC_AUTH = 'false';
    process.env.BASIC_AUTH_USERS = '';
    process.env.BASIC_AUTH_PASSWORDS = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const makeReq = (path: string, opts?: { auth?: any; headers?: HeadersInit; method?: string }) => {
    const url = new URL(baseUrl + path);
    (url as any).clone = () => new URL(url.toString());
    const headers = new Headers(opts?.headers);
    const cookieEntries = new Map<string, string>();
    const cookieHeader = headers.get('cookie');

    if (cookieHeader) {
      for (const chunk of cookieHeader.split(';')) {
        const [rawName, ...rawValue] = chunk.trim().split('=');
        if (!rawName) continue;
        cookieEntries.set(rawName, rawValue.join('='));
      }
    }

    if (opts?.auth?.user) {
      if (opts.auth.rememberMe === true) {
        cookieEntries.set(REMEMBER_ME_COOKIE_NAME, '1');
      } else {
        cookieEntries.set(BROWSER_SESSION_COOKIE_NAME, '1');
      }
    }

    const cookies = {
      get: (name: string) =>
        cookieEntries.has(name) ? { value: cookieEntries.get(name) } : undefined,
      has: (name: string) => cookieEntries.has(name),
      getAll: () =>
        Array.from(cookieEntries.entries()).map(([name, value]) => ({ name, value })),
    };
    return {
      url: url.toString(),
      method: opts?.method ?? 'GET',
      nextUrl: url as any,
      headers,
      cookies,
      auth: opts?.auth,
    } as any;
  };

  it('returns NextResponse.next for static/assets paths', async () => {
    const req = makeReq('/_next/static/file.js');
    const res: any = await proxy(req);
    expect(res.type).toBe('next');
  });

  it('enforces basic auth when enabled', async () => {
    process.env.BASIC_AUTH_ENABLED = 'true';
    process.env.BASIC_AUTH_USERS = 'admin';
    process.env.BASIC_AUTH_PASSWORDS = 'secret';

    const req = makeReq('/ro/services');
    const res: any = await proxy(req);
    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toContain('Basic');
  });

  it('fails closed when basic auth is enabled but credentials are missing', async () => {
    process.env.BASIC_AUTH_ENABLED = 'true';
    process.env.BASIC_AUTH_USERS = '';
    process.env.BASIC_AUTH_PASSWORDS = '';

    const req = makeReq('/ro/services');
    const res: any = await proxy(req);
    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toContain('Basic');
  });

  it('accepts valid basic auth credentials', async () => {
    process.env.BASIC_AUTH_ENABLED = 'true';
    process.env.BASIC_AUTH_USERS = 'admin';
    process.env.BASIC_AUTH_PASSWORDS = 'secret';

    const token = Buffer.from('admin:secret').toString('base64');
    const req = makeReq('/ro/services', {
      headers: { authorization: `Basic ${token}`, 'x-vercel-ip-country': 'RO' },
    });
    const res: any = await proxy(req);
    expect(res.type).toBe('next');
    expect(res.headers.get('X-Client-Geo-Country')).toBe('RO');
  });

  it('blocks requests from RU', async () => {
    const req = makeReq('/ro/services', {
      headers: { 'x-vercel-ip-country': 'RU' },
    });
    const res: any = await proxy(req);
    expect(res.status).toBe(403);
  });

  it('redirects when locale is missing', async () => {
    const req = makeReq('/projects', {
      headers: { 'x-vercel-ip-country': 'RO' },
    });
    const res: any = await proxy(req);
    expect(res.type).toBe('redirect');
    expect(res.url).toContain('/ro/projects');
  });

  it('respects explicit locale from path even when it differs from preferred locale', async () => {
    const req = makeReq('/en/projects', {
      headers: { 'x-vercel-ip-country': 'RO' },
    });
    const res: any = await proxy(req);
    expect(res.type).toBe('next');
  });

  it('returns 204 for non-api OPTIONS page requests', async () => {
    const req = makeReq('/en', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://vercel.live',
        'access-control-request-headers': 'x-vercel-preview-signature',
      },
    });
    const res: any = await proxy(req);
    expect(res.status).toBe(204);
    expect(res.headers.get('Allow')).toBe('GET, HEAD, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://vercel.live');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('x-vercel-preview-signature');
  });

  it('enforces open soon funnel with redirect (non-admin)', async () => {
    process.env.NEXT_PUBLIC_OPEN_SOON = 'true';
    const req = makeReq('/ro/projects', {
      headers: { 'x-vercel-ip-country': 'RO' },
    });
    const res: any = await proxy(req);
    expect(res.type).toBe('redirect');
    expect(res.url).toContain('/ro/open-soon');
  });

  it('allows open soon route itself', async () => {
    process.env.NEXT_PUBLIC_OPEN_SOON = 'true';
    const req = makeReq('/ro/open-soon', {
      headers: { 'x-vercel-ip-country': 'RO' },
    });
    const res: any = await proxy(req);
    expect(res.type).toBe('next');
  });

  it('open soon bypass for admin user', async () => {
    process.env.NEXT_PUBLIC_OPEN_SOON = 'true';
    const req = makeReq('/ro/projects', {
      headers: { 'x-vercel-ip-country': 'RO' },
      auth: { user: { id: '1', roles: [{ slug: 'admin' }] } },
    });
    const res: any = await proxy(req);
    expect(res.type).toBe('next');
  });

  it('enforces early access funnel with redirect (non-admin)', async () => {
    process.env.NEXT_PUBLIC_EARLY_ACCESS_FUNNEL = 'true';
    const req = makeReq('/ro/services', {
      headers: { 'x-vercel-ip-country': 'RO' },
    });
    const res: any = await proxy(req);
    expect(res.type).toBe('redirect');
    expect(res.url).toContain('/ro/early-access');
  });

  it('redirects unauthenticated users on protected routes', async () => {
    const req = makeReq('/ro/dashboard', {
      headers: { 'x-vercel-ip-country': 'RO' },
    });
    const res: any = await proxy(req);
    expect(res.type).toBe('redirect');
    expect(res.url).toContain('/ro/auth/signin');
    expect(res.url).toContain('callbackUrl=%2Fro%2Fdashboard');
  });

  it('redirects unauthenticated users from /client/* with callbackUrl', async () => {
    const req = makeReq('/ro/client/project-requests?tab=active', {
      headers: { 'x-vercel-ip-country': 'RO' },
    });
    const res: any = await proxy(req);
    expect(res.type).toBe('redirect');
    expect(res.url).toContain('/ro/auth/signin');
    expect(res.url).toContain(
      'callbackUrl=%2Fro%2Fclient%2Fproject-requests%3Ftab%3Dactive'
    );
  });

  it('redirects non-admin from /admin to access-denied', async () => {
    const req = makeReq('/ro/admin', {
      headers: { 'x-vercel-ip-country': 'RO' },
      auth: { user: { id: '1', roles: [{ slug: 'client' }] } },
    });
    const res: any = await proxy(req);
    expect(res.type).toBe('redirect');
    expect(res.url).toContain('/ro/access-denied');
  });

  it('allows superuser aliases on /admin', async () => {
    const req = makeReq('/ro/admin', {
      headers: { 'x-vercel-ip-country': 'RO' },
      auth: { user: { id: '1', role_slugs: ['super_admin'] } },
    });
    const res: any = await proxy(req);
    expect(res.type).toBe('next');
  });

  it('keeps session user as fallback when laravel user fetch is unavailable', async () => {
    const req = makeReq('/ro/admin', {
      headers: {
        'x-vercel-ip-country': 'RO',
        cookie: 'authjs.session-token=test',
      },
      auth: { user: { id: '1', isSuperAdmin: true } },
    });
    const res: any = await proxy(req);
    expect(res.type).toBe('next');
  });

  it('redirects authenticated users away from auth pages', async () => {
    const req = makeReq('/ro/auth/signin', {
      headers: { 'x-vercel-ip-country': 'RO' },
      auth: { user: { id: '1' } },
    });
    const res: any = await proxy(req);
    expect(res.type).toBe('redirect');
    expect(res.url).toContain('/ro/dashboard');
  });
});
