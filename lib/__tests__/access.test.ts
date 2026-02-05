import { describe, it, expect } from 'vitest';
import {
  getRoleSlugs,
  getPermissionSlugs,
  isSuperUser,
  checkRequirement,
  type AccessUser,
} from '../access';

describe('lib/access', () => {
  it('getRoleSlugs merges roles array + role string and normalizes', () => {
    const user = {
      role: 'Admin',
      roles: [{ slug: 'provider' }, 'CLIENT', { slug: 'ADMIN' }],
    } as AccessUser;

    const result = getRoleSlugs(user);
    expect(result.sort()).toEqual(['admin', 'client', 'provider'].sort());
  });

  it('getPermissionSlugs merges user and role permissions, lowercases and dedupes', () => {
    const user = {
      permissions: ['EDIT', 'view'],
      roles: [
        { slug: 'any', permissions: [{ slug: 'View' }, { slug: 'delete' }] },
      ],
    } as AccessUser;

    const result = getPermissionSlugs(user);
    expect(result.sort()).toEqual(['edit', 'view', 'delete'].sort());
  });

  it('isSuperUser returns true for super flags or role', () => {
    expect(isSuperUser({ is_superuser: true } as AccessUser)).toBe(true);
    expect(isSuperUser({ role: 'superuser' } as AccessUser)).toBe(true);
    expect(isSuperUser({ roles: [{ slug: 'SuperUser' }] } as AccessUser)).toBe(true);
    expect(isSuperUser({ roles: [{ slug: 'admin' }] } as AccessUser)).toBe(false);
  });

  it('checkRequirement handles superuser only', () => {
    const superUser = { is_superuser: true } as AccessUser;
    const normalUser = { roles: [{ slug: 'admin' }] } as AccessUser;

    expect(checkRequirement(superUser, { superuser: true })).toBe(true);
    expect(checkRequirement(normalUser, { superuser: true })).toBe(false);
  });

  it('checkRequirement evaluates any/all and respects superOverrides=false', () => {
    const user = {
      roles: [{ slug: 'provider' }],
      permissions: ['edit'],
    } as AccessUser;

    expect(
      checkRequirement(user, {
        any: [{ roles: ['admin'] }, { permissions: ['edit'] }],
      })
    ).toBe(true);

    expect(
      checkRequirement(user, {
        all: [{ roles: ['admin'] }, { permissions: ['edit'] }],
      })
    ).toBe(false);

    const superUser = { is_superuser: true, roles: [] } as AccessUser;
    expect(
      checkRequirement(superUser, {
        roles: ['admin'],
        superOverrides: false,
      })
    ).toBe(false);
  });
});
