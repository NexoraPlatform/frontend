// hooks/useCan.ts
'use client';
import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';

type Role = { slug: string; permissions?: { slug: string }[] };

function flattenPerms(roles: Role[] | undefined, extra?: string[]) {
    const rPerms = roles?.flatMap(r => r.permissions?.map(p => p.slug.toLowerCase()) ?? []) ?? [];
    const ePerms = (extra ?? []).map(s => s.toLowerCase());
    return Array.from(new Set([...rPerms, ...ePerms]));
}

export function useCan() {
    const { user } = useAuth();
    const roleSlugs = useMemo(
        () => (user?.roles ?? []).map((r: any) => String(r.slug).toLowerCase()),
        [user?.roles]
    );
    const perms = useMemo(
        () => flattenPerms(user?.roles as any, user?.permissions as any),
        [user?.roles, user?.permissions]
    );
    const isSuper = useMemo(
        () => !!user?.is_superuser || roleSlugs.includes('superuser'),
        [user?.is_superuser, roleSlugs]
    );

    function hasRole(...roles: string[]) {
        if (isSuper) return true;
        const need = roles.map(r => r.toLowerCase());
        return need.some(r => roleSlugs.includes(r));
    }
    function hasAllPerms(...required: string[]) {
        if (isSuper) return true;
        const need = required.map(p => p.toLowerCase());
        return need.every(p => perms.includes(p));
    }
    function hasAnyPerm(...anyOf: string[]) {
        if (isSuper) return true;
        const need = anyOf.map(p => p.toLowerCase());
        return need.some(p => perms.includes(p));
    }

    return { hasRole, hasAllPerms, hasAnyPerm, isSuper };
}
