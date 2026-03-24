"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { RoleEditorForm } from "@/components/admin/role-editor-form";
import apiClient from "@/lib/api";
import {
  buildRoleFormValues,
  type AdminRoleFormValues,
  type AdminRolePermissionGroup,
} from "@/lib/admin-roles";
import { useRouter } from "@/lib/navigation";

export default function NewRolePage() {
  const router = useRouter();
  const t = useTranslations();
  const [values, setValues] = useState<AdminRoleFormValues>(buildRoleFormValues());
  const [permissionGroups, setPermissionGroups] = useState<AdminRolePermissionGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadPermissions = async () => {
      try {
        const response = await apiClient.getPermissions();
        if (!active) return;
        setPermissionGroups(response);
      } catch (error) {
        console.error("Failed to load permissions", error);
      }
    };

    void loadPermissions();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (!values.name.trim() || !values.description.trim()) {
      setErrorMessage(t("admin.roles.error_occurred"));
      setLoading(false);
      return;
    }

    try {
      await apiClient.createRole({
        name: values.name,
        description: values.description,
        permissions: values.permissions,
      });
      router.push("/admin/roles");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("admin.roles.error_occurred")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          backHref="/admin/roles"
          title={t("admin.roles.new_role.title")}
          description={t("admin.roles.new_role.subtitle")}
        />

        <RoleEditorForm
          values={{ ...values, sortOrder: undefined }}
          permissionGroups={permissionGroups}
          title={t("admin.roles.new_role.info_title")}
          description={t("admin.roles.new_role.info_description")}
          nameLabel={t("admin.roles.new_role.name_label")}
          namePlaceholder={t("admin.roles.new_role.name_placeholder")}
          descriptionLabel={t("admin.roles.new_role.description_label")}
          descriptionPlaceholder={t("admin.roles.new_role.description_placeholder")}
          permissionsTitle={t("admin.roles.new_role.permissions_title")}
          permissionsDescription={t("admin.roles.new_role.permissions_description")}
          submitLabel={t("admin.roles.new_role.create_button")}
          submittingLabel={t("admin.roles.new_role.creating")}
          cancelLabel={t("admin.roles.new_role.cancel")}
          loading={loading}
          errorMessage={errorMessage}
          selectedPermissionsLabel={t("admin.roles.editor_sidebar.selected_permissions")}
          groupCountLabel={t("admin.roles.editor_sidebar.permission_groups")}
          roleSlugLabel={t("admin.roles.editor_sidebar.role_slug")}
          onSubmit={handleSubmit}
          onChange={setValues}
        />
      </div>
    </ProjectAdminShell>
  );
}
