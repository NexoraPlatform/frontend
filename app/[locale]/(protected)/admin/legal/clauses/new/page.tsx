"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminOverviewItem,
  AdminSidebarCard,
} from "@/components/admin/admin-sidebar-card";
import { LegalClauseEditorForm } from "@/components/admin/legal-clause-editor-form";
import { AdminSpinner } from "@/components/admin/admin-state";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { useAuth } from "@/contexts/auth-context";
import { checkRequirement } from "@/lib/access";
import { apiClient } from "@/lib/api";
import { useRouter } from "@/lib/navigation";

export default function NewLegalClausePage() {
  const { user, loading, userLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [identifier, setIdentifier] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = useMemo(
    () =>
      checkRequirement(user, {
        roles: ["admin", "legal"],
        permissions: ["legal.clauses.create"],
      }),
    [user]
  );

  useEffect(() => {
    if (userLoading) return;

    if (!canCreate) {
      router.replace(`/access-denied?from=${encodeURIComponent("/admin/legal/clauses/new")}`);
    }
  }, [canCreate, router, userLoading]);

  const handleContentChange = (language: string, value: string) => {
    setContent((previous) => ({ ...previous, [language]: value }));
  };

  const buildContentPayload = () =>
    Object.fromEntries(
      Object.entries(content)
        .map(([key, value]) => [key, value.trim()] as const)
        .filter(([, value]) => value.length > 0)
    );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedIdentifier = identifier.trim();
    const trimmedCategory = category.trim();
    const payloadContent = buildContentPayload();

    if (!trimmedIdentifier || !trimmedCategory || Object.keys(payloadContent).length === 0) {
      setError(t("admin.legal_clauses.errors.create_required"));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await apiClient.createAdminLegalClause({
        identifier: trimmedIdentifier,
        category: trimmedCategory,
        content: payloadContent,
      });
      router.push("/admin/legal/clauses");
    } catch (err: any) {
      setError(err?.message || t("admin.legal_clauses.errors.create_failed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || userLoading || !canCreate) {
    return (
      <ProjectAdminShell>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <AdminSpinner />
        </div>
      </ProjectAdminShell>
    );
  }

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          backHref="/admin/legal/clauses"
          title={t("admin.legal_clauses.create_title")}
          description={t("admin.legal_clauses.create_subtitle")}
        />

        <LegalClauseEditorForm
          mode="create"
          identifier={identifier}
          category={category}
          content={content}
          onIdentifierChange={setIdentifier}
          onCategoryChange={setCategory}
          onContentChange={handleContentChange}
          onSubmit={handleSubmit}
          cancelHref="/admin/legal/clauses"
          error={error}
          saving={saving}
          sidebar={
            <AdminSidebarCard
              icon={FileText}
              title={t("admin.legal_clauses.sidebar.create_title")}
              description={t("admin.legal_clauses.sidebar.create_description")}
            >
              <div className="space-y-3">
                <AdminOverviewItem
                  label={t("admin.legal_clauses.form.identifier")}
                  value={identifier || "-"}
                />
                <AdminOverviewItem
                  label={t("admin.legal_clauses.form.category")}
                  value={category || "-"}
                />
                <AdminOverviewItem
                  label={t("admin.legal_clauses.sidebar.available_translations")}
                  value={String(
                    Object.values(content).filter((value) => value.trim().length > 0).length
                  )}
                />
              </div>
            </AdminSidebarCard>
          }
        />
      </div>
    </ProjectAdminShell>
  );
}
