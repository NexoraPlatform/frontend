import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../api';
import apiAxios from '@/lib/axios';
import Axios from 'axios';

vi.mock('@/lib/axios', () => ({
  default: {
    request: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    isAxiosError: (err: any) => Boolean(err?.isAxiosError),
  },
  isAxiosError: (err: any) => Boolean(err?.isAxiosError),
}));

describe('lib/api ApiClient', () => {
  const baseUrl = 'https://api.example.com';

  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
    window.history.pushState({}, '', '/ro/test');
    const requestMock = apiAxios.request as unknown as vi.Mock;
    requestMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('adds language and currency query params and Authorization header', async () => {
    localStorage.setItem('preferred_currency', 'EUR');

    const requestMock = apiAxios.request as unknown as vi.Mock;
    requestMock.mockResolvedValue({
      status: 200,
      data: { data: [] },
      headers: { 'content-type': 'application/json' },
    });

    const client = new ApiClient(baseUrl);
    client.setToken('token-123');
    await client.getPopularServices();

    expect(requestMock).toHaveBeenCalledOnce();
    const [config] = requestMock.mock.calls[0];
    const parsed = new URL(config.url as string);

    expect(parsed.pathname).toBe('/services/popular');
    expect(parsed.searchParams.get('language')).toBe('ro');
    expect(parsed.searchParams.get('currency')).toBe('EUR');

    const headers = config.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer token-123');
  });

  it('throws error message from non-ok response JSON', async () => {
    const requestMock = apiAxios.request as unknown as vi.Mock;
    requestMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: { message: 'Invalid payload' },
      },
      message: 'Request failed',
    });

    const client = new ApiClient(baseUrl);

    await expect(client.getPopularServices()).rejects.toThrow('Invalid payload');
  });
});
