'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import {ArrowLeft, Edit, FileCog, IdCardLanyard, MoreHorizontal, Plus, Search, Trash2,} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import {Input} from '@/components/ui/input';
import apiClient from '@/lib/api';

type Permissions = {
    id: number;
    name: string;
    slug: string;
    description?: string;
    is_active: number;
};

type PermissionGroup = {
    group: string;
    permissions: Permissions[];
};

type Role = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: number;
    permissions: PermissionGroup[];
    created_at: string;
    updated_at: string;
};

type Paginated<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

function useDebouncedValue<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);
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

export default function AdminRolesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebouncedValue(searchTerm, 300);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [roles, setRoles] = useState<Role[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // reset la pagina 1 când se schimbă căutarea
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const abortRef = useRef<AbortController | null>(null);

    const loadRoles = useCallback(async (): Promise<Paginated<Role> | null> => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.getRoles({
                search: debouncedSearch,
                page,
                pageSize,
            });
            setRoles(res.results);
            setTotal(res.count);
            return res;
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                setError(e?.message ?? 'Eroare la încărcarea rolurilor');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, page, pageSize]);

    useEffect(() => {
        loadRoles();
        return () => abortRef.current?.abort();
    }, [loadRoles]);

    const handleRoleDelete = async (roleId: number) => {
        if (!confirm('Ești sigur că vrei să ștergi acest rol?')) return;
        try {
            await apiClient.deleteRole(roleId);
            // dacă e posibil ca pagina curentă să rămână goală, mergem pe pagina precedentă
            if (roles.length === 1 && page > 1) {
                setPage((p) => p - 1);
            } else {
                await loadRoles();
            }
        } catch (error: any) {
            alert('Eroare: ' + (error?.message ?? ''));
        }
    };

    const getStatusBadge = (status: number) =>
        status === 1 ? (
            <Badge className="bg-green-100 text-green-800">Activ</Badge>
        ) : (
            <Badge className="bg-red-100 text-red-800">Inactiv</Badge>
        );

    const foundText = useMemo(
        () => (total === 1 ? '1 rol găsit' : `${total} roluri găsite`),
        [total]
    );

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Gestionare Roluri</h1>
                        <p className="text-muted-foreground">
                            Administrează rolurile si permisiuniile platformei
                        </p>
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
            <Card className="mb-6">
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
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-[72px] animate-pulse rounded-lg bg-muted/60" />
                            ))}
                        </div>
                    ) : roles.length === 0 ? (
                        <div className="py-12 text-center">
                            <IdCardLanyard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-medium">Nu s-au găsit roluri</h3>
                            <p className="text-muted-foreground">Încearcă să modifici termenii de căutare</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {roles.map((role) => (
                                    <div
                                        key={role.id}
                                        className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex flex-1 flex-row gap-8">
                                            <div>
                                                <div className="mb-2 flex items-center space-x-2">
                                                    <h3 className="text-lg font-semibold">{role.name}</h3>
                                                    {getStatusBadge(role.is_active)}
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

                                            {role.permissions.slice(0, 3).map((permissionGroup, index) => (
                                                <div key={index} className="text-sm text-muted-foreground">
                                                    <span className="font-bold">{permissionGroup.group}</span>
                                                    <ul>
                                                        {permissionGroup.permissions.slice(0, 4).map((permission) => (
                                                            <li key={permission.id}>{permission.name}</li>
                                                        ))}
                                                        {permissionGroup.permissions.length > 4 && <li>…</li>}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/roles/${role.id}`}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editează
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/roles/${role.id}/permissions`}>
                                                        <FileCog className="mr-2 h-4 w-4" />
                                                        Modifică permisiuni
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleRoleDelete(role.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Șterge
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>

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
