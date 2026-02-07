import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../api';
import axios from '../axios';

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

  it('wraps axios requests via ApiClient', async () => {
    const requestMock = vi.spyOn(axios, 'request').mockResolvedValue({
      data: { data: [] },
    } as any);

    const client = new ApiClient(baseUrl);
    await client.getPopularServices();

    expect(requestMock).toHaveBeenCalledOnce();
    const [config] = requestMock.mock.calls[0];
    expect((config as any).url).toBe('/services/popular');
  });

  it('throws error message from non-ok response JSON', async () => {
    vi.spyOn(axios, 'request').mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Invalid payload' } },
      message: 'Request failed',
    });

    const client = new ApiClient(baseUrl);

    await expect(client.getPopularServices()).rejects.toThrow('Invalid payload');
  });
});
