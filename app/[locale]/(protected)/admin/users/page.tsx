"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Ban,
  CheckCircle,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Can } from "@/components/Can";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import {
  AdminTableEmptyRow,
  AdminTableLoadingRow,
} from "@/components/admin/admin-state";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminUsers } from "@/hooks/use-api";
import apiClient from "@/lib/api";
import { Link, useRouter } from "@/lib/navigation";

type AdminUser = {
  id: string | number;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string | null;
  created_at?: string;
  isVerified?: boolean;
  is_superuser?: boolean;
  profile_url?: string;
  role?: string;
  status?: string;
  rating?: number;
  reviewCount?: number;
  roles?: Array<{ slug?: string; name?: string } | string>;
};

function getRoleSlugs(user: AdminUser): string[] {
  const roles = Array.isArray(user.roles)
    ? user.roles
        .map((role) =>
          String(typeof role === "string" ? role : role?.slug ?? role?.name ?? "").toUpperCase()
        )
        .filter(Boolean)
    : [];

  if (roles.length > 0) {
    return roles;
  }

  return user.role ? [String(user.role).toUpperCase()] : [];
}

function getUserInitials(user: AdminUser) {
  const first = user.firstName?.[0] ?? "";
  const last = user.lastName?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "US";
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useAdminUsers();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();

  const manageTitle = t("admin.users.manage_title");
  const manageSubtitle = t("admin.users.manage_subtitle");
  const addUser = t("admin.users.add_user");
  const searchPlaceholder = t("admin.users.search_placeholder");
  const filterRole = t("admin.users.filter_role");
  const filterAll = t("admin.users.filter_all");
  const filterClients = t("admin.users.filter_clients");
  const filterProviders = t("admin.users.filter_providers");
  const filterAdmins = t("admin.users.filter_admins");
  const listTitle = t("admin.users.list_title");
  const confirmDeleteText = t("admin.users.actions.confirm_delete");
  const errorPrefix = t("admin.users.actions.error_prefix");
  const modifyProfile = t("admin.users.actions.modify_profile");
  const viewProfile = t("admin.users.actions.view_profile");
  const verifyLabel = t("admin.users.actions.verify");
  const suspendLabel = t("admin.users.actions.suspend");
  const activateLabel = t("admin.users.actions.activate");
  const deleteLabel = t("admin.users.actions.delete");
  const setSuperuser = t("admin.users.actions.set_superuser");
  const removeSuperuser = t("admin.users.actions.remove_superuser");
  const noUsersTitle = t("admin.users.no_users_title");
  const noUsersDescription = t("admin.users.no_users_description");
  const superuserBadge = t("admin.users.roles.SUPERUSER");

  const statusLabels = {
    ACTIVE: t("admin.users.statuses.ACTIVE"),
    SUSPENDED: t("admin.users.statuses.SUSPENDED"),
    PENDING_VERIFICATION: t("admin.users.statuses.PENDING_VERIFICATION"),
  } as const;

  const roleLabels = {
    ADMIN: t("admin.users.roles.ADMIN"),
    PROVIDER: t("admin.users.roles.PROVIDER"),
    CLIENT: t("admin.users.roles.CLIENT"),
  } as const;

  const users: AdminUser[] = Array.isArray(usersData?.users) ? usersData.users : [];

  const handleUserAction = async (userId: string | number, action: string, isSuperuser?: boolean) => {
    try {
      if (action === "delete") {
        if (confirm(confirmDeleteText)) {
          await apiClient.deleteUser(String(userId));
          refetchUsers();
        }
      } else if (action === "superuser") {
        if (isSuperuser === false) {
          await apiClient.setSuperadmin(userId);
        } else {
          await apiClient.removeSuperadmin(userId);
        }
        refetchUsers();
      } else {
        await apiClient.updateUserStatus(String(userId), action);
        refetchUsers();
      }
    } catch (error: any) {
      alert(errorPrefix + error.message);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = [user.firstName, user.lastName, user.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase()));

      const roles = getRoleSlugs(user);
      const matchesFilter = userFilter === "all" || roles.includes(userFilter);

      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, userFilter]);

  const getStatusBadge = (status?: string) => {
    const safeStatus = String(status ?? "ACTIVE").toUpperCase();
    const label = statusLabels[safeStatus as keyof typeof statusLabels] || safeStatus;
    const className =
      safeStatus === "ACTIVE"
        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
        : safeStatus === "SUSPENDED"
          ? "bg-destructive/20 text-destructive"
          : "bg-amber-500/20 text-amber-600 dark:text-amber-400";

    return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${className}`}>{label}</span>;
  };

  const getRoleBadge = (role: string) => {
    const label = roleLabels[role as keyof typeof roleLabels] || role;
    const className =
      role === "ADMIN"
        ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
        : role === "PROVIDER"
          ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
          : "bg-muted text-muted-foreground";

    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={manageTitle}
          description={manageSubtitle}
          action={
            <Link href="/admin/users/new">
              <Button className="bg-primary text-white hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                {addUser}
              </Button>
            </Link>
          }
        />

        <AdminSectionCard
          delay={0.2}
          title={listTitle}
          description={t("admin.users.list_description", { count: filteredUsers.length })}
        >
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
            <AdminSearchInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
            />

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="h-11 w-full border-border bg-transparent lg:w-56">
                <SelectValue placeholder={filterRole} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{filterAll}</SelectItem>
                <SelectItem value="CLIENT">{filterClients}</SelectItem>
                <SelectItem value="PROVIDER">{filterProviders}</SelectItem>
                <SelectItem value="ADMIN">{filterAdmins}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.users.table.user")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.users.table.email")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.users.table.role")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.users.table.status")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.users.table.registered")}
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-muted-foreground">
                    {t("admin.users.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <AdminTableLoadingRow colSpan={6} />
                ) : filteredUsers.length === 0 ? (
                  <AdminTableEmptyRow
                    colSpan={6}
                    icon={Users}
                    title={noUsersTitle}
                    description={noUsersDescription}
                  />
                ) : (
                  filteredUsers.map((user, index) => {
                    const roles = getRoleSlugs(user);
                    const registeredAt = user.created_at
                      ? new Date(user.created_at).toLocaleDateString(locale.startsWith("ro") ? "ro-RO" : "en-US")
                      : "-";

                    return (
                      <motion.tr
                        key={String(user.id)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                        className="group border-b border-border/50 transition-colors hover:bg-secondary/30"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar ?? undefined} />
                              <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email}
                                </p>
                                {user.isVerified ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : null}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t("admin.users.reviews_label", { count: user.reviewCount || 0 })}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {roles.length > 0 ? roles.map((role) => (
                              <span key={`${user.id}-${role}`}>{getRoleBadge(role)}</span>
                            )) : <Badge className="bg-muted text-muted-foreground">-</Badge>}
                            {user.is_superuser ? (
                              <Badge className="bg-red-500/15 text-red-600 dark:text-red-400">{superuserBadge}</Badge>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(user.status)}</td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          <div>
                            <p>{registeredAt}</p>
                            <p className="mt-1 text-xs">
                              {typeof user.rating === "number" ? `${user.rating.toFixed(1)} / 5` : "0 / 5"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-70 transition-opacity group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              {String(user.id) !== "1" ? (
                                <Can superuser>
                                  <DropdownMenuItem
                                    onClick={() => handleUserAction(user.id, "superuser", user.is_superuser)}
                                  >
                                    <UserRound className="mr-2 h-4 w-4" />
                                    {user.is_superuser ? removeSuperuser : setSuperuser}
                                  </DropdownMenuItem>
                                </Can>
                              ) : null}

                              <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                {modifyProfile}
                              </DropdownMenuItem>

                              {roles.includes("PROVIDER") && user.profile_url ? (
                                <DropdownMenuItem onClick={() => router.push(`/provider/${user.profile_url}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {viewProfile}
                                </DropdownMenuItem>
                              ) : null}

                              <DropdownMenuItem onClick={() => handleUserAction(user.id, "verify")}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                {verifyLabel}
                              </DropdownMenuItem>

                              {String(user.status).toUpperCase() === "ACTIVE" ? (
                                <DropdownMenuItem onClick={() => handleUserAction(user.id, "suspend")}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  {suspendLabel}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUserAction(user.id, "activate")}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  {activateLabel}
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => handleUserAction(user.id, "delete")}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {deleteLabel}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </AdminSectionCard>
      </div>
    </ProjectAdminShell>
  );
}
