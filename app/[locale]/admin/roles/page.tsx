'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    GripVertical, ArrowLeft, IdCardLanyard, Plus, Search, Edit, Trash2, Loader2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

import {
    DndContext,
    closestCenter,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    arrayMove,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* -------------------- Types -------------------- */

type Permissions = {
    id: number;
    name: string;
    slug: string;
    description?: string;
    is_active: number;
};

type PermissionGroupForRole = {
    group: string;
    permissions: Permissions[];
};

type Role = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: number;
    permissions: PermissionGroupForRole[];
    created_at: string;
    updated_at: string;
    sortOrder?: number | null;
};

type Paginated<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

/* -------------------- Utils -------------------- */

function useDebouncedValue<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState<T>(value);
    const timeoutRef = useRef<number | null>(null);
    useEffect(() => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => setDebounced(value), delay);
        return () => {
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        };
    }, [value, delay]);
    return debounced;
}

function getPages(current: number, total: number) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set<number>();
    pages.add(1);
    pages.add(total);
    for (let p = current - 1; p <= current + 1; p++) {
        if (p > 1 && p < total) pages.add(p);
    }
    pages.add(2);
    pages.add(total - 1);
    return Array.from(pages).sort((a, b) => a - b);
}

/* -------------------- PaginationBar -------------------- */

