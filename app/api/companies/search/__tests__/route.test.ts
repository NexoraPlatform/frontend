import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock, fetchMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: authMock,
}));

import { GET } from '@/app/api/companies/search/route';

describe('app/api/companies/search route', () => {
  beforeEach(() => {
    authMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock as typeof fetch);
  });

  it('forwards the authenticated bearer token to the backend search endpoint', async () => {
    authMock.mockResolvedValue({
      accessToken: 'search-access-token',
      tokenType: 'Bearer',
    });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: 1, name: 'Acme' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const response = await GET(
      new Request('http://localhost/api/companies/search?q=acme&limit=10', {
        method: 'GET',
      })
    );
    const payload = await response.json();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, init] = fetchMock.mock.calls[0]!;
    expect(String(input)).toContain('/companies/search?q=acme&limit=10');
    const headers = new Headers(init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer search-access-token');
    expect(response.status).toBe(200);
    expect(payload).toEqual({ data: [{ id: 1, name: 'Acme' }] });
  });
});
