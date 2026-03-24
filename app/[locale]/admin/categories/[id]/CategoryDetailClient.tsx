"use client";

import { useEffect, useMemo, useState } from "react";
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

const defaultValues: CategoryEditorValues = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  parentId: "none",
  sortOrder: 0,
};

export default function CategoryDetailPage({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [initialValues, setInitialValues] = useState<CategoryEditorValues>(defaultValues);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { data: categoriesData } = useAdminCategories();

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const response = await apiClient.getCategoryById(id);

        setInitialValues({
          name: getLocalizedAdminValue(response?.name, locale),
          slug: response?.slug || "",
          description: getLocalizedAdminValue(response?.description, locale),
          icon: response?.icon || "",
          parentId: response?.parent_id ? String(response.parent_id) : "none",
          sortOrder: Number(response?.sortOrder ?? response?.sort_order ?? 0),
        });
      } catch (nextError: any) {
        setError(nextError.message || t("admin.categories.error_occurred"));
      } finally {
        setLoading(false);
      }
    };

    void loadCategory();
  }, [id, locale, t]);

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
    setSaving(true);
    setError("");

    try {
      await apiClient.updateCategory(id, {
        ...values,
        parentId: values.parentId === "none" ? undefined : values.parentId,
        sortOrder: values.sortOrder || 0,
      });
      router.push("/admin/categories");
    } catch (nextError: any) {
      setError(nextError.message || t("admin.categories.error_occurred"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProjectAdminShell>
      <CategoryEditorForm
        mode="edit"
        initialValues={initialValues}
        parentOptions={parentOptions}
        excludeParentId={id}
        loading={loading}
        submitting={saving}
        error={error}
        onSubmit={handleSubmit}
      />
    </ProjectAdminShell>
  );
}
