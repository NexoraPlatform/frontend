'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import apiClient from '@/lib/api';
import { Locale } from '@/types/locale';

type Permission = {
    id: number;
    permission_group_id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: number;
};

type PermissionGroup = {
    id: number;
    name: string;
    slug: string;
    permissions: Permission[];
};

type RoleLite = {
    id: number;
    name: string;
    slug: string;
};

type MatrixSlugState = Record<string, Set<string>>; // roleSlug -> Set<permissionSlug>

/** Debounce per rol (cheie = roleSlug) */
function usePerRoleDebounceSlug() {
    const timers = useRef<Map<string, any>>(new Map());
    return (roleSlug: string, fn: () => void, delay = 350) => {
        const m = timers.current;
        if (m.has(roleSlug)) clearTimeout(m.get(roleSlug));
        const t = setTimeout(fn, delay);
        m.set(roleSlug, t);
    };
}

/** Normalizează ce vine de la API în string[] */
function normalizeSlugArray(input: unknown): string[] {
    if (Array.isArray(input)) return input.map(String);
    if (input && typeof input === 'object') {
        const obj = input as any;
        if (Array.isArray(obj.permission_slug)) return obj.permission_slug.map(String);
        if (Array.isArray(obj.permission_slugs)) return obj.permission_slugs.map(String);
        if (Array.isArray(obj.permissions)) return obj.permissions.map((p: any) => String(p.slug ?? p));
    }
    return [];
}

