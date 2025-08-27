'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight } from 'lucide-react';
import apiClient from '@/lib/api';

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

function usePerRoleDebounceSlug() {
    const timers = useRef<Map<string, any>>(new Map());
    return (roleSlug: string, fn: () => void, delay = 350) => {
        const m = timers.current;
        if (m.has(roleSlug)) clearTimeout(m.get(roleSlug));
        const t = setTimeout(fn, delay);
        m.set(roleSlug, t);
    };
}

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

export default function PermissionMatrixAutosavePage() {
    const [loading, setLoading] = useState(true);
    const [savingRoles, setSavingRoles] = useState<Set<string>>(new Set()); // roleSlug care salvează
    const [filter, setFilter] = useState('');

    const [roles, setRoles] = useState<RoleLite[]>([]);
    const [groups, setGroups] = useState<PermissionGroup[]>([]);
    const [matrix, setMatrix] = useState<MatrixSlugState>({}); // selections pe slug
    const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({}); // accordion state

    const isFiltering = filter.trim().length > 0;

    const matrixRef = useRef(matrix);
    useEffect(() => {
        matrixRef.current = matrix;
    }, [matrix]);

    const debounce = usePerRoleDebounceSlug();

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

                const initialOpen: Record<number, boolean> = {};
                groupsRes.forEach((g: any) => (initialOpen[g.id] = true));
                setOpenGroups(initialOpen);

                const entries = await Promise.all(
                    rolesRes.map(async (r) => {
                        const raw = await apiClient.getRolePermissionSlugs(r.slug); // { permission_slug: [] }
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

    const toggleRoleColumn = (roleSlug: string, checked: boolean) => {
        setMatrix((prev) => {
            const next: MatrixSlugState = { ...prev };
            const set = new Set<string>();
            if (checked) {
                filteredGroups.forEach((g) => g.permissions.forEach((p) => set.add(p.slug)));
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

    const expandAll = () => {
        const next: Record<number, boolean> = {};
        filteredGroups.forEach((g) => (next[g.id] = true));
        setOpenGroups(next);
    };

    const collapseAll = () => {
        const next: Record<number, boolean> = {};
        filteredGroups.forEach((g) => (next[g.id] = false));
        setOpenGroups(next);
    };

    const toggleGroupOpen = (groupId: number) => {
        setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    if (loading) {
        return <div className="p-6 text-sm text-muted-foreground">Încarc datele...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Caută permisiuni (nume / slug / descriere)"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-80"
                    />
                    <button
                        type="button"
                        onClick={expandAll}
                        className="text-sm px-3 py-2 rounded border hover:bg-slate-50"
                    >
                        Extinde tot
                    </button>
                    <button
                        type="button"
                        onClick={collapseAll}
                        className="text-sm px-3 py-2 rounded border hover:bg-slate-50"
                    >
                        Colapsează tot
                    </button>
                </div>
                <div className="text-xs text-muted-foreground">
                    {Array.from(savingRoles).length > 0
                        ? 'Se salvează modificările...'
                        : 'Toate schimbările sunt salvate automat'}
                </div>
            </div>

            <div className="overflow-auto border rounded-md h-[500px]">
                <table className="min-w-[900px] w-full border-separate border-spacing-0">
                    <thead className="bg-muted">
                    <tr>
                        <th className="text-left p-3 border-r min-w-[360px] bg-muted sticky top-0 z-20">
                            Permisiuni
                        </th>
                        {roles.map((role) => {
                            const col = getColState(role.slug);
                            const checkboxState = col.all ? true : col.none ? false : 'indeterminate';
                            const saving = savingRoles.has(role.slug);
                            return (
                                <th
                                    key={role.slug}
                                    className="text-center p-3 border-r min-w-[160px] sticky top-0 z-20 bg-muted"
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="font-medium">{role.name}</div>
                                        <Checkbox
                                            checked={checkboxState as any}
                                            onCheckedChange={(v) => toggleRoleColumn(role.slug, Boolean(v))}
                                            aria-label={`Selectează toate permisiunile pentru ${role.name}`}
                                        />
                                        <span className="text-[10px] text-muted-foreground h-3">
                        {saving ? 'salvez…' : ''}
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
                                <tr className="bg-slate-50">
                                    <td
                                        className="sticky left-0 z-10 bg-slate-50 p-0 border-t border-b"
                                        colSpan={roles.length + 1}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleGroupOpen(group.id)}
                                            className="w-full flex items-center justify-between px-3 py-2"
                                        >
                        <span className="flex items-center gap-2 font-semibold text-sm uppercase tracking-wide text-slate-600">
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
                          {open ? 'Ascunde' : 'Arată'}
                        </span>
                                        </button>
                                    </td>
                                </tr>

                                {open &&
                                    group.permissions.map((perm) => {
                                        return (
                                            <tr key={perm.id} className="hover:bg-slate-50">
                                                <td className="p-3 border-r align-top sticky left-0 bg-white z-10">
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
                                                        className="p-3 text-center border-r"
                                                    >
                                                        <Checkbox
                                                            checked={isChecked(role.slug, perm.slug)}
                                                            onCheckedChange={(v) =>
                                                                toggleCell(role.slug, perm.slug, Boolean(v))
                                                            }
                                                            aria-label={`Permisiunea ${perm.name} pentru rolul ${role.name}`}
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
                                Nicio permisiune găsită pentru filtrul curent.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
