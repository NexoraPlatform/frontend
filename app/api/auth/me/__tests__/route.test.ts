import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock, fetchPassportUserProfileMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  fetchPassportUserProfileMock: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: authMock,
}));

vi.mock('@/lib/auth/passport', () => ({
  fetchPassportUserProfile: fetchPassportUserProfileMock,
}));

import { GET } from '@/app/api/auth/me/route';

describe('app/api/auth/me route', () => {
  beforeEach(() => {
    authMock.mockReset();
    fetchPassportUserProfileMock.mockReset();
  });

  it('returns the current session user even when readable remember-me cookies are missing', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 15,
        email: 'stale@example.com',
        firstName: 'Stale',
        lastName: 'Session',
      },
      accessToken: 'access-token',
    });
    fetchPassportUserProfileMock.mockResolvedValue(null);

    const response = await GET(
      new Request('http://localhost/api/auth/me', {
        method: 'GET',
        headers: {
          cookie: 'authjs.session-token=stale',
        },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.user).toMatchObject({
      id: '15',
      email: 'stale@example.com',
      firstName: 'Stale',
      lastName: 'Session',
    });
  });

  it('returns the normalized session user when only auth.js session data is available', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 16,
        email: 'remembered@example.com',
        firstName: 'Remembered',
        lastName: 'User',
      },
    });

    const response = await GET(new Request('http://localhost/api/auth/me', { method: 'GET' }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.user).toMatchObject({
      id: '16',
      email: 'remembered@example.com',
      firstName: 'Remembered',
      lastName: 'User',
    });
  });
});
