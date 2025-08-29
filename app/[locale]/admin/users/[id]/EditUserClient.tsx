"use client";

import React, { useEffect, useRef, useState } from "react";
import apiClient from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { usePathname } from "next/navigation";
import { useAsyncTranslation } from "@/hooks/use-async-translation";
import { Locale } from "@/types/locale";
import Link from "next/link";
import {
    AlertCircle,
    ArrowLeft,
    Eye,
    EyeOff,
    Loader2,
    UserPlus,
    Verified,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type PermissionState = {
    [slug: string]: { id: number; name: string; allowed: boolean };
};

type RoleOption = { id: number | string; name: string; slug: string };

export default function EditUserClient({ id }: { id: number }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const locale = (pathname.split("/")[1] as Locale) || "ro";

    // i18n
    const cannotEdit = useAsyncTranslation(locale, "admin.users.edit.cannot_edit");
    const passwordsNotMatch = useAsyncTranslation(locale, "admin.users.edit.passwords_not_match");
    const errorSaving = useAsyncTranslation(locale, "admin.users.edit.error_saving");
    const fetchUserErrorPrefix = useAsyncTranslation(locale, "admin.users.edit.fetch_user_error");
    const fetchPermErrorPrefix = useAsyncTranslation(locale, "admin.users.edit.fetch_permissions_error");

    const editAdminTitleTemplate = useAsyncTranslation(locale, "admin.users.edit.admin.title");
    const editAdminSubtitle = useAsyncTranslation(locale, "admin.users.edit.admin.subtitle");
    const adminInfoTitle = useAsyncTranslation(locale, "admin.users.edit.admin.info_title");
    const adminInfoDescription = useAsyncTranslation(locale, "admin.users.edit.admin.info_description");
    const firstNameLabel = useAsyncTranslation(locale, "admin.users.edit.admin.first_name_label");
    const lastNameLabel = useAsyncTranslation(locale, "admin.users.edit.admin.last_name_label");
    const emailLabel = useAsyncTranslation(locale, "admin.users.edit.admin.email_label");
    const roleLabel = useAsyncTranslation(locale, "admin.users.edit.admin.role_label");
    const phoneLabel = useAsyncTranslation(locale, "admin.users.edit.admin.phone_label");
    const roleClient = useAsyncTranslation(locale, "admin.users.roles.CLIENT");
    const roleProvider = useAsyncTranslation(locale, "admin.users.roles.PROVIDER");
    const roleAdmin = useAsyncTranslation(locale, "admin.users.roles.ADMIN");

    const changePassword = useAsyncTranslation(locale, "admin.users.edit.admin.change_password");
    const passwordOptional = useAsyncTranslation(locale, "admin.users.edit.admin.password_optional");
    const passwordLabel = useAsyncTranslation(locale, "admin.users.edit.admin.password_label");
    const confirmPasswordLabel = useAsyncTranslation(locale, "admin.users.edit.admin.confirm_password_label");
    const savingLabel = useAsyncTranslation(locale, "admin.users.edit.admin.saving");
    const saveAdminLabel = useAsyncTranslation(locale, "admin.users.edit.admin.save_admin");

    const permissionsLabel = useAsyncTranslation(locale, "admin.users.edit.admin.permissions");
    const editPermissionsLabel = useAsyncTranslation(locale, "admin.users.edit.admin.edit_permissions");
    const selectPermissionsLabel = useAsyncTranslation(locale, "admin.users.edit.admin.select_permissions");
    const noPermissionsSelected = useAsyncTranslation(locale, "admin.users.edit.admin.no_permission_selected");
    const allowLabel = useAsyncTranslation(locale, "admin.users.edit.admin.allow");
    const denyLabel = useAsyncTranslation(locale, "admin.users.edit.admin.deny");

    // form state — fără `role`, folosim DOAR `roles: string[]` (SLUG-URI)
    const [formData, setFormData] = useState<any>({
        avatar: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirm_password: "",
        roles: [] as string[], // doar SLUG-uri (ex: ["ADMIN", "PROVIDER"])
        phone: "",
        is_superuser: false,
        testVerified: false,
        callVerified: false,
        stripe_account_id: "",
        location: "",
        user_permissions: {},
    });

    const [permissions, setPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [permissionModalOpen, setPermissionModalOpen] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<PermissionState>({});
    const hasInitializedPermissions = useRef(false);
    const [userRoles, setUserRoles] = useState<RoleOption[]>([]);

    // ------- helpers pentru roluri (normalizare la slug) -------
    const toSlug = (ref: string | number, options: RoleOption[]) => {
        if (ref == null) return "";
        // dacă e numeric (id), mapează la slug
        const asNum = Number(ref);
        const isNumeric = !Number.isNaN(asNum) && String(asNum) === String(ref);
        if (isNumeric) {
            const found = options.find((o) => String(o.id) === String(ref));
            return (found?.slug || "").toUpperCase();
        }
        // altfel presupunem string (slug/name)
        return String(ref).toUpperCase();
    };

    const asSlugList = (roles: any[], options: RoleOption[]) =>
        (roles ?? [])
            .map((r) =>
                typeof r === "string"
                    ? r.toUpperCase()
                    : toSlug(r?.slug ?? r?.id ?? r, options)
            )
            .filter(Boolean);

    const hasRole = (ref: string | number) => {
        const current = asSlugList(formData.roles as any[], userRoles);
        const want = toSlug(ref, userRoles);
        return current.includes(want);
    };

    const toggleRole = (ref: string | number) => {
        const want = toSlug(ref, userRoles);
        if (!want) return;

        setFormData((prev: any) => {
            const current = asSlugList(prev.roles as any[], userRoles);
            const next = current.includes(want)
                ? current.filter((s) => s !== want)
                : [...current, want];
            return { ...prev, roles: next }; // păstrăm DOAR SLUG-uri
        });
    };

    // ------- fetch roles list (id, name, slug) -------
    useEffect(() => {
        const getUserRoles = async () => {
            try {
                const response = await apiClient.getRolesLite(); // [{id, name, slug}, ...]
                setUserRoles(response || []);
            } catch {
                setUserRoles([]);
            }
        };
        getUserRoles();
    }, []);

    // inițializează selectedPermissions din formData.user_permissions
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
                    allowed: effect === "allow",
                };
            });
        } else if (typeof formData.user_permissions === "object") {
            Object.assign(mapped, formData.user_permissions);
        }

        setSelectedPermissions(mapped);
        hasInitializedPermissions.current = true;
    }, [formData.user_permissions]);

    // fetch user + permissions
    useEffect(() => {
        const getUser = async () => {
            try {
                const response = await apiClient.getUserById(id);

                // normalizează roles din răspuns la SLUG-uri
                const rolesFromApi = Array.isArray((response as any).roles)
                    ? (response as any).roles.map((r: any) =>
                        String(r?.slug || r?.name || r).toUpperCase()
                    )
                    : (response as any).role
                        ? [String((response as any).role).toUpperCase()]
                        : [];

                setFormData((prev: any) => ({
                    ...prev,
                    ...response,
                    roles: rolesFromApi,
                }));
            } catch (error: any) {
                alert(fetchUserErrorPrefix + error.message);
            }
        };

        const getPermissions = async () => {
            try {
                const response = await apiClient.getPermissions();
                setPermissions(response);
            } catch (error: any) {
                alert(fetchPermErrorPrefix + error.message);
            }
        };

        getUser();
        getPermissions();
    }, [fetchPermErrorPrefix, fetchUserErrorPrefix, id]);

    // protecție: superuser non-#1 nu poate edita user #1
    if (!!user?.is_superuser) {
        if (Number(user?.id) !== 1 && Number(id) === 1) return <div>{cannotEdit}</div>;
    }

    const submitAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (formData.password && formData.password.length > 0) {
            if (formData.password !== formData.confirm_password) {
                setError(passwordsNotMatch);
                setLoading(false);
                return;
            }
        }

        try {
            const {
                firstName,
                lastName,
                email,
                phone,
                password,
                roles,
            } = formData;

            // roles deja e listă de SLUG-uri
            const payload: any = {
                firstName,
                lastName,
                email,
                phone,
                roles: Array.isArray(roles) ? roles : [],
            };

            if (password && password.length > 0) {
                payload.password = password;
            }

            await apiClient.updateUser(id, payload);

            // golim parolele local după succes
            setFormData((prev: any) => ({
                ...prev,
                password: "",
                confirm_password: "",
            }));
        } catch (e: any) {
            setError(e?.message ?? errorSaving);
        } finally {
            setLoading(false);
        }
    };

    // toggle adăugare/eliminare permisiune
    const togglePermission = async (perm: any) => {
        const userId = formData?.id ?? id;
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
        setFormData((prev: any) => ({ ...prev, user_permissions: nextSelected }));

        try {
            if (exists) {
                await apiClient.denyUserPermission(userId, perm.slug);
            } else {
                await apiClient.allowUserPermission(userId, perm.slug);
            }
        } catch {
            // rollback
            setSelectedPermissions(prevSelected);
            setFormData((prev: any) => ({ ...prev, user_permissions: prevSelected }));
        }
    };

    // toggle allow/deny pe o permisiune
    const toggleAllowDeny = async (slug: string) => {
        const userId = formData?.id ?? id;
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
        setFormData((prev: any) => ({ ...prev, user_permissions: nextSelected }));

        try {
            if (updatedAllowed) {
                await apiClient.allowUserPermission(userId, slug);
            } else {
                await apiClient.denyUserPermission(userId, slug);
            }
        } catch {
            // rollback
            setSelectedPermissions(prevSelected);
            setFormData((prev: any) => ({ ...prev, user_permissions: prevSelected }));
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
                        {editAdminTitleTemplate.replace(
                            "{name}",
                            `${formData.firstName ?? ""} ${formData.lastName ?? ""}`.trim()
                        )}
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
                                    {(formData.firstName?.[0] ?? "?")}{formData.lastName?.[0] ?? ""}
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
                                            value={formData.firstName ?? ""}
                                            onChange={(e) =>
                                                setFormData((prev: any) => ({
                                                    ...prev,
                                                    firstName: e.target.value,
                                                }))
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName">{lastNameLabel}</Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName ?? ""}
                                            onChange={(e) =>
                                                setFormData((prev: any) => ({
                                                    ...prev,
                                                    lastName: e.target.value,
                                                }))
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
                                        value={formData.email ?? ""}
                                        onChange={(e) =>
                                            setFormData((prev: any) => ({
                                                ...prev,
                                                email: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </div>

                                <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <Label htmlFor="phone">{phoneLabel}</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone ?? ""}
                                            onChange={(e) =>
                                                setFormData((prev: any) => ({
                                                    ...prev,
                                                    phone: e.target.value,
                                                }))
                                            }
                                            placeholder="+40 123 456 789"
                                        />
                                    </div>
                                </div>

                                {/* MULTI-ROLES */}
                                <div className="mb-5">
                                    <Label>{roleLabel}</Label>
                                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                                        {userRoles.map((opt) => (
                                            <label
                                                key={opt.id}
                                                className="flex items-center justify-center gap-2 rounded-md border p-2"
                                            >
                                                <Checkbox
                                                    id={`role-${opt.id}`}
                                                    checked={hasRole(opt.slug)}          // verific slug
                                                    onCheckedChange={() => toggleRole(opt.slug)} // toggle pe slug
                                                />
                                                <span>{opt.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Change password */}
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
                                                            type={showPassword ? "text" : "password"}
                                                            value={formData.password}
                                                            onChange={(e) =>
                                                                setFormData((prev: any) => ({ ...prev, password: e.target.value }))
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
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            value={formData.confirm_password ?? ""}
                                                            onChange={(e) =>
                                                                setFormData((prev: any) => ({ ...prev, confirm_password: e.target.value }))
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
                                                                    <div className="flex flex-col">
                                                                        <span>{perm.name}</span>
                                                                        {perm.description && (<span className="text-xs">({perm.description})</span>)}
                                                                    </div>
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
                                                        value.allowed ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
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
