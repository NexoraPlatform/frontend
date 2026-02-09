// lib/server-auth.ts
import { cookies } from 'next/headers';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    'https://Trustorabe.dacars.ro/api';

export async function getServerUser() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('laravel_session')?.value;
    if (!sessionCookie) return null;

    const cookieHeader = cookieStore
        .getAll()
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join('; ');

    const xsrfToken = cookieStore.get('XSRF-TOKEN')?.value;

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
            Accept: 'application/json',
            Cookie: cookieHeader,
            'X-Requested-With': 'XMLHttpRequest',
            ...(xsrfToken ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfToken) } : {}),
            Origin:
                process.env.NEXT_PUBLIC_APP_URL ||
                process.env.NEXTAUTH_URL ||
                'http://127.0.0.1:3000',
            Referer:
                process.env.NEXT_PUBLIC_APP_URL ||
                process.env.NEXTAUTH_URL ||
                'http://127.0.0.1:3000',
        },
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
