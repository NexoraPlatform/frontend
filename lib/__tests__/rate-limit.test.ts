import { afterEach, describe, expect, it, vi } from 'vitest';
import { getClientIdentifier, getTrustedClientIp } from '../server/rate-limit';

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
      cookie: 'foo=bar; laravel_session=session-token-123; XSRF-TOKEN=test',
      'user-agent': 'Mozilla/5.0',
    });

    const identifier = getClientIdentifier(headers);
    expect(identifier).toMatch(/^session:laravel_session:/);
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
});
