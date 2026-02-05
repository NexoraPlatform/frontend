import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getServerUser, requirePermission } from '../server-auth';
import { cookies } from 'next/headers';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('lib/server-auth', () => {
  const cookiesMock = cookies as unknown as vi.Mock;

  beforeEach(() => {
    cookiesMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('getServerUser returns null without auth_token', async () => {
    cookiesMock.mockReturnValue({ get: () => undefined });

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = await getServerUser();
    expect(user).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('getServerUser returns user from API (data.user)', async () => {
    cookiesMock.mockReturnValue({ get: () => ({ value: 'token-123' }) });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ user: { id: 1, email: 'a@b.com' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const user = await getServerUser();
    expect(user).toEqual({ id: 1, email: 'a@b.com' });
  });

  it('getServerUser returns data when API returns direct user', async () => {
    cookiesMock.mockReturnValue({ get: () => ({ value: 'token-123' }) });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 2, email: 'x@y.com' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const user = await getServerUser();
    expect(user).toEqual({ id: 2, email: 'x@y.com' });
  });

  it('requirePermission throws 401 when unauthenticated', async () => {
    cookiesMock.mockReturnValue({ get: () => undefined });

    await expect(requirePermission('admin')).rejects.toMatchObject({ status: 401 });
  });

  it('requirePermission throws 403 when forbidden', async () => {
    cookiesMock.mockReturnValue({ get: () => ({ value: 'token-123' }) });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 1,
        permissions: ['view'],
        roles: [{ slug: 'user', permissions: [{ slug: 'view' }] }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(requirePermission('edit')).rejects.toMatchObject({ status: 403 });
  });

  it('requirePermission passes for superuser', async () => {
    cookiesMock.mockReturnValue({ get: () => ({ value: 'token-123' }) });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 1,
        is_superuser: true,
        roles: [],
        permissions: [],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const user = await requirePermission('edit');
    expect(user).toMatchObject({ id: 1, is_superuser: true });
  });
});
