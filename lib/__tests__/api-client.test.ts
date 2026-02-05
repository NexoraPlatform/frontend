import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../api';

describe('lib/api ApiClient', () => {
  const baseUrl = 'https://api.example.com';

  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
    window.history.pushState({}, '', '/ro/test');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('adds language and currency query params and Authorization header', async () => {
    localStorage.setItem('auth_token', 'token-123');
    localStorage.setItem('preferred_currency', 'EUR');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ data: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new ApiClient(baseUrl);
    await client.getPopularServices();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    const parsed = new URL(url as string);

    expect(parsed.pathname).toBe('/services/popular');
    expect(parsed.searchParams.get('language')).toBe('ro');
    expect(parsed.searchParams.get('currency')).toBe('EUR');

    const headers = (options as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer token-123');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('throws error message from non-ok response JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ message: 'Invalid payload' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new ApiClient(baseUrl);

    await expect(client.getPopularServices()).rejects.toThrow('Invalid payload');
  });
});
