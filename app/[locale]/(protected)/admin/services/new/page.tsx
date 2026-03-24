"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";

import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import {
  ServiceEditorForm,
  type ServiceEditorValues,
} from "@/components/admin/service-editor-form";
import { apiClient } from "@/lib/api";

const initialValues: ServiceEditorValues = {
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

export default function NewServicePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const t = useTranslations();

  const errorOccurred = t("admin.services.error_occurred");

  const handleSubmit = async (values: ServiceEditorValues) => {
    setLoading(true);
    setError("");

    try {
      await apiClient.createService({
        title: values.title,
        slug: values.slug,
        description: values.description,
        requirements: values.requirements,
        category_id: values.category_id,
        delivery_provider: values.delivery_provider,
        skills: values.skills,
        tags: values.tags,
        basePrice: 0,
        pricingType: "CUSTOM",
      });

      router.push("/admin/services");
    } catch (nextError: any) {
      setError(nextError.message || errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProjectAdminShell>
      <ServiceEditorForm
        mode="create"
        initialValues={initialValues}
        submitting={loading}
        error={error}
        onSubmit={handleSubmit}
      />
    </ProjectAdminShell>
  );
}
