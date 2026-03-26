import { auth } from '@/auth';
import { hasSessionAuthTokens } from '@/lib/auth/session';
import { normalizeAuthUser } from '@/lib/auth/user';

/**
 * Get the server-side user from the Auth.js session.
 */
export async function getServerUser() {
  const session = await auth();
  if (!hasSessionAuthTokens(session as any)) {
    return null;
  }
  const user = normalizeAuthUser(session?.user ?? null);
  return user ?? null;
}

/**
 * Require specific permissions for the current server user.
 */
export async function requirePermission(...perms: string[]) {
  const user = await getServerUser();
  if (!user) {
    const err: any = new Error('Unauthenticated');
    err.status = 401;
    throw err;
  }
  const rolePerms =
    user.roles?.flatMap((r: any) => r.permissions?.map((p: any) => String(p.slug).toLowerCase()) ?? []) ?? [];
  const extra = (user.permissions ?? []).map((p: string) => p.toLowerCase());
  const set = new Set([...rolePerms, ...extra]);
  const isSuper =
    !!user.is_superuser ||
    (user.roles ?? []).some((r: any) => String(r.slug).toLowerCase() === 'superuser');

  if (!isSuper && !perms.every((p) => set.has(p.toLowerCase()))) {
    const err: any = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  return user;
}
