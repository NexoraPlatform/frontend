"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, FileText } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminOverviewItem,
  AdminSidebarCard,
} from "@/components/admin/admin-sidebar-card";
import { LegalClauseEditorForm } from "@/components/admin/legal-clause-editor-form";
import { AdminSpinner } from "@/components/admin/admin-state";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { checkRequirement } from "@/lib/access";
import {
  LEGAL_CLAUSE_LANGUAGE_CODES,
  LEGAL_CLAUSE_TRANSLATION_LANGUAGE_OPTIONS,
  countLegalClauseTranslations,
} from "@/lib/admin-legal-clauses";
import { apiClient, type LegalClause } from "@/lib/api";
import { useRouter } from "@/lib/navigation";

type Props = {
  id: string;
};

export default function LegalClauseDetailClient({ id }: Props) {
  const { user, loading, userLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations();
  const [clause, setClause] = useState<LegalClause | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preferredLanguage = searchParams.get("lang") ?? locale ?? "en";
  const selectedLanguage = LEGAL_CLAUSE_LANGUAGE_CODES.has(preferredLanguage)
    ? preferredLanguage
    : "en";

  const selectedLanguageLabel = useMemo(
    () =>
      LEGAL_CLAUSE_TRANSLATION_LANGUAGE_OPTIONS.find(
        (language) => language.code === selectedLanguage
      )?.labelKey || "admin.legal_clauses.languages.en",
    [selectedLanguage]
  );

  const canEdit = useMemo(
    () =>
      checkRequirement(user, {
        roles: ["admin", "legal"],
        permissions: ["legal.clauses.update"],
      }),
    [user]
  );

  useEffect(() => {
    if (userLoading) return;

    if (!canEdit) {
      router.replace(`/access-denied?from=${encodeURIComponent(`/admin/legal/clauses/${id}`)}`);
    }
  }, [canEdit, id, router, userLoading]);

  useEffect(() => {
    const fetchClause = async () => {
      setFetching(true);
      setError(null);

      try {
        const response = await apiClient.getAdminLegalClause(id, selectedLanguage);
        const loadedClause = response as LegalClause;
        setClause(loadedClause);
        setIdentifier(loadedClause.identifier || "");
        setCategory(loadedClause.category || "");
        setContent(loadedClause.content || {});
      } catch (err: any) {
        setError(err?.message || t("admin.legal_clauses.errors.load_detail"));
      } finally {
        setFetching(false);
      }
    };

    if (canEdit) {
      void fetchClause();
    }
  }, [canEdit, id, selectedLanguage, t]);

  const setQueryParam = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleContentChange = (language: string, value: string) => {
    setContent((previous) => ({ ...previous, [language]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedIdentifier = identifier.trim();
    const trimmedCategory = category.trim();
    const trimmedContent = (content[selectedLanguage] || "").trim();

    if (!trimmedIdentifier || !trimmedCategory) {
      setError(t("admin.legal_clauses.errors.update_required_identifier"));
      return;
    }

    if (!trimmedContent) {
      setError(t("admin.legal_clauses.errors.update_required_content"));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await apiClient.updateAdminLegalClause(id, {
        identifier: trimmedIdentifier,
        category: trimmedCategory,
        content: { [selectedLanguage]: trimmedContent },
      });
      router.push("/admin/legal/clauses");
    } catch (err: any) {
      setError(err?.message || t("admin.legal_clauses.errors.update_failed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || userLoading || !canEdit || fetching) {
    return (
      <ProjectAdminShell>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <AdminSpinner />
        </div>
      </ProjectAdminShell>
    );
  }

  if (error && !clause) {
    return (
      <ProjectAdminShell>
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <AdminPageHeader
            backHref="/admin/legal/clauses"
            title={t("admin.legal_clauses.edit_title")}
            description={t("admin.legal_clauses.edit_subtitle")}
          />
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </ProjectAdminShell>
    );
  }

  if (!clause) {
    return null;
  }

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          backHref="/admin/legal/clauses"
          title={t("admin.legal_clauses.edit_title")}
          description={t("admin.legal_clauses.edit_subtitle")}
        />

        <LegalClauseEditorForm
          mode="edit"
          identifier={identifier}
          category={category}
          content={content}
          selectedLanguage={selectedLanguage}
          onIdentifierChange={setIdentifier}
          onCategoryChange={setCategory}
          onContentChange={handleContentChange}
          onLanguageChange={setQueryParam}
          onSubmit={handleSubmit}
          cancelHref="/admin/legal/clauses"
          error={error}
          saving={saving}
          sidebar={
            <AdminSidebarCard
              icon={FileText}
              title={t("admin.legal_clauses.sidebar.edit_title")}
              description={t("admin.legal_clauses.sidebar.edit_description")}
            >
              <div className="space-y-3">
                <AdminOverviewItem
                  label={t("admin.legal_clauses.sidebar.selected_language")}
                  value={t(selectedLanguageLabel)}
                />
                <AdminOverviewItem
                  label={t("admin.legal_clauses.sidebar.available_translations")}
                  value={String(countLegalClauseTranslations({ content }))}
                />
                <AdminOverviewItem
                  label={t("admin.legal_clauses.sidebar.created_at")}
                  value={new Date(clause.created_at).toLocaleDateString()}
                />
                <AdminOverviewItem
                  label={t("admin.legal_clauses.sidebar.updated_at")}
                  value={new Date(clause.updated_at).toLocaleDateString()}
                />
              </div>
            </AdminSidebarCard>
          }
        />
      </div>
    </ProjectAdminShell>
  );
}
