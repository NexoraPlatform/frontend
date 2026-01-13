'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';

type RuleProps = {
    roles?: string[];      // user must have ONE of these roles
    allPerms?: string[];   // user must have ALL of these permissions
    anyPerms?: string[];   // user must have ANY of these permissions
    children: React.ReactNode;
};

type SuperProps = { superuser: true; children: React.ReactNode };
type Props = RuleProps | SuperProps;

function isSuperProps(p: Props): p is SuperProps {
    return (p as any).superuser === true;
}

type Effect = 'allow' | 'deny';

/**
 * Extrage slugs de rol din user (acceptă și user.role string fallback)
 */
function getUserRoleSlugs(user: any): string[] {
    const fromArray = Array.isArray(user?.roles)
        ? user.roles
            .map((r: any) => (r?.slug ? String(r.slug).toLowerCase() : null))
            .filter(Boolean)
        : [];

    const single = user?.role ? [String(user.role).toLowerCase()] : [];

    // dedupe
    return Array.from(new Set([...fromArray, ...single]));
}

/**
 * Construiește index de permisiuni efective cu precedența:
 * user_permissions (allow/deny) > role.permissions (allow implicit)
 */
function buildPermissionIndex(user: any): Map<string, Effect> {
    const map = new Map<string, Effect>();

    // 1) user overrides
    if (Array.isArray(user?.user_permissions)) {
        for (const up of user.user_permissions) {
            const slug = String(up?.slug || '').toLowerCase();
            const effect = String(up?.pivot?.effect || '').toLowerCase() as Effect;
            if (!slug) continue;
            if (effect === 'allow' || effect === 'deny') {
                map.set(slug, effect);
            }
        }
    }

    // 2) roles -> implicit allow dacă nu există deja override
    if (Array.isArray(user?.roles)) {
        for (const role of user.roles) {
            const perms = Array.isArray(role?.permissions) ? role.permissions : [];
            for (const p of perms) {
                const slug = String(p?.slug || '').toLowerCase();
                if (!slug) continue;
                if (!map.has(slug)) {
                    map.set(slug, 'allow');
                }
            }
        }
    }

    return map;
}

function isSuperUser(user: any): boolean {
    if (!user) return false;
    // 1) câmp explicit
    if (user.is_superuser === true) return true;

    // 2) rol textual "superuser"
    const byString =
        typeof user.role === 'string' && user.role.toLowerCase() === 'superuser';
    if (byString) return true;

    // 3) rol în listă
    const roles = getUserRoleSlugs(user);
    return roles.includes('superuser');
}

function hasAnyRole(user: any, required?: string[]): boolean {
    if (!required?.length) return true;
    const roles = getUserRoleSlugs(user);
    const req = required.map((r) => r.toLowerCase());
    return req.some((r) => roles.includes(r));
}

function hasAllPerms(user: any, perms?: string[]): boolean {
    if (!perms?.length) return true;
    const idx = buildPermissionIndex(user);
    return perms.every((p) => idx.get(p.toLowerCase()) === 'allow');
}

function hasAnyPerm(user: any, perms?: string[]): boolean {
    if (!perms?.length) return true;
    const idx = buildPermissionIndex(user);
    return perms.some((p) => idx.get(p.toLowerCase()) === 'allow');
}

export function Can(props: Props) {
    const { user, loading } = useAuth();

    // În timp ce încă nu știm user-ul, nu afișăm (evit flicker)
    if (loading) return null;

    if (!user) return null;

    // 1) Global Superuser Override (Access Control Policy)
    // Superusers implicitly have all permissions and roles access (unless specific restriction, not implemented here)
    if (isSuperUser(user)) {
        return <>{props.children}</>;
    }

    // 2) If the requirement WAS explicitly for superuser only (and they failed step 1), deny
    if (isSuperProps(props)) {
        return null;
    }

    // 3) Role/Permission check (we know props is RuleProps now)
    const okRole = hasAnyRole(user, props.roles);

    // 3) Permissions with deny/allow precedence
    const okAll = hasAllPerms(user, props.allPerms);
    const okAny = hasAnyPerm(user, props.anyPerms);

    return okRole && okAll && okAny ? <>{props.children}</> : null;
}
