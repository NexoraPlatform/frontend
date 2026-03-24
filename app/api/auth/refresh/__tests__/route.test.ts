import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getTokenMock,
  unstableUpdateMock,
  refreshPassportAccessTokenMock,
  fetchPassportUserProfileMock,
} = vi.hoisted(() => ({
  getTokenMock: vi.fn(),
  unstableUpdateMock: vi.fn(),
  refreshPassportAccessTokenMock: vi.fn(),
  fetchPassportUserProfileMock: vi.fn(),
}));

vi.mock('next-auth/jwt', () => ({
  getToken: getTokenMock,
}));

vi.mock('@/auth', () => ({
  unstable_update: unstableUpdateMock,
}));

vi.mock('@/lib/auth/passport', () => ({
  refreshPassportAccessToken: refreshPassportAccessTokenMock,
  fetchPassportUserProfile: fetchPassportUserProfileMock,
}));

import { POST } from '@/app/api/auth/refresh/route';

describe('app/api/auth/refresh route', () => {
  beforeEach(() => {
    getTokenMock.mockReset();
    unstableUpdateMock.mockReset();
    refreshPassportAccessTokenMock.mockReset();
    fetchPassportUserProfileMock.mockReset();
  });

  it('refreshes using the raw JWT payload and updates the session once', async () => {
    getTokenMock.mockResolvedValue({
      user: {
        id: '42',
        email: 'legacy@example.com',
        first_name: 'Legacy',
        last_name: 'User',
      },
      refreshToken: 'refresh-token-1',
      tokenType: 'Bearer',
    });
    refreshPassportAccessTokenMock.mockResolvedValue({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
    });
    fetchPassportUserProfileMock.mockResolvedValue({
      id: '42',
      email: 'fresh@example.com',
      first_name: 'Fresh',
      last_name: 'User',
    });
    unstableUpdateMock.mockResolvedValue({
      user: {
        id: '42',
        email: 'fresh@example.com',
        firstName: 'Fresh',
        lastName: 'User',
      },
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      tokenType: 'Bearer',
    });

    const response = await POST(
      new Request('http://localhost/api/auth/refresh', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
        },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getTokenMock).toHaveBeenCalledTimes(1);
    expect(refreshPassportAccessTokenMock).toHaveBeenCalledWith({
      refreshToken: 'refresh-token-1',
      origin: 'http://localhost:3000',
    });
    expect(fetchPassportUserProfileMock).toHaveBeenCalledWith('new-access-token', {
      origin: 'http://localhost:3000',
      includeConnectedAccounts: true,
    });
    expect(unstableUpdateMock).toHaveBeenCalledTimes(1);
    expect(unstableUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer',
        error: null,
      })
    );
    expect(payload.accessToken).toBe('new-access-token');
    expect(payload.refreshToken).toBe('new-refresh-token');
    expect(payload.user).toMatchObject({
      id: '42',
      email: 'fresh@example.com',
      firstName: 'Fresh',
      lastName: 'User',
    });
  });

  it('returns 401 when the raw token has no refresh token', async () => {
    getTokenMock.mockResolvedValue({
      user: null,
      refreshToken: null,
    });

    const response = await POST(new Request('http://localhost/api/auth/refresh', { method: 'POST' }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ message: 'Missing refresh token' });
    expect(refreshPassportAccessTokenMock).not.toHaveBeenCalled();
    expect(unstableUpdateMock).not.toHaveBeenCalled();
  });

  it('clears the session when the refresh request fails', async () => {
    getTokenMock.mockResolvedValue({
      user: {
        id: '42',
        email: 'legacy@example.com',
      },
      refreshToken: 'expired-refresh-token',
    });
    refreshPassportAccessTokenMock.mockRejectedValue(new Error('invalid_grant'));
    unstableUpdateMock.mockResolvedValue(null);

    const response = await POST(new Request('http://localhost/api/auth/refresh', { method: 'POST' }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ message: 'invalid_grant' });
    expect(unstableUpdateMock).toHaveBeenCalledWith({
      accessToken: null,
      refreshToken: null,
      tokenType: null,
      accessTokenExpiresAt: null,
      error: 'RefreshAccessTokenError',
    });
  });
});
