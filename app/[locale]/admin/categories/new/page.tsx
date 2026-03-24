"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";

import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import {
  CategoryEditorForm,
  type CategoryEditorValues,
} from "@/components/admin/category-editor-form";
import { useAdminCategories } from "@/hooks/use-api";
import { apiClient } from "@/lib/api";
import { getLocalizedAdminValue } from "@/lib/admin-format";

const initialValues: CategoryEditorValues = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  parentId: "none",
  sortOrder: 0,
};

export default function NewCategoryPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { data: categoriesData } = useAdminCategories();

  const parentOptions = useMemo(
    () =>
      (categoriesData?.categories || [])
        .filter((category: any) => !category.parent_id && !category.parentId)
        .map((category: any) => ({
          id: String(category.id),
          name: getLocalizedAdminValue(category.name, locale),
        })),
    [categoriesData?.categories, locale]
  );

  const handleSubmit = async (values: CategoryEditorValues) => {
    setLoading(true);
    setError("");

    try {
      await apiClient.createCategory({
        ...values,
        parentId: values.parentId === "none" ? undefined : values.parentId,
        sortOrder: values.sortOrder || 0,
      });
      router.push("/admin/categories");
    } catch (nextError: any) {
      setError(nextError.message || t("admin.categories.error_occurred"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProjectAdminShell>
      <CategoryEditorForm
        mode="create"
        initialValues={initialValues}
        parentOptions={parentOptions}
        submitting={loading}
        error={error}
        onSubmit={handleSubmit}
      />
    </ProjectAdminShell>
  );
}
