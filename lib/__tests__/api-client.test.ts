import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../api';

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

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

  it('wraps fetch requests via ApiClient', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: [] }));
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    await client.getPopularServices();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/services/popular');
  });

  it('throws error message from non-ok response JSON', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ message: 'Invalid payload' }, 422));
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);

    await expect(client.getPopularServices()).rejects.toThrow('Invalid payload');
  });
});
