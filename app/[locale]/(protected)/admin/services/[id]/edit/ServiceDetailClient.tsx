"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";

import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import {
  ServiceEditorForm,
  type ServiceEditorValues,
} from "@/components/admin/service-editor-form";
import { apiClient } from "@/lib/api";
import { getLocalizedAdminValue } from "@/lib/admin-format";
const defaultValues: ServiceEditorValues = {
  title: "",
  slug: "",
  description: "",
  requirements: "",
  category_id: "",
  delivery_provider: "",
  skills: [],
  tags: [],
  status: "DRAFT",
};

export default function ServiceDetailClient({ id }: { id: string }) {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [initialValues, setInitialValues] = useState<ServiceEditorValues>(defaultValues);
  const [initialCategorySlug, setInitialCategorySlug] = useState<string | null>(null);

  const serviceLoadError = t("admin.services.service_load_error");
  const errorOccurred = t("admin.services.error_occurred");

  const loadService = useCallback(async () => {
    try {
      const service = await apiClient.getService(id);

      setInitialValues({
        title: getLocalizedAdminValue(service?.name, locale),
        slug: service?.slug || "",
        description: getLocalizedAdminValue(service?.description, locale),
        requirements: typeof service?.requirements === "string" ? service.requirements : "",
        category_id: service?.category_id ? String(service.category_id) : "",
        delivery_provider: typeof service?.delivery_provider === "string" ? service.delivery_provider : "",
        skills: Array.isArray(service?.skills) ? service.skills.map(String) : [],
        tags: Array.isArray(service?.tags) ? service.tags.map(String) : [],
        status: typeof service?.status === "string" ? service.status : "DRAFT",
      });

      setInitialCategorySlug(service?.category?.slug || null);
    } catch {
      setError(serviceLoadError);
    } finally {
      setLoading(false);
    }
  }, [id, locale, serviceLoadError]);

  useEffect(() => {
    void loadService();
  }, [loadService]);

  const handleSubmit = async (values: ServiceEditorValues) => {
    setSaving(true);
    setError("");

    try {
      await apiClient.updateService(id, {
        name: values.title,
        slug: values.slug,
        description: values.description,
        requirements: values.requirements,
        category_id: values.category_id,
        delivery_provider: values.delivery_provider,
        skills: values.skills,
        tags: values.tags,
        status: values.status,
      });

      router.push("/admin/services");
    } catch (nextError: any) {
      setError(nextError.message || errorOccurred);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProjectAdminShell>
      <ServiceEditorForm
        mode="edit"
        initialValues={initialValues}
        initialCategorySlug={initialCategorySlug}
        loading={loading}
        submitting={saving}
        error={error}
        onSubmit={handleSubmit}
      />
    </ProjectAdminShell>
  );
}
