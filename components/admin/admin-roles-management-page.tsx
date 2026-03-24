"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { IdCard, KeyRound, ListOrdered, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from "@/lib/api";
import { countPermissionsInGroups, normalizeRolesLite, type AdminRolePermissionGroup } from "@/lib/admin-roles";
import { Link, useRouter } from "@/lib/navigation";
import RolesListClient from "@/app/[locale]/(protected)/admin/roles/roles-list-client";

const PermissionMatrix = dynamic(
  () => import("@/app/[locale]/(protected)/admin/roles/PermissionMatrixTab"),
  { ssr: false }
);

type AdminRolesManagementPageProps = {
  initialTab?: "roles" | "permissions";
};

export function AdminRolesManagementPage({
  initialTab = "roles",
}: AdminRolesManagementPageProps) {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const [tab, setTab] = useState<"roles" | "permissions">(initialTab);
  const [roleCount, setRoleCount] = useState(0);
  const [permissionGroups, setPermissionGroups] = useState<AdminRolePermissionGroup[]>([]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      try {
        const [rolesResponse, permissionResponse] = await Promise.all([
          apiClient.getRolesLite(),
          apiClient.getPermissions(),
        ]);

        if (!active) return;

        setRoleCount(normalizeRolesLite(rolesResponse).length);
        setPermissionGroups(permissionResponse);
      } catch (error) {
        console.error("Failed to load role management stats", error);
        if (!active) return;
        setRoleCount(0);
        setPermissionGroups([]);
      }
    };

    void loadStats();

    return () => {
      active = false;
    };
  }, []);

  const permissionCount = useMemo(
    () => countPermissionsInGroups(permissionGroups),
    [permissionGroups]
  );

  const summaryCards = [
    {
      title: t("admin.roles.summary.cards.roles"),
      value: roleCount,
      icon: IdCard,
      color: "bg-gradient-to-br from-primary to-emerald-400",
    },
    {
      title: t("admin.roles.summary.cards.permission_groups"),
      value: permissionGroups.length,
      icon: ListOrdered,
      color: "bg-gradient-to-br from-blue-500 to-cyan-400",
    },
    {
      title: t("admin.roles.summary.cards.permissions"),
      value: permissionCount,
      icon: KeyRound,
      color: "bg-gradient-to-br from-amber-500 to-orange-400",
    },
    {
      title: t("admin.roles.summary.cards.sync"),
      value: t("admin.roles.summary.cards.sync_value"),
      icon: ShieldCheck,
      color: "bg-gradient-to-br from-purple-500 to-pink-400",
    },
  ];

  const headerTitle =
    tab === "roles"
      ? t("admin.roles.manage_title")
      : t("admin.roles.permission_matrix.title");
  const headerDescription =
    tab === "roles"
      ? t("admin.roles.manage_subtitle")
      : t("admin.roles.permission_matrix.subtitle");

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={headerTitle}
          description={headerDescription}
          action={
            tab === "roles" ? (
              <Link href="/admin/roles/new">
                <Button>{t("admin.roles.add_role")}</Button>
              </Link>
            ) : undefined
          }
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <AdminSummaryCard
              key={String(card.title)}
              title={card.title}
              value={card.value}
              icon={card.icon}
              colorClassName={card.color}
              delay={index * 0.08}
            />
          ))}
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) => {
            const nextTab = value as "roles" | "permissions";
            setTab(nextTab);
            router.push(nextTab === "roles" ? "/admin/roles" : "/admin/roles/permissions");
          }}
          className="space-y-6"
        >
          <TabsList className="rounded-full border border-border/60 bg-background/60 p-1 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
            <TabsTrigger value="roles" className="rounded-full px-4">
              {t("admin.roles.tabs.roles")}
            </TabsTrigger>
            <TabsTrigger value="permissions" className="rounded-full px-4">
              {t("admin.roles.tabs.permissions")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            <RolesListClient />
          </TabsContent>

          <TabsContent value="permissions">
            {tab === "permissions" ? (
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">
                    {t("admin.roles.permissions_tab_loading")}
                  </div>
                }
              >
                <PermissionMatrix locale={locale as any} />
              </Suspense>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </ProjectAdminShell>
  );
}
