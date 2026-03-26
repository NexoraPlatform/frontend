import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerUser, requirePermission } from '../server-auth';

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

describe('lib/server-auth', () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it('getServerUser returns null without session user', async () => {
    mockAuth.mockResolvedValue(null);

    const user = await getServerUser();
    expect(user).toBeNull();
  });

  it('getServerUser returns normalized session user', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 1, email: 'a@b.com' },
      accessToken: 'access-token',
    });

    const user = await getServerUser();
    expect(user).toMatchObject({ id: '1', email: 'a@b.com' });
  });

  it('getServerUser returns null when the session user exists but backend auth tokens are missing', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 2, email: 'missing-token@example.com' },
    });

    const user = await getServerUser();
    expect(user).toBeNull();
  });

  it('requirePermission throws 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    await expect(requirePermission('admin')).rejects.toMatchObject({ status: 401 });
  });

  it('requirePermission throws 403 when forbidden', async () => {
    mockAuth.mockResolvedValue({
      accessToken: 'access-token',
      user: {
        id: 1,
        permissions: ['view'],
        roles: [{ slug: 'user', permissions: [{ slug: 'view' }] }],
      },
    });

    await expect(requirePermission('edit')).rejects.toMatchObject({ status: 403 });
  });

  it('requirePermission passes for superuser', async () => {
    mockAuth.mockResolvedValue({
      accessToken: 'access-token',
      user: {
        id: 1,
        is_superuser: true,
        roles: [],
        permissions: [],
      },
    });

    const user = await requirePermission('edit');
    expect(user).toMatchObject({ id: '1', is_superuser: true });
  });
});
