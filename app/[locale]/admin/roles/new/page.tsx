"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, IdCardLanyard, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/use-locale";
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

type Role = {
    name: string;
    description: string;
    permissions: number[];
}

type Permissions = {
    id: number;
    name: string;
    slug: string;
    description: string;
    is_active: number;
    permission_group_id: number;
}

type GroupPermissions = {
    id: number;
    name: string;
    slug: string;
    permissions: Permissions[];
}

export default function NewRolePage() {
    const [roleData, setRoleData] = useState<Role>({
        name: '',
        description: '',
        permissions: [],
    });
    const [error, setError] = useState<string | boolean>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [permissionGroups, setPermissionGroups] = useState<GroupPermissions[]>([]);
    const router = useRouter();
    const locale = useLocale();
    const title = useAsyncTranslation(locale, 'admin.roles.new_role.title');
    const subtitle = useAsyncTranslation(locale, 'admin.roles.new_role.subtitle');
    const infoTitle = useAsyncTranslation(locale, 'admin.roles.new_role.info_title');
    const infoDescription = useAsyncTranslation(locale, 'admin.roles.new_role.info_description');
    const nameLabel = useAsyncTranslation(locale, 'admin.roles.new_role.name_label');
    const namePlaceholder = useAsyncTranslation(locale, 'admin.roles.new_role.name_placeholder');
    const descriptionLabel = useAsyncTranslation(locale, 'admin.roles.new_role.description_label');
    const descriptionPlaceholder = useAsyncTranslation(locale, 'admin.roles.new_role.description_placeholder');
    const creatingLabel = useAsyncTranslation(locale, 'admin.roles.new_role.creating');
    const createButtonLabel = useAsyncTranslation(locale, 'admin.roles.new_role.create_button');
    const cancelLabel = useAsyncTranslation(locale, 'admin.roles.new_role.cancel');
    const errorOccurred = useAsyncTranslation(locale, 'admin.roles.error_occurred');

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!roleData.name.trim() || !roleData.description.trim()) {
            setError(true);
            setLoading(false);
            return;
        }

        try {
            await apiClient.createRole(roleData);
            router.push(`/${locale}/admin/roles`);
        } catch (error: any) {
            setError(error.message || errorOccurred);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
            <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)] sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_60%)]" />
                <div className="relative flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <Link href={`/${locale}/admin/roles`}>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border border-border/60 bg-white/80 text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-700 dark:border-slate-800/70 dark:bg-slate-950/70 dark:text-slate-100 dark:hover:border-sky-500/50 dark:hover:bg-sky-500/10 dark:hover:text-sky-200"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Trustora Admin
                        </span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{title}</h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                            {subtitle}
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <Card className="border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <IdCardLanyard className="w-5 h-5" />
                            <span>{infoTitle}</span>
                        </CardTitle>
                        <CardDescription>
                            {infoDescription}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
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

                            <Accordion type="multiple" className="w-full">
                                <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                                    {permissionGroups.map((group) => (
                                        <AccordionItem
                                            key={group.id}
                                            value={group.slug}
                                            className="rounded-2xl border border-border/60 bg-background/70 p-2 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60"
                                        >
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
                                                                        onCheckedChange={(checked) => {
                                                                            setRoleData((prev) => {
                                                                                const updated = checked
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


                            <div className="flex flex-wrap gap-4 pt-6">
                                <Button type="submit" disabled={loading} className="flex-1">
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {creatingLabel}
                                        </>
                                    ) : (
                                        <>
                                            <IdCardLanyard className="w-4 h-4 mr-2" />
                                            {createButtonLabel}
                                        </>
                                    )}
                                </Button>
                                <Link href={`/${locale}/admin/roles`}>
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
