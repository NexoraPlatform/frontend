"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { RoleEditorForm } from "@/components/admin/role-editor-form";
import { useAuth } from "@/contexts/auth-context";
import apiClient from "@/lib/api";
import {
  buildRoleFormValues,
  type AdminRoleFormValues,
  type AdminRolePermissionGroup,
} from "@/lib/admin-roles";
import { useRouter } from "@/lib/navigation";

export default function EditRoleClient({ id }: { id: number }) {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [values, setValues] = useState<AdminRoleFormValues>(buildRoleFormValues());
  const [permissionGroups, setPermissionGroups] = useState<AdminRolePermissionGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderSavedAt, setOrderSavedAt] = useState<number | null>(null);
  const roleNameRef = useRef("");
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [roleResponse, permissionsResponse] = await Promise.all([
          apiClient.getRole(id),
          apiClient.getPermissions(),
        ]);

        if (!active) return;

        roleNameRef.current = roleResponse.name ?? "";
        setValues(
          buildRoleFormValues({
            name: roleResponse.name ?? "",
            description: roleResponse.description ?? "",
            permissions: Array.isArray(roleResponse.permissions)
              ? roleResponse.permissions.map((permission: any) => permission.id)
              : [],
            sortOrder: Number(roleResponse.sort_order ?? roleResponse.sortOrder ?? 0),
          })
        );
        setPermissionGroups(permissionsResponse);
      } catch (error) {
        console.error("Failed to load role editor data", error);
        if (!active) return;
        setErrorMessage(
          error instanceof Error ? error.message : t("admin.roles.error_occurred")
        );
      } finally {
        if (active) {
          setLoadingRole(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [id, t]);

  const queueSaveSortOrder = (nextSortOrder: number) => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    setSavingOrder(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        await apiClient.updateRoleSortOrder(id, nextSortOrder);
        setOrderSavedAt(Date.now());
      } catch (error) {
        console.error("Failed to update role sort order", error);
      } finally {
        setSavingOrder(false);
      }
    }, 500);
  };

  const changeSortOrder = (nextValue: number) => {
    const safeValue = Number.isFinite(nextValue)
      ? Math.max(-1_000_000, Math.min(1_000_000, Math.round(nextValue)))
      : 0;

    setValues((currentValues) => ({ ...currentValues, sortOrder: safeValue }));
    queueSaveSortOrder(safeValue);
  };

  const cannotEditDefaultRole =
    !user?.is_superuser && roleNameRef.current === "User";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (
      !values.name.trim() ||
      !values.description.trim() ||
      values.permissions.length === 0
    ) {
      setErrorMessage(t("admin.roles.error_occurred"));
      setLoading(false);
      return;
    }

    try {
      await apiClient.updateRole(id, {
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
          title={t("admin.roles.edit_role.title")}
          description={t("admin.roles.edit_role.subtitle", {
            name: values.name || "",
          })}
        />

        {loadingRole ? (
          <div className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">
            {t("admin.roles.permissions_tab_loading")}
          </div>
        ) : cannotEditDefaultRole ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {t("admin.roles.edit_role.cannot_edit")}
          </div>
        ) : (
          <RoleEditorForm
            values={values}
            permissionGroups={permissionGroups}
            title={t("admin.roles.edit_role.info_title")}
            description={t("admin.roles.edit_role.info_description")}
            nameLabel={t("admin.roles.edit_role.name_label")}
            namePlaceholder={t("admin.roles.edit_role.name_placeholder")}
            descriptionLabel={t("admin.roles.edit_role.description_label")}
            descriptionPlaceholder={t("admin.roles.edit_role.description_placeholder")}
            permissionsTitle={t("admin.roles.edit_role.permissions_title")}
            permissionsDescription={t("admin.roles.edit_role.permissions_description")}
            submitLabel={t("admin.roles.edit_role.edit_button")}
            submittingLabel={t("admin.roles.edit_role.editing")}
            cancelLabel={t("admin.roles.edit_role.cancel")}
            loading={loading}
            errorMessage={errorMessage}
            sortOrderLabel={t("admin.roles.edit_role.sort_order_label")}
            sortOrderHint={t("admin.roles.edit_role.order_hint")}
            savingOrderLabel={t("admin.roles.edit_role.saving")}
            savedOrderLabel={t("admin.roles.edit_role.saved")}
            selectedPermissionsLabel={t("admin.roles.editor_sidebar.selected_permissions")}
            groupCountLabel={t("admin.roles.editor_sidebar.permission_groups")}
            roleSlugLabel={t("admin.roles.editor_sidebar.role_slug")}
            isSavingOrder={savingOrder}
            isOrderSaved={Boolean(orderSavedAt)}
            onSubmit={handleSubmit}
            onChange={setValues}
            onSortOrderDecrease={() => changeSortOrder((values.sortOrder ?? 0) - 1)}
            onSortOrderIncrease={() => changeSortOrder((values.sortOrder ?? 0) + 1)}
            onSortOrderInputChange={changeSortOrder}
          />
        )}
      </div>
    </ProjectAdminShell>
  );
}
