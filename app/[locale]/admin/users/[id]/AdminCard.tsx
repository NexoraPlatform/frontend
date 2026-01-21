'use client';

import { Link } from '@/lib/navigation';
import {AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, UserPlus, Verified} from 'lucide-react';
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
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import { useTranslations } from 'next-intl';

type PermissionState = {
    [slug: string]: { id: number; name: string; allowed: boolean };
};

export default function AdminCard({
  formData,
  setFormDataAction,
  permissions,
  submitAction, // <- submit comes from parent
  loading = false, // <- UI state from parent
  error = '',
}: {
  formData: any;
  setFormDataAction: React.Dispatch<React.SetStateAction<any>>;
  permissions: any[];
  submitAction: (e: React.FormEvent) => Promise<void>;
  loading?: boolean;
  error?: string;
}) {
    const t = useTranslations();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [permissionModalOpen, setPermissionModalOpen] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<PermissionState>({});
    const hasInitializedPermissions = useRef(false);
    const editAdminTitleTemplate = t('admin.users.edit.admin.title');
    const editAdminSubtitle = t('admin.users.edit.admin.subtitle');
    const adminInfoTitle = t('admin.users.edit.admin.info_title');
    const adminInfoDescription = t('admin.users.edit.admin.info_description');
    const firstNameLabel = t('admin.users.edit.admin.first_name_label');
    const lastNameLabel = t('admin.users.edit.admin.last_name_label');
    const emailLabel = t('admin.users.edit.admin.email_label');
    const roleLabel = t('admin.users.edit.admin.role_label');
    const phoneLabel = t('admin.users.edit.admin.phone_label');
    const roleClient = t('admin.users.roles.CLIENT');
    const roleProvider = t('admin.users.roles.PROVIDER');
    const roleAdmin = t('admin.users.roles.ADMIN');
    const changePassword = t('admin.users.edit.admin.change_password');
    const passwordOptional = t('admin.users.edit.admin.password_optional');
    const passwordLabel = t('admin.users.edit.admin.password_label');
    const confirmPasswordLabel = t('admin.users.edit.admin.confirm_password_label');
    const savingLabel = t('admin.users.edit.admin.saving');
    const saveAdminLabel = t('admin.users.edit.admin.save_admin');
    const permissionsLabel = t('admin.users.edit.admin.permissions');
    const editPermissionsLabel = t('admin.users.edit.admin.edit_permissions');
    const selectPermissionsLabel = t('admin.users.edit.admin.select_permissions');
    const noPermissionsSelected = t('admin.users.edit.admin.no_permission_selected');
    const allowLabel = t('admin.users.edit.admin.allow');
    const denyLabel = t('admin.users.edit.admin.deny');

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
//user?.roles?.some((r: any) => r.slug?.toLowerCase() === 'admin')

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
                        {editAdminTitleTemplate.replace('{name}', `${formData.firstName} ${formData.lastName}`)}
                    </h1>
                    <p className="text-muted-foreground">{editAdminSubtitle}</p>
                </div>
            </div>

            <form onSubmit={submitAction} className="space-y-6">
                <div className="grid xs:grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8">
                    {/* Left Side */}
                    <div>
                        <div className="relative mb-5">
                            <Avatar className="w-28 h-28 border-4 border-white shadow-lg">
                                <AvatarImage src={formData.avatar} />
                                <AvatarFallback className="text-2xl">
                                    {formData.firstName[0]}
                                    {formData.lastName[0]}
                                </AvatarFallback>
                            </Avatar>

                            {(formData.callVerified && formData.testVerified) && (
                                <div className="absolute left-[9%] top-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white">
                                    <Verified className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <UserPlus className="w-5 h-5" />
                                    <span>{adminInfoTitle}</span>
                                </CardTitle>
                                <CardDescription>{adminInfoDescription}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {error && (
                                    <Alert variant="destructive" className="mb-6">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                    <div>
                                        <Label htmlFor="firstName">{firstNameLabel}</Label>
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
                                        <Label htmlFor="lastName">{lastNameLabel}</Label>
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
                                    <Label htmlFor="email">{emailLabel}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormDataAction((prev: any) => ({ ...prev, email: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <Label htmlFor="role">{roleLabel}</Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value) => setFormDataAction((prev: any) => ({ ...prev, role: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                            <SelectItem value="CLIENT">{roleClient}</SelectItem>
                                            <SelectItem value="PROVIDER">{roleProvider}</SelectItem>
                                            <SelectItem value="ADMIN">{roleAdmin}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                    <div>
                                        <Label htmlFor="phone">{phoneLabel}</Label>
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
                                                        <span>{changePassword}</span>
                                                    </CardTitle>
                                                </AccordionTrigger>
                                                <CardDescription className="mt-1">
                                                    {passwordOptional}
                                                </CardDescription>
                                            </CardHeader>
                                            <AccordionContent>
                                                <CardContent className="space-y-4">
                                                    <div className="relative">
                                                        <Label htmlFor="password">{passwordLabel}</Label>
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
                                                        <Label htmlFor="confirm_password">{confirmPasswordLabel}</Label>
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
                                                {savingLabel}
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                {saveAdminLabel}
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
                                    <span>{permissionsLabel}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Dialog open={permissionModalOpen} onOpenChange={setPermissionModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">{editPermissionsLabel}</Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>{selectPermissionsLabel}</DialogTitle>
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
                                      {selectedPermissions[perm.slug].allowed ? allowLabel : denyLabel}
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
                                        <p className="text-muted-foreground text-sm">{noPermissionsSelected}</p>
                                    ) : (
                                        Object.entries(formData.user_permissions || {}).map(([slug, value]: any) => (
                                            <div key={slug} className="flex items-center justify-between border p-2 rounded-md bg-muted/50">
                                                <span className="text-sm font-medium">{value.name}</span>
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                                        value.allowed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                                    }`}
                                                >
                          {value.allowed ? allowLabel : denyLabel}
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
