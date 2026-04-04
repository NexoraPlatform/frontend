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
    firstName?: string | null;
    lastName?: string | null;
    location?: string | null;
    language?: string | null;
    bio?: string | null;
    avatar?: string | null;
    testVerified?: boolean;
    callVerified?: boolean;
    stripe_account_id?: string;
    rapyd_wallet_id?: string;
    rapyd_contact_id?: string;
    escrow_customer_id?: string | null;
    escrow_kyb_verified?: boolean | null;
    escrow_next_step?: string | null;

    // RBAC fields
    role?: string | null;             // optional single role slug
    roles?: Array<AccessRole | string>;        // <-- array of roles with slugs
    role_slugs?: string[];            // optional raw role slugs array
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

const SUPER_ROLE_ALIASES = new Set(['superuser', 'superadmin', 'superadministrator', 'root']);

function normalizeRoleAlias(role: string): string {
    return role.toLowerCase().trim().replace(/[\s_-]+/g, '');
}

function isTruthyFlag(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }
    return false;
}

export function getRoleSlugs(user: AccessUser | null): string[] {
    const rolesFromArray = user?.roles?.length
        ? user.roles
            .map((role) => {
                if (typeof role === 'string') return role.toLowerCase();
                if (typeof role?.slug === 'string') return role.slug.toLowerCase();
                return '';
            })
            .filter(Boolean)
        : [];
    const roleFromString =
        typeof user?.role === 'string' ? [user.role.toLowerCase()] : [];
    const roleFromSlugs =
        Array.isArray(user?.role_slugs)
            ? user!.role_slugs.map((slug) => slug.toLowerCase()).filter(Boolean)
            : [];
    return [...new Set([...rolesFromArray, ...roleFromString, ...roleFromSlugs])];
}

export function getPermissionSlugs(user: AccessUser | null): string[] {
    const fromUser = (user?.permissions ?? []).map(p => p.toLowerCase());

    const fromRoles =
        user?.roles?.flatMap((role) => {
            if (typeof role === 'string') return [];
            return role.permissions?.map(p => p.slug.toLowerCase()) ?? [];
        }) ?? [];

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
    const flagCandidates = [
        user.is_superuser,
        (user as any).isSuperuser,
        (user as any).is_super_admin,
        (user as any).isSuperAdmin,
        (user as any).superuser,
        (user as any).super_admin,
    ];
    if (flagCandidates.some(isTruthyFlag)) return true;
    // consider common super role aliases from different backends
    const roles = getRoleSlugs(user);
    return roles.some((role) => SUPER_ROLE_ALIASES.has(normalizeRoleAlias(role)));
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
