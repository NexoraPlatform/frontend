'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GripVertical, Loader2, Pencil, Trash2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';

type RoleRow = {
    id: number;
    name: string;
    slug: string;
    sortOrder?: number | null;
};

type Paged<T> =
    | { results: T[]; count: number; page?: number; page_size?: number }
    | { data: T[]; total?: number; page?: number; page_size?: number }
    | T[]; // fallback

function extractRoles(data: any): { items: RoleRow[]; total: number | null } {
    if (Array.isArray(data)) {
        return { items: data as RoleRow[], total: null };
    }
    if (Array.isArray(data?.results)) {
        return { items: data.results as RoleRow[], total: data.count ?? null };
    }
    if (Array.isArray(data?.data)) {
        return { items: data.data as RoleRow[], total: data.total ?? null };
    }
    return { items: [], total: 0 };
}

function SortableRow({
                         role,
                         index,
                         onEdit,
                         onDelete,
                     }: {
    role: RoleRow;
    index: number;
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center justify-between rounded-md border bg-card px-3 py-2',
                isDragging && 'shadow-lg ring-2 ring-primary/30 bg-accent'
            )}
        >
            <div className="flex items-center gap-3">
                {/* drag handle */}
                <button
                    aria-label="Reordonează"
                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-5 w-5" />
                </button>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{role.name}</span>
                    <span className="text-xs text-muted-foreground">/{role.slug}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {role.sortOrder != null && (
                    <span className="text-xs text-muted-foreground">#{role.sortOrder}</span>
                )}
                <Button size="icon" variant="ghost" onClick={() => onEdit(role.id)} aria-label="Editează">
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(role.id)} aria-label="Șterge">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export default function RolesListClient() {
    const [roles, setRoles] = useState<RoleRow[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const totalPages = useMemo(() => {
        if (!total || total <= 0) return 1;
        return Math.max(1, Math.ceil(total / pageSize));
    }, [total, pageSize]);

    const baseIndex = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

    const prevIdsRef = useRef<number[]>([]);

    async function load() {
        setLoading(true);
        try {
            const data: Paged<RoleRow> = await apiClient.getRoles({
                search: search || undefined,
                page,
                pageSize,
            } as any);
            const { items, total } = extractRoles(data);

            // setează sortOrder relativ dacă backend-ul nu îl trimite
            const withOrder = items.map((r, idx) => ({
                ...r,
                sortOrder: r.sortOrder ?? baseIndex + idx + 1,
            }));

            setRoles(withOrder);
            setTotal(total);
            prevIdsRef.current = withOrder.map((r) => r.id);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize]);

    function onDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIndex = roles.findIndex((r) => r.id === active.id);
        const newIndex = roles.findIndex((r) => r.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const newList = arrayMove(roles, oldIndex, newIndex).map((r, idx) => ({
            ...r,
            sortOrder: baseIndex + idx + 1,
        }));

        setRoles(newList);
        void saveSortOrder(newList);
    }

    async function saveSortOrder(newList: RoleRow[]) {
        setSavingOrder(true);
        try {
            // Actualizează doar itemii care s-au mutat (id vs noua poziție)
            await Promise.all(
                newList.map((r, idx) => {
                    const newOrder = baseIndex + idx + 1;
                    if (r.sortOrder === newOrder) return Promise.resolve();
                    return apiClient.updateRoleSortOrder(r.id, newOrder);
                })
            );
            prevIdsRef.current = newList.map((r) => r.id);
        } finally {
            setSavingOrder(false);
        }
    }

    const itemsIds = roles.map((r) => r.id);

    const onEdit = (id: number) => {
        // navigate to your edit page
        window.location.href = `/admin/roles/${id}`;
    };
    const onDelete = async (id: number) => {
        // dacă ai endpoint de delete, îl poți apela aici; pentru demo doar reîncarc
        await load();
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Caută roluri…"
                    className="w-64"
                />
                <Button
                    onClick={() => {
                        setPage(1);
                        void load();
                    }}
                >
                    Caută
                </Button>

                <div className="ml-auto flex items-center gap-2">
                    {savingOrder && (
                        <span className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvăm ordinea…
            </span>
                    )}
                </div>
            </div>

            <div className="rounded-lg border bg-background p-3">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Încărcăm rolurile…
                    </div>
                ) : roles.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        Niciun rol găsit.
                    </div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                        <SortableContext items={itemsIds} strategy={verticalListSortingStrategy}>
                            <div className="flex flex-col gap-2">
                                {roles.map((role, idx) => (
                                    <SortableRow
                                        key={role.id}
                                        role={role}
                                        index={idx}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Pagina {page} {total ? `din ${Math.ceil(total / pageSize)}` : ''}{' '}
                    {total != null ? `(total ${total})` : ''}
                </div>

                <div className="flex items-center gap-2">
                    <select
                        className="h-9 rounded-md border bg-background px-2 text-sm"
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                    >
                        {[5, 10, 20, 50].map((n) => (
                            <option key={n} value={n}>
                                {n}/pag
                            </option>
                        ))}
                    </select>

                    <Button
                        variant="outline"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        disabled={total != null ? page >= Math.ceil(total / pageSize) || loading : false}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Următor
                    </Button>
                </div>
            </div>
        </div>
    );
}
