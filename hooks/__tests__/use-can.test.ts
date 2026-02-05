import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCan } from '@/hooks/useCan';
import { useAuth } from '@/contexts/auth-context';

vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

describe('hooks/useCan', () => {
  const mockedUseAuth = useAuth as unknown as vi.Mock;

  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('superuser bypasses role and permission checks', () => {
    mockedUseAuth.mockReturnValue({
      user: { is_superuser: true, roles: [], permissions: [] },
    });

    const { result } = renderHook(() => useCan());

    expect(result.current.isSuper).toBe(true);
    expect(result.current.hasRole('anything')).toBe(true);
    expect(result.current.hasAllPerms('perm.a', 'perm.b')).toBe(true);
    expect(result.current.hasAnyPerm('perm.a', 'perm.b')).toBe(true);
  });

  it('checks roles and permissions case-insensitively', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        is_superuser: false,
        roles: [{ slug: 'Admin', permissions: [{ slug: 'Edit' }] }],
        permissions: ['VIEW'],
      },
    });

    const { result } = renderHook(() => useCan());

    expect(result.current.isSuper).toBe(false);
    expect(result.current.hasRole('admin')).toBe(true);
    expect(result.current.hasRole('provider')).toBe(false);

    expect(result.current.hasAllPerms('edit', 'view')).toBe(true);
    expect(result.current.hasAllPerms('edit', 'delete')).toBe(false);

    expect(result.current.hasAnyPerm('delete', 'view')).toBe(true);
  });
});