export default function PermissionMatrixTab({ locale }: { locale: Locale }) {
    const [loading, setLoading] = useState(true);
    const [savingRoles, setSavingRoles] = useState<Set<string>>(new Set()); // roleSlug care salvează
    const [filter, setFilter] = useState('');
    const t = useTranslations();

    const [roles, setRoles] = useState<RoleLite[]>([]);
    const [groups, setGroups] = useState<PermissionGroup[]>([]);
    const [matrix, setMatrix] = useState<MatrixSlugState>({}); // selections pe slug
    const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({}); // accordion state

    const isFiltering = filter.trim().length > 0;

    // anti-stale payload pentru debounce
    const matrixRef = useRef(matrix);
    useEffect(() => {
        matrixRef.current = matrix;
    }, [matrix]);

    const debounce = usePerRoleDebounceSlug();

    // Fetch (doar când tab-ul este montat)
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);

                const [groupsRes, rolesRes] = await Promise.all([
                    apiClient.getPermissions(),
                    apiClient.getRolesLite(),
                ]);
                if (!alive) return;

                setGroups(groupsRes);
                setRoles(rolesRes);

                // inițializează accordion deschis pe toate grupurile
                const initialOpen: Record<number, boolean> = {};
                (groupsRes as PermissionGroup[]).forEach((g) => (initialOpen[g.id] = true));
                setOpenGroups(initialOpen);

                // umple matrix cu permisiunile curente per rol (slug)
                const entries = await Promise.all(
                    rolesRes.map(async (r) => {
                        // { permission_slug: string[] }
                        const raw = await apiClient.getRolePermissionSlugs(r.slug);
                        const slugs = normalizeSlugArray(raw);
                        return [r.slug, new Set<string>(slugs)] as const;
                    })
                );

                setMatrix(Object.fromEntries(entries) as MatrixSlugState);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        setOpenGroups((prev) => {
            const next: Record<number, boolean> = { ...prev };
            groups.forEach((g) => {
                if (next[g.id] === undefined) next[g.id] = true;
            });
            return next;
        });
    }, [groups]);

    const filteredGroups = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return groups;
        return groups
            .map((g) => ({
                ...g,
                permissions: g.permissions.filter(
                    (p) =>
                        p.name.toLowerCase().includes(q) ||
                        (p.description ?? '').toLowerCase().includes(q) ||
                        p.slug.toLowerCase().includes(q)
                ),
            }))
            .filter((g) => g.permissions.length > 0);
    }, [groups, filter]);

    const isChecked = (roleSlug: string, permSlug: string) =>
        matrix[roleSlug]?.has(permSlug) ?? false;

    const queueSaveRole = (roleSlug: string) => {
        setSavingRoles((prev) => new Set(prev).add(roleSlug));
        debounce(roleSlug, async () => {
            try {
                const roleId = roles.find((r) => r.slug === roleSlug)?.id;
                if (roleId == null) return;
                const latest = matrixRef.current;
                const payload = Array.from(latest[roleSlug] ?? []); // string[]
                await apiClient.updateRolePermissionsBySlug(roleId, payload); // PUT { permission_slug: [...] }
            } catch (e) {
                console.error(e);
            } finally {
                setSavingRoles((prev) => {
                    const next = new Set(prev);
                    next.delete(roleSlug);
                    return next;
                });
            }
        });
    };

    const toggleCell = (roleSlug: string, permSlug: string, checked: boolean | 'indeterminate') => {
        setMatrix((prev) => {
            const next: MatrixSlugState = { ...prev };
            const set = new Set(next[roleSlug] ?? []);
            if (checked) set.add(permSlug);
            else set.delete(permSlug);
            next[roleSlug] = set;
            return next;
        });
        queueSaveRole(roleSlug);
    };

    // select/deselect all visible permissions for a role (column)
    const toggleRoleColumn = (roleSlug: string, checked: boolean) => {
        setMatrix((prev) => {
            const next: MatrixSlugState = { ...prev };
            const set = new Set<string>();
            if (checked) {
                filteredGroups.forEach((g) => g.permissions.forEach((p) => set.add(p.slug)));
            }
            next[roleSlug] = set; // gol dacă unchecked
            return next;
        });
        queueSaveRole(roleSlug);
    };

    // group-level checkbox per role: selects all permissions in that group for that role
    const toggleGroupForRole = (group: PermissionGroup, roleSlug: string, checked: boolean) => {
        const slugsInGroup = group.permissions.map((p) => p.slug);
        setMatrix((prev) => {
            const next: MatrixSlugState = { ...prev };
            const set = new Set(next[roleSlug] ?? []);
            if (checked) {
                slugsInGroup.forEach((s) => set.add(s));
            } else {
                slugsInGroup.forEach((s) => set.delete(s));
            }
            next[roleSlug] = set;
            return next;
        });
        queueSaveRole(roleSlug);
    };

    const getRowState = (permSlug: string) => {
        const total = roles.length;
        if (total === 0) return { all: false, none: true, indeterminate: false };
        let count = 0;
        roles.forEach((r) => {
            if (matrix[r.slug]?.has(permSlug)) count++;
        });
        return {
            all: count === total,
            none: count === 0,
            indeterminate: count > 0 && count < total,
        };
    };

    const getColState = (roleSlug: string) => {
        const permsVisible = filteredGroups.flatMap((g) => g.permissions.map((p) => p.slug));
        const total = permsVisible.length;
        if (total === 0) return { all: false, none: true, indeterminate: false };
        let count = 0;
        permsVisible.forEach((slug) => {
            if (matrix[roleSlug]?.has(slug)) count++;
        });
        return {
            all: count === total,
            none: count === 0,
            indeterminate: count > 0 && count < total,
        };
    };

    // group-level state per role (for header row checkboxes)
    const getGroupRoleState = (group: PermissionGroup, roleSlug: string) => {
        const perms = group.permissions.map((p) => p.slug);
        const total = perms.length;
        let count = 0;
        const set = matrix[roleSlug] ?? new Set<string>();
        perms.forEach((s) => {
            if (set.has(s)) count++;
        });
        return {
            all: count === total,
            none: count === 0,
            indeterminate: count > 0 && count < total,
        };
    };

    const searchPlaceholder = t('admin.roles.permission_matrix.search_placeholder');
    const savingChanges = t('admin.roles.permission_matrix.saving_changes');
    const savedAuto = t('admin.roles.permission_matrix.saved_auto');
    const permissionsLabel = t('admin.roles.permission_matrix.permissions');
    const hideLabel = t('admin.roles.permission_matrix.hide');
    const showLabel = t('admin.roles.permission_matrix.show');
    const loadingLabel = t('admin.roles.permission_matrix.loading');
    const noPermissions = t('admin.roles.permission_matrix.no_permissions');
    const savingShort = t('admin.roles.permission_matrix.saving_short');
    const selectAllForTemplate = t('admin.roles.permission_matrix.select_all_for');
    const permissionForRoleTemplate = t('admin.roles.permission_matrix.permission_for_role');
    const selectGroupForRoleTemplate = t('admin.roles.permission_matrix.select_group_for_role');

    if (loading) {
        return <div className="p-6 text-sm text-muted-foreground">{loadingLabel}</div>;
    }

    return (
        <Card className="border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
            <CardContent className="p-6">
                {/* Toolbar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder={searchPlaceholder}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-80"
                        />
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {Array.from(savingRoles).length > 0 ? savingChanges : savedAuto}
                    </div>
                </div>

                {/* Tabel cu header + prima coloană sticky */}
                <div className="h-[500px] overflow-auto rounded-2xl border border-border/60 bg-background/70 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
                    <table className="min-w-[900px] w-full border-separate border-spacing-0 text-sm">
                        <thead className="bg-muted/70 text-foreground dark:bg-slate-900/60">
                        <tr>
                            <th className="text-left p-3 border-r border-border/60 min-w-[360px] bg-muted/70 sticky top-0 z-20 dark:border-slate-800/70 dark:bg-slate-900/60">
                                {permissionsLabel}
                            </th>
                            {roles.map((role) => {
                                const col = getColState(role.slug);
                                const checkboxState = col.all ? true : col.none ? false : 'indeterminate';
                                const saving = savingRoles.has(role.slug);
                                return (
                                    <th
                                        key={role.slug}
                                        className="text-center p-3 border-r border-border/60 min-w-[160px] sticky top-0 z-20 bg-muted/70 dark:border-slate-800/70 dark:bg-slate-900/60"
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="font-medium">{role.name}</div>
                                            <Checkbox
                                                checked={checkboxState as any}
                                                onCheckedChange={(v) => toggleRoleColumn(role.slug, Boolean(v))}
                                                aria-label={selectAllForTemplate.replace('{role}', role.name)}
                                            />
                                            <span className="text-[10px] text-muted-foreground h-3">
                        {saving ? savingShort : ''}
                      </span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                        </thead>

                        <tbody>
                        {filteredGroups.map((group) => {
                            const open = isFiltering ? true : openGroups[group.id] ?? true;

                            return (
                                <React.Fragment key={group.id}>
                                    {/* Group header row with accordion + group-level checkboxes per role */}
                                    <tr className="bg-muted/40 dark:bg-slate-900/40">
                                        {/* Group title cell (sticky left) */}
                                        <td
                                            className="sticky left-0 z-10 bg-muted/40 p-0 border-t border-b border-border/60 dark:border-slate-800/70 dark:bg-slate-900/40"
                                            colSpan={1}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !open }))}
                                                className="w-full flex items-center justify-between px-3 py-2"
                                            >
                        <span className="flex items-center gap-2 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                          {open ? (
                              <ChevronDown className="h-4 w-4" />
                          ) : (
                              <ChevronRight className="h-4 w-4" />
                          )}
                            {group.name}
                            <span className="text-xs text-muted-foreground normal-case">
                            ({group.permissions.length})
                          </span>
                        </span>
                                                <span className="text-xs text-muted-foreground">
                          {open ? hideLabel : showLabel}
                        </span>
                                            </button>
                                        </td>

                                        {/* Group-level checkboxes per role column */}
                                        {roles.map((role) => {
                                            const state = getGroupRoleState(group, role.slug);
                                            const boxState = state.all ? true : state.none ? false : 'indeterminate';
                                            return (
                                                <td
                                                    key={`group-${group.id}-role-${role.slug}`}
                                                    className="text-center border-t border-b border-border/60 dark:border-slate-800/70"
                                                >
                                                    <Checkbox
                                                        checked={boxState as any}
                                                        onCheckedChange={(v) =>
                                                            toggleGroupForRole(group, role.slug, Boolean(v))
                                                        }
                                                        aria-label={selectGroupForRoleTemplate
                                                            .replace('{group}', group.name)
                                                            .replace('{role}', role.name)}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>

                                    {/* Children rows (permissions) */}
                                    {open &&
                                        group.permissions.map((perm) => {
                                            // we can compute row state if you want row-level select-all across roles
                                            return (
                                                <tr key={perm.id} className="hover:bg-muted/30 dark:hover:bg-slate-900/30">
                                                    <td className="p-3 border-r border-border/60 align-top sticky left-0 bg-background/80 z-10 dark:border-slate-800/70 dark:bg-slate-950/70">
                                                        <div className="flex items-start gap-3">
                                                            <div>
                                                                <div className="font-medium text-sm">{perm.name}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {perm.description || perm.slug}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {roles.map((role) => (
                                                        <td
                                                            key={`${perm.slug}-${role.slug}`}
                                                            className="p-3 text-center border-r border-border/60 dark:border-slate-800/70"
                                                        >
                                                            <Checkbox
                                                                checked={isChecked(role.slug, perm.slug)}
                                                                onCheckedChange={(v) =>
                                                                    toggleCell(role.slug, perm.slug, Boolean(v))
                                                                }
                                                                aria-label={permissionForRoleTemplate
                                                                    .replace('{permission}', perm.name)
                                                                    .replace('{role}', role.name)}
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                </React.Fragment>
                            );
                        })}

                        {filteredGroups.length === 0 && (
                            <tr>
                                <td
                                    colSpan={roles.length + 1}
                                    className="p-6 text-center text-sm text-muted-foreground"
                                >
                                    {noPermissions}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
