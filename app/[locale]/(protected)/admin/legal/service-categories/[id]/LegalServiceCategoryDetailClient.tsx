"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { LegalServiceCategoryEditorForm } from "@/components/admin/legal-service-category-editor-form";
import { AdminSpinner } from "@/components/admin/admin-state";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import {
  buildLegalServiceCategoryEditorValues,
  buildLegalServiceCategoryPayload,
  EMPTY_LEGAL_SERVICE_CATEGORY_VALUES,
} from "@/lib/admin-legal-service-category-form";
import { apiClient } from "@/lib/api";
import { useRouter } from "@/lib/navigation";

export default function LegalServiceCategoryDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [initialValues, setInitialValues] = useState(
    EMPTY_LEGAL_SERVICE_CATEGORY_VALUES
  );

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const response = await apiClient.getAdminLegalServiceCategory(id);
        if (!response) {
          throw new Error(t("admin.legal_service_categories.errors.load_detail"));
        }
        setInitialValues(buildLegalServiceCategoryEditorValues(response));
      } catch (nextError: any) {
        setError(
          nextError?.message || t("admin.legal_service_categories.errors.load_detail")
        );
      } finally {
        setLoading(false);
      }
    };

    void loadCategory();
  }, [id, t]);

  if (loading) {
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
      <LegalServiceCategoryEditorForm
        mode="edit"
        initialValues={initialValues}
        submitting={saving}
        error={error}
        onSubmit={async (values) => {
          setSaving(true);
          setError("");

          try {
            await apiClient.updateAdminLegalServiceCategory(
              id,
              buildLegalServiceCategoryPayload(values)
            );
            router.push("/admin/legal/service-categories");
          } catch (nextError: any) {
            setError(
              nextError?.message ||
                t("admin.legal_service_categories.errors.update_failed")
            );
          } finally {
            setSaving(false);
          }
        }}
      />
    </ProjectAdminShell>
  );
}
