"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import apiClient from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  UserCog,
  Verified,
} from "lucide-react";

import { AdminOverviewItem, AdminSidebarCard } from "@/components/admin/admin-sidebar-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type PermissionState = {
  [slug: string]: { id: number; name: string; allowed: boolean };
};

function normalizePermissions(input: any): PermissionState {
  if (!input) return {};
  if (!Array.isArray(input) && typeof input === "object") return input as PermissionState;

  const out: PermissionState = {};
  for (const permission of input as any[]) {
    if (!permission?.slug) continue;
    out[permission.slug] = {
      id: Number(permission.id),
      name: String(permission.name ?? permission.slug),
      allowed: String(permission?.pivot?.effect || "").toLowerCase() === "allow",
    };
  }
  return out;
}

type RoleOption = { id: number | string; name: string; slug: string };

export default function EditUserClient({ id }: { id: number }) {
  const { user } = useAuth();
  const t = useTranslations();

  const cannotEdit = t("admin.users.edit.cannot_edit");
  const passwordsNotMatch = t("admin.users.edit.passwords_not_match");
  const errorSaving = t("admin.users.edit.error_saving");
  const fetchUserErrorPrefix = t("admin.users.edit.fetch_user_error");
  const fetchPermErrorPrefix = t("admin.users.edit.fetch_permissions_error");

  const editAdminTitleTemplate = t("admin.users.edit.admin.title");
  const editAdminSubtitle = t("admin.users.edit.admin.subtitle");
  const adminInfoTitle = t("admin.users.edit.admin.info_title");
  const adminInfoDescription = t("admin.users.edit.admin.info_description");
  const firstNameLabel = t("admin.users.edit.admin.first_name_label");
  const lastNameLabel = t("admin.users.edit.admin.last_name_label");
  const emailLabel = t("admin.users.edit.admin.email_label");
  const roleLabel = t("admin.users.edit.admin.role_label");
  const phoneLabel = t("admin.users.edit.admin.phone_label");

  const changePassword = t("admin.users.edit.admin.change_password");
  const passwordOptional = t("admin.users.edit.admin.password_optional");
  const passwordLabel = t("admin.users.edit.admin.password_label");
  const confirmPasswordLabel = t("admin.users.edit.admin.confirm_password_label");
  const savingLabel = t("admin.users.edit.admin.saving");
  const saveAdminLabel = t("admin.users.edit.admin.save_admin");

  const permissionsLabel = t("admin.users.edit.admin.permissions");
  const editPermissionsLabel = t("admin.users.edit.admin.edit_permissions");
  const selectPermissionsLabel = t("admin.users.edit.admin.select_permissions");
  const noPermissionsSelected = t("admin.users.edit.admin.no_permission_selected");
  const allowLabel = t("admin.users.edit.admin.allow");
  const denyLabel = t("admin.users.edit.admin.deny");
  const superuserLabel = t("admin.users.roles.SUPERUSER");

  const [formData, setFormData] = useState<any>({
    avatar: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm_password: "",
    roles: [] as string[],
    phone: "",
    is_superuser: false,
    testVerified: false,
    callVerified: false,
    user_permissions: {},
  });

  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionState>({});
  const [userRoles, setUserRoles] = useState<RoleOption[]>([]);

  const toSlug = (ref: string | number, options: RoleOption[]) => {
    if (ref == null) return "";
    const asNum = Number(ref);
    const isNumeric = !Number.isNaN(asNum) && String(asNum) === String(ref);
    if (isNumeric) {
      const found = options.find((option) => String(option.id) === String(ref));
      return (found?.slug || "").toUpperCase();
    }
    return String(ref).toUpperCase();
  };

  const asSlugList = (roles: any[], options: RoleOption[]) =>
    (roles ?? [])
      .map((role) =>
        typeof role === "string"
          ? role.toUpperCase()
          : toSlug(role?.slug ?? role?.id ?? role, options)
      )
      .filter(Boolean);

  const hasRole = (ref: string | number) => {
    const current = asSlugList(formData.roles as any[], userRoles);
    const wanted = toSlug(ref, userRoles);
    return current.includes(wanted);
  };

  const toggleRole = (ref: string | number) => {
    const wanted = toSlug(ref, userRoles);
    if (!wanted) return;

    setFormData((prev: any) => {
      const current = asSlugList(prev.roles as any[], userRoles);
      const next = current.includes(wanted) ? [] : [wanted];
      return { ...prev, roles: next };
    });
  };

  useEffect(() => {
    const getUserRoles = async () => {
      try {
        const response = await apiClient.getRolesLite();
        setUserRoles(response || []);
      } catch {
        setUserRoles([]);
      }
    };
    void getUserRoles();
  }, []);

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await apiClient.getUserById(id);

        const rolesFromApi = Array.isArray((response as any).roles)
          ? (response as any).roles.map((role: any) =>
              String(role?.slug || role?.name || role).toUpperCase()
            )
          : (response as any).role
            ? [String((response as any).role).toUpperCase()]
            : [];

        const mappedPerms = normalizePermissions((response as any).user_permissions);

        setFormData((prev: any) => ({
          ...prev,
          ...response,
          roles: rolesFromApi.slice(0, 1),
          user_permissions: mappedPerms,
        }));

        setSelectedPermissions(mappedPerms);
      } catch (nextError: any) {
        alert(fetchUserErrorPrefix + nextError.message);
      }
    };

    const getPermissions = async () => {
      try {
        const response = await apiClient.getPermissions();
        setPermissions(response);
      } catch (nextError: any) {
        alert(fetchPermErrorPrefix + nextError.message);
      }
    };

    void getUser();
    void getPermissions();
  }, [fetchPermErrorPrefix, fetchUserErrorPrefix, id]);

  if (!!user?.is_superuser && Number(user?.id) !== 1 && Number(id) === 1) {
    return (
      <ProjectAdminShell>
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="glass-effect rounded-2xl border border-border p-6">
            <p>{cannotEdit}</p>
          </div>
        </div>
      </ProjectAdminShell>
    );
  }

  const submitAction = async (event: React.FormEvent) => {
    event.preventDefault();
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
      const { firstName, lastName, email, phone, password, roles } = formData;
      const selectedRole = asSlugList(roles, userRoles)[0];

      const payload: any = {
        firstName,
        lastName,
        email,
        phone,
        ...(selectedRole ? { role: selectedRole } : {}),
      };

      if (password && password.length > 0) {
        payload.password = password;
        payload.password_confirmation = formData.confirm_password;
      }

      await apiClient.updateUser(id, payload);

      setFormData((prev: any) => ({
        ...prev,
        password: "",
        confirm_password: "",
      }));
    } catch (nextError: any) {
      setError(nextError?.message ?? errorSaving);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (permission: any) => {
    const userId = formData?.id ?? id;
    if (!userId) return;

    const exists = !!selectedPermissions[permission.slug];

    if (exists) {
      const prevSelected = selectedPermissions;
      const nextSelected = { ...selectedPermissions };
      delete nextSelected[permission.slug];

      setSelectedPermissions(nextSelected);
      setFormData((prev: any) => ({ ...prev, user_permissions: nextSelected }));

      try {
        await apiClient.removeUserPermission(userId, permission.slug);
      } catch {
        setSelectedPermissions(prevSelected);
        setFormData((prev: any) => ({ ...prev, user_permissions: prevSelected }));
      }
    } else {
      const prevSelected = selectedPermissions;
      const nextSelected = {
        ...selectedPermissions,
        [permission.slug]: { id: permission.id, name: permission.name, allowed: true },
      };

      setSelectedPermissions(nextSelected);
      setFormData((prev: any) => ({ ...prev, user_permissions: nextSelected }));

      try {
        await apiClient.allowUserPermission(userId, permission.slug);
      } catch {
        setSelectedPermissions(prevSelected);
        setFormData((prev: any) => ({ ...prev, user_permissions: prevSelected }));
      }
    }
  };

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
      setSelectedPermissions(prevSelected);
      setFormData((prev: any) => ({ ...prev, user_permissions: prevSelected }));
    }
  };

  const selectedRole = asSlugList(formData.roles as any[], userRoles)[0] ?? "-";
  const selectedRoleName =
    userRoles.find((role) => role.slug?.toUpperCase() === selectedRole)?.name ?? selectedRole;
  const isFullyVerified = Boolean(formData.callVerified && formData.testVerified);
  const permissionCount = Object.keys(formData.user_permissions || {}).length;

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={editAdminTitleTemplate.replace(
            "{name}",
            `${formData.firstName ?? ""} ${formData.lastName ?? ""}`.trim()
          )}
          description={editAdminSubtitle}
          backHref="/admin/users"
        />

        <form onSubmit={submitAction} className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="glass-effect rounded-2xl border border-border p-6"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative">
                  <Avatar className="h-24 w-24 border border-border">
                    <AvatarImage src={formData.avatar || undefined} />
                    <AvatarFallback className="text-xl">
                      {(formData.firstName?.[0] ?? "?") + (formData.lastName?.[0] ?? "")}
                    </AvatarFallback>
                  </Avatar>

                  {isFullyVerified ? (
                    <div className="absolute -right-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-background bg-primary text-white">
                      <Verified className="h-4 w-4" />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold">
                    {`${formData.firstName ?? ""} ${formData.lastName ?? ""}`.trim() || formData.email || "-"}
                  </h2>
                  <p className="text-sm text-muted-foreground">{formData.email || "-"}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                      {selectedRoleName}
                    </span>
                    {formData.is_superuser ? (
                      <span className="inline-flex items-center rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400">
                        {superuserLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.div>

            <AdminSectionCard
              delay={0.2}
              title={adminInfoTitle}
              description={adminInfoDescription}
            >
              {error ? (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{firstNameLabel}</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName ?? ""}
                      onChange={(event) =>
                        setFormData((prev: any) => ({ ...prev, firstName: event.target.value }))
                      }
                      required
                      className="border-border bg-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">{lastNameLabel}</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName ?? ""}
                      onChange={(event) =>
                        setFormData((prev: any) => ({ ...prev, lastName: event.target.value }))
                      }
                      required
                      className="border-border bg-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{emailLabel}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email ?? ""}
                    onChange={(event) =>
                      setFormData((prev: any) => ({ ...prev, email: event.target.value }))
                    }
                    required
                    className="border-border bg-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{phoneLabel}</Label>
                  <Input
                    id="phone"
                    value={formData.phone ?? ""}
                    onChange={(event) =>
                      setFormData((prev: any) => ({ ...prev, phone: event.target.value }))
                    }
                    placeholder="+40 123 456 789"
                    className="border-border bg-transparent"
                  />
                </div>

                <div className="space-y-3">
                  <Label>{roleLabel}</Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {userRoles.map((option) => (
                      <label
                        key={String(option.id)}
                        className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 px-4 py-3"
                      >
                        <Checkbox
                          id={`role-${option.id}`}
                          checked={hasRole(option.slug)}
                          onCheckedChange={() => toggleRole(option.slug)}
                        />
                        <span className="text-sm font-medium">{option.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </AdminSectionCard>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              <Accordion type="single" collapsible defaultValue="password">
                <AccordionItem value="password" className="glass-effect rounded-2xl border border-border px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <KeyRound className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">{changePassword}</p>
                        <p className="text-sm font-normal text-muted-foreground">{passwordOptional}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="password">{passwordLabel}</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(event) =>
                              setFormData((prev: any) => ({ ...prev, password: event.target.value }))
                            }
                            minLength={8}
                            className="border-border bg-transparent pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm_password">{confirmPasswordLabel}</Label>
                        <div className="relative">
                          <Input
                            id="confirm_password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirm_password ?? ""}
                            onChange={(event) =>
                              setFormData((prev: any) => ({
                                ...prev,
                                confirm_password: event.target.value,
                              }))
                            }
                            minLength={8}
                            className="border-border bg-transparent pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          </div>

          <div className="space-y-6">
            <AdminSidebarCard
              delay={0.3}
              icon={UserCog}
              title={t("admin.users.edit.admin.overview_title")}
              description={t("admin.users.edit.admin.overview_description")}
            >
              <div className="space-y-4">
                <AdminOverviewItem
                  label={t("admin.users.edit.admin.selected_role")}
                  value={selectedRoleName}
                  valueClassName="mt-2 text-sm font-medium"
                />
                <AdminOverviewItem
                  label={t("admin.users.edit.admin.email_short")}
                  value={formData.email || "-"}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminOverviewItem
                    label={t("admin.users.edit.admin.verification_status")}
                    value={
                      isFullyVerified
                        ? t("admin.users.edit.admin.verification_complete")
                        : t("admin.users.edit.admin.verification_pending")
                    }
                  />
                  <AdminOverviewItem
                    label={t("admin.users.edit.admin.permission_overrides")}
                    value={permissionCount}
                  />
                </div>
              </div>

              <div className="mt-5">
                <Button type="submit" disabled={loading} className="w-full bg-primary text-white hover:bg-primary/90">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {savingLabel}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {saveAdminLabel}
                    </>
                  )}
                </Button>
              </div>
            </AdminSidebarCard>

            <AdminSectionCard
              delay={0.35}
              title={permissionsLabel}
              description={t("admin.users.edit.admin.permissions_description")}
            >
              <Dialog open={permissionModalOpen} onOpenChange={setPermissionModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mb-5 w-full border-border bg-transparent">
                    {editPermissionsLabel}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl border-border bg-background">
                  <DialogHeader>
                    <DialogTitle>{selectPermissionsLabel}</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                    {permissions.map((group: any) => (
                      <div key={group.id}>
                        <h4 className="mb-2 font-semibold">{group.name}</h4>
                        <div className="grid gap-3 rounded-xl border border-border bg-background/50 p-4">
                          {group.permissions.map((permission: any) => (
                            <div key={permission.id} className="flex items-center justify-between gap-4">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!selectedPermissions[permission.slug]}
                                  onChange={() => togglePermission(permission)}
                                />
                                <div className="flex flex-col">
                                  <span>{permission.name}</span>
                                  {permission.description ? (
                                    <span className="text-xs text-muted-foreground">({permission.description})</span>
                                  ) : null}
                                </div>
                              </label>

                              {selectedPermissions[permission.slug] ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {selectedPermissions[permission.slug].allowed ? allowLabel : denyLabel}
                                  </span>
                                  <Switch
                                    checked={selectedPermissions[permission.slug].allowed}
                                    onCheckedChange={() => toggleAllowDeny(permission.slug)}
                                  />
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-2">
                {Object.entries(formData.user_permissions || {}).length === 0 ? (
                  <p className="text-sm text-muted-foreground">{noPermissionsSelected}</p>
                ) : (
                  Object.entries(formData.user_permissions || {}).map(([slug, value]: any) => (
                    <div
                      key={slug}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-3"
                    >
                      <span className="text-sm font-medium">{value.name}</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          value.allowed
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {value.allowed ? allowLabel : denyLabel}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </AdminSectionCard>
          </div>
        </form>
      </div>
    </ProjectAdminShell>
  );
}
