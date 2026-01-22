// lib/access.ts
export type AccessPermission = {
    id?: number | string;
    slug: string;
};

export type AccessRole = {
    id?: number | string;
    slug: string;
    permissions?: AccessPermission[];
};

export type AccessUser = {
    id: string;
    email: string;

    // optional profile fields
    firstName?: string;
    lastName?: string;
    location?: string;
    language?: string;
    bio?: string;
    avatar?: string;
    testVerified?: boolean;
    callVerified?: boolean;
    stripe_account_id?: string;

    // RBAC fields
    roles?: AccessRole[];        // <-- array of roles with slugs
    permissions?: string[];      // optional extra permissions (strings)
    is_superuser?: boolean;       // optional boolean flag
};

export type Requirement = {
    roles?: string[];           // require one of these role slugs
    permissions?: string[];     // require ALL of these permission slugs
    superuser?: boolean;        // only superusers pass

    any?: Requirement[];        // OR across children
    all?: Requirement[];        // AND across children

    superOverrides?: boolean;   // default true: superuser bypasses non-super-only rules
};

export function getRoleSlugs(user: AccessUser | null): string[] {
    if (!user?.roles?.length) return [];
    return user.roles
        .map(r => {
            if (typeof r === 'string') {
                return r.toLowerCase();
            }
            return typeof r?.slug === 'string' ? r.slug.toLowerCase() : '';
        })
        .filter(Boolean);
}

export function getPermissionSlugs(user: AccessUser | null): string[] {
    const fromUser = (user?.permissions ?? []).map(p => p.toLowerCase());

    const fromRoles =
        user?.roles?.flatMap(r => r.permissions?.map(p => p.slug.toLowerCase()) ?? []) ?? [];

    // de-dupe
    return Array.from(new Set([...fromUser, ...fromRoles]));
}

export function hasRole(user: AccessUser | null, roles: string[]): boolean {
    if (!user) return false;
    const have = new Set(getRoleSlugs(user));
    return roles.some(x => have.has(x.toLowerCase()));
}

export function hasPermission(user: AccessUser | null, permissions: string[]): boolean {
    if (!user) return false;
    const have = new Set(getPermissionSlugs(user));
    return permissions.every(x => have.has(x.toLowerCase()));
}

export function isSuperUser(user: AccessUser | null): boolean {
    if (!user) return false;
    if (user.is_superuser) return true;
    // consider having the "superuser" role slug as superuser too
    const roles = getRoleSlugs(user);
    return roles.includes('superuser');
}

/**
 * Superuser logic:
 * - If req.superuser === true => ONLY superusers pass.
 * - Else if superOverrides !== false and user is superuser => auto-pass.
 * - Then check any/all, then roles + permissions.
 */
export function checkRequirement(user: AccessUser | null, req: Requirement): boolean {
    if (!user) return false;

    const superIs = isSuperUser(user);
    const superOverrides = req.superOverrides !== false;

    if (req.superuser) return superIs;

    if (req.any?.length) {
        return req.any.some(child => checkRequirement(user, { ...child, superOverrides }));
    }

    if (req.all?.length) {
        return req.all.every(child => checkRequirement(user, { ...child, superOverrides }));
    }

    if (superOverrides && superIs) return true;

    if (req.roles?.length && !hasRole(user, req.roles)) return false;
    if (req.permissions?.length && !hasPermission(user, req.permissions)) return false;

    return true;
}