function PaginationBar({
                           page,
                           pageSize,
                           total,
                           onPageChange,
                           onPageSizeChange,
                       }: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (p: number) => void;
    onPageSizeChange: (s: number) => void;
}) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(total, page * pageSize);
    const pages = getPages(page, totalPages);

    return (
        <div className="mt-6 flex flex-col items-center justify-between gap-3 md:flex-row">
            <div className="text-sm text-muted-foreground">
                Afișezi <span className="font-medium text-foreground">{from}-{to}</span> din{' '}
                <span className="font-medium text-foreground">{total}</span>
            </div>

            <div className="flex items-center gap-2">
                <label className="mr-2 text-sm text-muted-foreground">Pe pagină</label>
                <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                >
                    {[10, 20, 50, 100].map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>

                <div className="ml-3 flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={page === 1}>
                        Prima
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                    >
                        Înapoi
                    </Button>

                    {pages.map((p, idx) => {
                        const prev = pages[idx - 1];
                        const showDots = prev && p - prev > 1;
                        return (
                            <div key={p} className="flex items-center">
                                {showDots && <span className="px-1 text-muted-foreground">…</span>}
                                <Button
                                    variant={p === page ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => onPageChange(p)}
                                >
                                    {p}
                                </Button>
                            </div>
                        );
                    })}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                    >
                        Înainte
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(totalPages)}
                        disabled={page === totalPages}
                    >
                        Ultima
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* -------------------- SortableRow -------------------- */

function SortableRow({
                         role,
                         onEdit,
                         onDelete,
                     }: {
    role: Role;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: role.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getStatusBadge = (status: number) =>
        status === 1 ? (
            <Badge className="bg-green-100 text-green-800">Activ</Badge>
        ) : (
            <Badge className="bg-red-100 text-red-800">Inactiv</Badge>
        );

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center justify-between rounded-md border bg-card px-3 py-2',
                isDragging && 'shadow-lg ring-2 ring-primary/30 bg-accent'
            )}
        >
            <div className="flex flex-1 flex-row gap-8">
                <button
                    aria-label="Reordonează"
                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-5 w-5" />
                </button>

                <div>
                    <div className="mb-2 flex items-center space-x-2">
                        <h3 className="text-lg font-semibold">{role.name}</h3>
                        {getStatusBadge(role.is_active)}
                        {role.sortOrder != null && (
                            <span className="text-xs text-muted-foreground">#{role.sortOrder}</span>
                        )}
                    </div>

                    {role.description && (
                        <p className="mb-3 line-clamp-2 text-muted-foreground">
                            {role.description}
                        </p>
                    )}

                    <div className="mb-3 flex items-center space-x-4 text-sm">
                        <span className="text-muted-foreground">Slug: {role.slug}</span>
                    </div>
                </div>

                {role.permissions.slice(0, 3).map((pg, idx) => (
                    <div key={idx} className="text-sm text-muted-foreground">
                        <span className="font-bold">{pg.group}</span>
                        <ul>
                            {pg.permissions.slice(0, 4).map((perm) => (
                                <li key={perm.id}>{perm.name}</li>
                            ))}
                            {pg.permissions.length > 4 && <li>…</li>}
                        </ul>
                    </div>
                ))}
                {role.permissions.length > 4 && <div className="text-sm text-muted-foreground"><span className="font-bold">…</span></div>}
            </div>

            <div className="flex items-center gap-1">
                <Link href={`/admin/roles/${role.id}`}>
                    <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Editează
                    </Button>
                </Link>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(role.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Șterge"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

/* -------------------- RolesTab -------------------- */

function RolesTab({ active }: { active: boolean }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebouncedValue(searchTerm, 300);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [roles, setRoles] = useState<Role[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    // snapshot ordinii curente pe pagina vizibilă
    const prevOrderRef = useRef<Map<number, number>>(new Map());

    // dnd sensors
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const abortRef = useRef<AbortController | null>(null);

    const baseIndex = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

    const loadRoles = useCallback(async (): Promise<Paginated<Role> | null> => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        try {
            setLoading(true);
            setError(null);

            const res: Paginated<Role> = await apiClient.getRoles({
                search: debouncedSearch,
                page,
                pageSize,
            } as any);

            const withOrder = res.results.map((r, idx) => ({
                ...r,
                sortOrder: r.sortOrder ?? baseIndex + idx + 1,
            }));

            setRoles(withOrder);
            setTotal(res.count);
            setHasLoaded(true);

            // setăm snapshot sigur (Map existent)
            prevOrderRef.current = new Map(
                withOrder.map((r, idx) => [r.id, Number(r.sortOrder ?? baseIndex + idx + 1)])
            );

            return res;
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                setError(e?.message ?? 'Eroare la încărcarea rolurilor');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, page, pageSize, baseIndex]);

    useEffect(() => {
        if (!active) return;
        void loadRoles();
        return () => abortRef.current?.abort();
    }, [active, loadRoles]);

    const itemsIds = useMemo(() => roles.map((r) => r.id), [roles]);

    async function saveSortOrder(newList: Role[]) {
        setSavingOrder(true);
        try {
            // fallback ultra-sigur — dacă ceva a resetat ref-ul, recreăm un Map gol
            const snapshot = prevOrderRef.current;
            const prevOrder: Map<number, number> =
                snapshot && typeof (snapshot as any).get === 'function'
                    ? snapshot
                    : new Map<number, number>();

            const updates = newList
                .map((r, idx) => {
                    const desired = baseIndex + idx + 1;
                    const before = prevOrder.has(r.id)
                        ? (prevOrder.get(r.id) as number)
                        : (typeof r.sortOrder === 'number' ? r.sortOrder : desired);
                    if (before !== desired) return { id: r.id, desired };
                    return null;
                })
                .filter(Boolean) as { id: number; desired: number }[];

            if (updates.length === 0) {
                // sincronizează snapshot oricum
                prevOrderRef.current = new Map(newList.map((r, idx) => [r.id, baseIndex + idx + 1]));
                return;
            }

            await Promise.all(updates.map((u) => apiClient.updateRoleSortOrder(u.id, u.desired)));

            // după succes, actualizează snapshot
            prevOrderRef.current = new Map(newList.map((r, idx) => [r.id, baseIndex + idx + 1]));
        } finally {
            setSavingOrder(false);
        }
    }

    function onDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (!over || active.id === over.id) return;

        const oldIndex = roles.findIndex((r) => r.id === active.id);
        const newIndex = roles.findIndex((r) => r.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(roles, oldIndex, newIndex);
        const withDesired = reordered.map((r, idx) => ({
            ...r,
            sortOrder: baseIndex + idx + 1,
        }));

        setRoles(withDesired);
        void saveSortOrder(withDesired);
    }

    const onDelete = async (roleId: number) => {
        if (!confirm('Ești sigur că vrei să ștergi acest rol?')) return;
        try {
            await (apiClient as any).deleteRole?.(roleId);
            if (roles.length === 1 && page > 1) setPage((p) => p - 1);
            else await loadRoles();
        } catch (error: any) {
            alert('Eroare: ' + (error?.message ?? ''));
        }
    };

    const foundText = useMemo(
        () => (total === 1 ? '1 rol găsit' : `${total} roluri găsite`),
        [total]
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Gestionare Roluri</h1>
                        <p className="text-muted-foreground">Administrează rolurile și permisiunile platformei</p>
                    </div>
                </div>
                <Link href="/admin/roles/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Adaugă Rol
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card className="mb-2">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                <Input
                                    placeholder="Caută roluri după titlu..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {savingOrder && (
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvăm ordinea…
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Roles List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <IdCardLanyard className="h-5 w-5" />
                        <span>Lista Roluri</span>
                    </CardTitle>
                    <CardDescription>{foundText}</CardDescription>
                </CardHeader>
                <CardContent>
                    {!hasLoaded && active ? (
                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-[72px] animate-pulse rounded-lg bg-muted/60" />
                            ))}
                        </div>
                    ) : !loading && roles.length === 0 ? (
                        <div className="py-12 text-center">
                            <IdCardLanyard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-medium">Nu s-au găsit roluri</h3>
                            <p className="text-muted-foreground">Încearcă să modifici termenii de căutare</p>
                        </div>
                    ) : (
                        <>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                                <SortableContext items={roles.map(r => r.id)} strategy={verticalListSortingStrategy}>
                                    <div className="flex flex-col gap-4">
                                        {roles.map((role) => (
                                            <SortableRow
                                                key={role.id}
                                                role={role}
                                                onEdit={(id) => router.push(`/admin/roles/${id}`)}
                                                onDelete={onDelete}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>

                            <PaginationBar
                                page={page}
                                pageSize={pageSize}
                                total={total}
                                onPageChange={(p) => {
                                    if (p !== page) setPage(p);
                                }}
                                onPageSizeChange={(s) => {
                                    setPageSize(s);
                                    setPage(1);
                                }}
                            />
                        </>
                    )}
                    {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
                </CardContent>
            </Card>
        </div>
    );
}

/* -------------------- PermissionMatrixTab (lazy) -------------------- */

const PermissionMatrixTab = dynamic(
    () => import('./PermissionMatrixTab').then((m) => m.default),
    {
        ssr: false,
        loading: () => <div className="p-6 text-sm text-muted-foreground">Încarc interfața de permisiuni...</div>,
    }
);

/* -------------------- Page with Tabs -------------------- */

export default function RolesWithTabsPage() {
    const [tab, setTab] = useState<'roles' | 'permissions'>('roles');

    return (
        <div className="container mx-auto px-4 py-8">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <div className="mb-6 flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="roles">Roluri</TabsTrigger>
                        <TabsTrigger value="permissions">Permisiuni</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="roles">
                    <RolesTab active={tab === 'roles'} />
                </TabsContent>

                <TabsContent value="permissions">
                    {tab === 'permissions' ? <PermissionMatrixTab /> : null}
                </TabsContent>
            </Tabs>
        </div>
    );
}
