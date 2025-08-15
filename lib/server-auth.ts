// lib/server-auth.ts
import { cookies } from 'next/headers';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    'https://nexorabe.dacars.ro/api';

export async function getServerUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ?? data;
}

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
    const isSuper = !!user.is_superuser || (user.roles ?? []).some((r: any) => String(r.slug).toLowerCase() === 'superuser');

    if (!isSuper && !perms.every(p => set.has(p.toLowerCase()))) {
        const err: any = new Error('Forbidden');
        err.status = 403;
        throw err;
    }
    return user;
}
