'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, IdCardLanyard, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import { Locale } from '@/types/locale';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';

import apiClient from '@/lib/api';
import {useAuth} from "@/contexts/auth-context";

type Role = {
    name: string;
    description: string;
    permissions: number[];
    sortOrder: number; // <— nou
};

type Permissions = {
    id: number;
    name: string;
    slug: string;
    description: string;
    is_active: number;
    permission_group_id: number;
};

type GroupPermissions = {
    id: number;
    name: string;
    slug: string;
    permissions: Permissions[];
};

export default function EditRoleClient({ id }: { id: number }) {
    const pathname = usePathname();
    const locale = (pathname.split('/')[1] as Locale) || 'ro';

    const [roleData, setRoleData] = useState<Role>({
        name: '',
        description: '',
        permissions: [],
        sortOrder: 0,
    });
    const [error, setError] = useState<string | boolean>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [permissionGroups, setPermissionGroups] = useState<GroupPermissions[]>([]);
    const [savingOrder, setSavingOrder] = useState(false);
    const [orderSavedAt, setOrderSavedAt] = useState<number | null>(null);
    const { user } = useAuth();

    const router = useRouter();
    const debounceRef = useRef<number | null>(null);

    const title = useAsyncTranslation(locale, 'admin.roles.edit_role.title');
    const subtitleTemplate = useAsyncTranslation(locale, 'admin.roles.edit_role.subtitle');
    const infoTitle = useAsyncTranslation(locale, 'admin.roles.edit_role.info_title');
    const infoDescription = useAsyncTranslation(locale, 'admin.roles.edit_role.info_description');
    const nameLabel = useAsyncTranslation(locale, 'admin.roles.edit_role.name_label');
    const namePlaceholder = useAsyncTranslation(locale, 'admin.roles.edit_role.name_placeholder');
    const descriptionLabel = useAsyncTranslation(locale, 'admin.roles.edit_role.description_label');
    const descriptionPlaceholder = useAsyncTranslation(locale, 'admin.roles.edit_role.description_placeholder');
    const sortOrderLabel = useAsyncTranslation(locale, 'admin.roles.edit_role.sort_order_label');
    const decreaseOrder = useAsyncTranslation(locale, 'admin.roles.edit_role.decrease_order');
    const increaseOrder = useAsyncTranslation(locale, 'admin.roles.edit_role.increase_order');
    const savingLabel = useAsyncTranslation(locale, 'admin.roles.edit_role.saving');
    const savedLabel = useAsyncTranslation(locale, 'admin.roles.edit_role.saved');
    const orderHint = useAsyncTranslation(locale, 'admin.roles.edit_role.order_hint');
    const editButtonLabel = useAsyncTranslation(locale, 'admin.roles.edit_role.edit_button');
    const editingLabel = useAsyncTranslation(locale, 'admin.roles.edit_role.editing');
    const cancelLabel = useAsyncTranslation(locale, 'admin.roles.edit_role.cancel');
    const cannotEditLabel = useAsyncTranslation(locale, 'admin.roles.edit_role.cannot_edit');
    const errorOccurred = useAsyncTranslation(locale, 'admin.roles.error_occurred');

    // Load Role
    useEffect(() => {
        const getRole = async () => {
            const response = await apiClient.getRole(id);
            const mappedRole: Role = {
                name: response.name,
                description: response.description ?? '',
                permissions: Array.isArray(response.permissions) ? response.permissions.map((p: any) => p.id) : [],
                sortOrder: Number(response.sort_order ?? response.sortOrder ?? 0),
            };
            setRoleData(mappedRole);
        };
        getRole();
    }, [id]);

    // Load Permission Groups
    useEffect(() => {
        const loadPermissions = async () => {
            try {
                const response = await apiClient.getPermissions();
                setPermissionGroups(response);
            } catch (err) {
                console.error('Failed to load permissions:', err);
            }
        };
        loadPermissions();
    }, []);

    if (!user?.is_superuser && roleData?.name === 'User') {
        return <div className="text-red-500">{cannotEditLabel}</div>;
    }

    // Debounced live update pentru sort order
    const queueSaveSortOrder = (next: number) => {
        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
        }
        setSavingOrder(true);
        debounceRef.current = window.setTimeout(async () => {
            try {
                await apiClient.updateRoleSortOrder(id, next);
                setOrderSavedAt(Date.now());
            } catch (e) {
                console.error('Failed to update sort order', e);
            } finally {
                setSavingOrder(false);
            }
        }, 500);
    };

    const changeSortOrder = (next: number) => {
        const safe = Number.isFinite(next) ? Math.max(-1_000_000, Math.min(1_000_000, Math.round(next))) : 0;
        setRoleData((prev) => ({ ...prev, sortOrder: safe }));
        queueSaveSortOrder(safe);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!roleData.name.trim() || !roleData.description.trim() || roleData.permissions.length === 0) {
            setError(true);
            setLoading(false);
            return;
        }

        try {
            await apiClient.updateRole(id, {
                name: roleData.name,
                description: roleData.description,
                permissions: roleData.permissions,
            });
            router.push('/admin/roles');
        } catch (error: any) {
            setError(error.message || errorOccurred);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
                <Link href="/admin/roles">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">{title}</h1>
                    <p className="text-muted-foreground">
                        {subtitleTemplate.replace('{name}', roleData.name || '')}
                    </p>
                </div>
            </div>

            <div className="w-full">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <IdCardLanyard className="w-5 h-5" />
                            <span>{infoTitle}</span>
                        </CardTitle>
                        <CardDescription>{infoDescription}</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div>
                                <Label htmlFor="name" className={`${error && 'text-red-500'}`}>{nameLabel}</Label>
                                <Input
                                    id="name"
                                    value={roleData.name}
                                    onChange={(e) => {
                                        setRoleData((prev) => ({ ...prev, name: e.target.value }));
                                        setError('');
                                    }}
                                    placeholder={namePlaceholder}
                                    className={`${error && 'border-red-500'}`}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description" className={`${error && 'text-red-500'}`}>{descriptionLabel}</Label>
                                <Input
                                    id="description"
                                    value={roleData.description}
                                    onChange={(e) => {
                                        setRoleData((prev) => ({ ...prev, description: e.target.value }));
                                        setError('');
                                    }}
                                    placeholder={descriptionPlaceholder}
                                    className={`${error && 'border-red-500'}`}
                                />
                            </div>

                            {/* Sort Order (live) */}
                            <div>
                                <Label htmlFor="sortOrder">{sortOrderLabel}</Label>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center rounded-md border px-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => changeSortOrder(roleData.sortOrder - 1)}
                                            aria-label={decreaseOrder}
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>

                                        <Input
                                            id="sortOrder"
                                            type="number"
                                            inputMode="numeric"
                                            className="w-24 border-0 focus-visible:ring-0 text-center"
                                            value={roleData.sortOrder}
                                            onChange={(e) => changeSortOrder(Number(e.target.value))}
                                        />

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => changeSortOrder(roleData.sortOrder + 1)}
                                            aria-label={increaseOrder}
                                        >
                                            <ChevronUp className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {savingOrder ? (
                                        <span className="inline-flex items-center text-xs text-muted-foreground">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      {savingLabel}
                    </span>
                                    ) : orderSavedAt ? (
                                        <span className="text-xs text-emerald-600">{savedLabel}</span>
                                    ) : null}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {orderHint}
                                </p>
                            </div>

                            {/* Permissions */}
                            <Accordion type="multiple" className="w-full">
                                <div
                                    className={`grid xs:grid-cols-1 ${permissionGroups.length > 1 ? 'md:grid-cols-4' : 'md:grid-cols-1'} gap-4 items-start`}
                                >
                                    {permissionGroups.map((group) => (
                                        <AccordionItem key={group.id} value={group.slug} className="border rounded-md p-2 self-start">
                                            <AccordionTrigger className="text-md font-semibold">
                                                {group.name}
                                            </AccordionTrigger>

                                            <AccordionContent>
                                                <div className="space-y-4 pl-2">
                                                    {group.permissions.map((perm) => {
                                                        const checked = roleData.permissions.includes(perm.id);
                                                        return (
                                                            <Label key={perm.id}>
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="space-y-1">
                                                                        <p className="text-sm font-medium">{perm.name}</p>
                                                                        {perm.description && (
                                                                            <p className="text-xs text-muted-foreground">{perm.description}</p>
                                                                        )}
                                                                    </div>
                                                                    <Checkbox
                                                                        checked={checked}
                                                                        onCheckedChange={(val) => {
                                                                            const isChecked = Boolean(val);
                                                                            setRoleData((prev) => {
                                                                                const updated = isChecked
                                                                                    ? [...prev.permissions, perm.id]
                                                                                    : prev.permissions.filter((id) => id !== perm.id);
                                                                                return { ...prev, permissions: updated };
                                                                            });
                                                                        }}
                                                                    />
                                                                </div>
                                                            </Label>
                                                        );
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </div>
                            </Accordion>

                            {/* Actions */}
                            <div className="flex space-x-4 pt-6">
                                <Button type="submit" disabled={loading} className="flex-1">
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {editingLabel}
                                        </>
                                    ) : (
                                        <>
                                            <IdCardLanyard className="w-4 h-4 mr-2" />
                                            {editButtonLabel}
                                        </>
                                    )}
                                </Button>
                                <Link href="/admin/roles">
                                    <Button type="button" variant="outline">
                                        {cancelLabel}
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
