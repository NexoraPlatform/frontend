'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import apiClient from '@/lib/api';

type PermissionState = {
    [slug: string]: { id: number; name: string; allowed: boolean };
};

export default function AdminCard({
                                      formData,
                                      setFormDataAction,
                                      permissions,
                                      submitAction,      // <- submit comes from parent
                                      loading = false,   // <- UI state from parent
                                      error = '',
                                  }: {
    formData: any;
    setFormDataAction: React.Dispatch<React.SetStateAction<any>>;
    permissions: any[];
    submitAction: (e: React.FormEvent) => Promise<void>;
    loading?: boolean;
    error?: string;
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [permissionModalOpen, setPermissionModalOpen] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<PermissionState>({});
    const hasInitializedPermissions = useRef(false);

    useEffect(() => {
        if (hasInitializedPermissions.current) return;
        if (!formData?.user_permissions) return;

        const mapped: PermissionState = {};
        if (Array.isArray(formData.user_permissions)) {
            formData.user_permissions.forEach((perm: any) => {
                const effect = perm?.pivot?.effect;
                if (!effect) return;
                mapped[perm.slug] = {
                    id: perm.id,
                    name: perm.name,
                    allowed: effect === 'allow',
                };
            });
        } else {
            Object.assign(mapped, formData.user_permissions);
        }

        setSelectedPermissions(mapped);
        hasInitializedPermissions.current = true;
    }, [formData.user_permissions]);

    // immediate checkbox add/remove with backend call
    const togglePermission = async (perm: any) => {
        const userId = formData?.id;
        if (!userId) return;

        const prevSelected = selectedPermissions;
        const exists = !!selectedPermissions[perm.slug];
        const nextSelected: PermissionState = exists
            ? (() => {
                const copy = { ...selectedPermissions };
                delete copy[perm.slug];
                return copy;
            })()
            : {
                ...selectedPermissions,
                [perm.slug]: { id: perm.id, name: perm.name, allowed: true },
            };

        setSelectedPermissions(nextSelected);
        setFormDataAction((prev: any) => ({ ...prev, user_permissions: nextSelected }));

        try {
            if (exists) {
                await apiClient.denyUserPermission(userId, perm.slug);
            } else {
                await apiClient.allowUserPermission(userId, perm.slug);
            }
        } catch (err) {
            // rollback
            setSelectedPermissions(prevSelected);
            setFormDataAction((prev: any) => ({ ...prev, user_permissions: prevSelected }));
        }
    };

    // immediate allow/deny toggle with backend call
    const toggleAllowDeny = async (slug: string) => {
        const userId = formData?.id;
        if (!userId) return;
        const current = selectedPermissions[slug];
        if (!current) return;

        const prevSelected = selectedPermissions;
        const updatedAllowed = !current.allowed;
        const nextSelected: PermissionState = {
            ...selectedPermissions,
            [slug]: { ...current, allowed: updatedAllowed },
        };

        setSelectedPermissions(nextSelected);
        setFormDataAction((prev: any) => ({ ...prev, user_permissions: nextSelected }));

        try {
            if (updatedAllowed) {
                await apiClient.allowUserPermission(userId, slug);
            } else {
                await apiClient.denyUserPermission(userId, slug);
            }
        } catch (error) {
            // rollback
            setSelectedPermissions(prevSelected);
            setFormDataAction((prev: any) => ({ ...prev, user_permissions: prevSelected }));
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
                <Link href="/admin/users">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">
                        Modifica Adminul {formData.firstName} {formData.lastName}
                    </h1>
                    <p className="text-muted-foreground">Modifica contul pentru un administrator existent</p>
                </div>
            </div>

            <form onSubmit={submitAction} className="space-y-6">
                <div className="grid xs:grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8">
                    {/* Left Side */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <UserPlus className="w-5 h-5" />
                                    <span>Informații Admin</span>
                                </CardTitle>
                                <CardDescription>Completează toate câmpurile pentru a crea contul</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {error && (
                                    <Alert variant="destructive" className="mb-6">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                    <div>
                                        <Label htmlFor="firstName">
                                            Prenume <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={(e) =>
                                                setFormDataAction((prev: any) => ({ ...prev, firstName: e.target.value }))
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName">
                                            Nume <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={(e) =>
                                                setFormDataAction((prev: any) => ({ ...prev, lastName: e.target.value }))
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <Label htmlFor="email">
                                        Email <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormDataAction((prev: any) => ({ ...prev, email: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <Label htmlFor="role">
                                            Rol <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value) => setFormDataAction((prev: any) => ({ ...prev, role: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CLIENT">Client</SelectItem>
                                                <SelectItem value="PROVIDER">Prestator</SelectItem>
                                                <SelectItem value="ADMIN">Administrator</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="phone">
                                            Telefon <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormDataAction((prev: any) => ({ ...prev, phone: e.target.value }))}
                                            placeholder="+40 123 456 789"
                                        />
                                    </div>
                                </div>

                                <Accordion type="single" collapsible>
                                    <AccordionItem value="password">
                                        <Card>
                                            <CardHeader className="p-4">
                                                <AccordionTrigger className="w-full">
                                                    <CardTitle className="flex items-center space-x-2">
                                                        <Eye className="w-5 h-5" />
                                                        <span>Modifică Parola</span>
                                                    </CardTitle>
                                                </AccordionTrigger>
                                                <CardDescription className="mt-1">
                                                    Lasă câmpurile goale pentru a nu modifica parola
                                                </CardDescription>
                                            </CardHeader>
                                            <AccordionContent>
                                                <CardContent className="space-y-4">
                                                    <div className="relative">
                                                        <Label htmlFor="password">Parola</Label>
                                                        <Input
                                                            id="password"
                                                            type={showPassword ? 'text' : 'password'}
                                                            value={formData.password}
                                                            onChange={(e) =>
                                                                setFormDataAction((prev: any) => ({ ...prev, password: e.target.value }))
                                                            }
                                                            minLength={6}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword((prev) => !prev)}
                                                            className="absolute right-3 top-9 text-muted-foreground"
                                                            tabIndex={-1}
                                                        >
                                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                    <div className="relative">
                                                        <Label htmlFor="confirm_password">Confirmă Parola</Label>
                                                        <Input
                                                            id="confirm_password"
                                                            type={showConfirmPassword ? 'text' : 'password'}
                                                            value={formData.confirm_password ?? ''}
                                                            onChange={(e) =>
                                                                setFormDataAction((prev: any) => ({ ...prev, confirm_password: e.target.value }))
                                                            }
                                                            minLength={6}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                                            className="absolute right-3 top-9 text-muted-foreground"
                                                            tabIndex={-1}
                                                        >
                                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </CardContent>
                                            </AccordionContent>
                                        </Card>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side */}
                    <div className="space-y-8">
                        <Card>
                            <CardContent>
                                <div className="pt-6">
                                    <Button type="submit" disabled={loading} className="w-full">
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Se modifică...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Salvează Administrator
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Permissions Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Icon icon="mdi:identification-card-outline" className="w-5 h-5" />
                                    <span>Permisiuni</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Dialog open={permissionModalOpen} onOpenChange={setPermissionModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">Editează Permisiunile</Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Selectează Permisiunile</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                            {permissions.map((group: any) => (
                                                <div key={group.id}>
                                                    <h4 className="font-semibold mb-2">{group.name}</h4>
                                                    <div className="grid gap-3 border p-4 rounded-md bg-muted/30">
                                                        {group.permissions.map((perm: any) => (
                                                            <div key={perm.id} className="flex items-center justify-between gap-4">
                                                                <label className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!selectedPermissions[perm.slug]}
                                                                        onChange={() => togglePermission(perm)}
                                                                    />
                                                                    <span>{perm.name}</span>
                                                                </label>
                                                                {selectedPermissions[perm.slug] && (
                                                                    <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                      {selectedPermissions[perm.slug].allowed ? 'Allow' : 'Deny'}
                                    </span>
                                                                        <Switch
                                                                            checked={selectedPermissions[perm.slug].allowed}
                                                                            onCheckedChange={() => toggleAllowDeny(perm.slug)}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                {/* Preview Selected Permissions */}
                                <div className="space-y-2">
                                    {Object.entries(formData.user_permissions || {}).length === 0 ? (
                                        <p className="text-muted-foreground text-sm">Nicio permisiune selectată.</p>
                                    ) : (
                                        Object.entries(formData.user_permissions || {}).map(([slug, value]: any) => (
                                            <div key={slug} className="flex items-center justify-between border p-2 rounded-md bg-muted/50">
                                                <span className="text-sm font-medium">{value.name}</span>
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                                        value.allowed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                                    }`}
                                                >
                          {value.allowed ? 'Allow' : 'Deny'}
                        </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}
