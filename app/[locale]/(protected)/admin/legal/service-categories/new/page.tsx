"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { LegalServiceCategoryEditorForm } from "@/components/admin/legal-service-category-editor-form";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { buildLegalServiceCategoryPayload, EMPTY_LEGAL_SERVICE_CATEGORY_VALUES } from "@/lib/admin-legal-service-category-form";
import { apiClient } from "@/lib/api";
import { useRouter } from "@/lib/navigation";

export default function NewLegalServiceCategoryPage() {
  const router = useRouter();
  const t = useTranslations();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  return (
    <ProjectAdminShell>
      <LegalServiceCategoryEditorForm
        mode="create"
        initialValues={EMPTY_LEGAL_SERVICE_CATEGORY_VALUES}
        submitting={saving}
        error={error}
        onSubmit={async (values) => {
          setSaving(true);
          setError("");

          try {
            await apiClient.createAdminLegalServiceCategory(
              buildLegalServiceCategoryPayload(values)
            );
            router.push("/admin/legal/service-categories");
          } catch (nextError: any) {
            setError(
              nextError?.message ||
                t("admin.legal_service_categories.errors.create_failed")
            );
          } finally {
            setSaving(false);
          }
        }}
      />
    </ProjectAdminShell>
  );
}
