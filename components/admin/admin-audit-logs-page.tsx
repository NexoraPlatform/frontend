"use client";

import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import AuditLogsTable from "@/components/AuditLogsTable";
import { useTranslations } from "next-intl";

export function AdminAuditLogsPage() {
  const t = useTranslations();

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={t("admin.audit_logs.manage_title")}
          description={t("admin.audit_logs.manage_subtitle")}
        />

        <AuditLogsTable />
      </div>
    </ProjectAdminShell>
  );
}
