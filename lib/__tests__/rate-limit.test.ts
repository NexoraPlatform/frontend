import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getClientIdentifier,
  getTrustedClientIp,
  isRateLimitExemptPath,
  shouldFailOpenOnProviderError,
} from '../server/rate-limit';

describe('lib/server/rate-limit', () => {
  afterEach(() => {
    delete process.env.TRUST_PROXY_IP_HEADERS;
    vi.unstubAllEnvs();
  });

  it('prefers trusted platform headers over spoofable forwarding headers', () => {
    const headers = new Headers({
      'x-forwarded-for': '198.51.100.10',
      'x-real-ip': '198.51.100.11',
      'x-vercel-forwarded-for': '203.0.113.25, 10.0.0.1',
      'cf-connecting-ip': '203.0.113.44',
    });

    expect(getTrustedClientIp(headers)).toBe('203.0.113.25');
    expect(getClientIdentifier(headers)).toBe('203.0.113.25');
  });

  it('falls back to a hashed session identifier when trusted IP headers are absent', () => {
    const headers = new Headers({
      cookie: 'foo=bar; authjs.session-token=session-token-123',
      'user-agent': 'Mozilla/5.0',
    });

    const identifier = getClientIdentifier(headers);
    expect(identifier).toMatch(/^session:authjs\.session-token:/);
    expect(identifier).not.toContain('session-token-123');
  });

  it('falls back to an anonymous user-agent hash when no stronger identifier exists', () => {
    const headers = new Headers({
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      'x-forwarded-for': '198.51.100.10',
      'x-real-ip': '198.51.100.11',
    });

    const identifier = getClientIdentifier(headers);
    expect(identifier).toMatch(/^anonymous:/);
    expect(identifier).not.toContain('198.51.100.10');
    expect(identifier).not.toContain('198.51.100.11');
  });

  it('allows explicitly trusted proxy headers only when opted in', () => {
    process.env.TRUST_PROXY_IP_HEADERS = 'true';

    const headers = new Headers({
      'x-forwarded-for': '198.51.100.10, 10.0.0.1',
    });

    expect(getTrustedClientIp(headers)).toBe('198.51.100.10');
    expect(getClientIdentifier(headers)).toBe('198.51.100.10');
  });

  it('skips rate limiting for session-critical auth endpoints', () => {
    expect(isRateLimitExemptPath('/api/auth/session')).toBe(true);
    expect(isRateLimitExemptPath('/api/auth/callback/credentials')).toBe(true);
    expect(isRateLimitExemptPath('/api/auth/refresh')).toBe(true);
    expect(isRateLimitExemptPath('/api/auth/me')).toBe(true);
    expect(isRateLimitExemptPath('/api/locations')).toBe(true);
    expect(isRateLimitExemptPath('/api/companies/search')).toBe(true);
    expect(isRateLimitExemptPath('/api/realtime/pusher-config')).toBe(true);
    expect(isRateLimitExemptPath('/api/broadcasting/auth')).toBe(true);
    expect(isRateLimitExemptPath('/api/auth/login')).toBe(false);
    expect(isRateLimitExemptPath('/api/auth/register')).toBe(false);
    expect(isRateLimitExemptPath('/api/dashboard/stats')).toBe(false);
  });

  it('fails open on provider errors in development by default', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(shouldFailOpenOnProviderError()).toBe(true);
  });

  it('respects the explicit fail-open env outside development', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UPSTASH_RATE_LIMIT_FAIL_OPEN', 'true');

    expect(shouldFailOpenOnProviderError()).toBe(true);
  });
});
