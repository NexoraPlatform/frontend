"use client";

import { Save } from "lucide-react";

import { AdminOverviewItem, AdminSidebarCard } from "@/components/admin/admin-sidebar-card";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/lib/navigation";
import type { AdminRoleFormValues, AdminRolePermissionGroup } from "@/lib/admin-roles";
import { RolePermissionsSelector } from "@/components/admin/role-permissions-selector";

type RoleEditorFormProps = {
  values: AdminRoleFormValues;
  permissionGroups: AdminRolePermissionGroup[];
  title: string;
  description: string;
  nameLabel: string;
  namePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  permissionsTitle: string;
  permissionsDescription: string;
  submitLabel: string;
  submittingLabel: string;
  cancelLabel: string;
  loading: boolean;
  errorMessage?: string | null;
  sortOrderLabel?: string;
  sortOrderHint?: string;
  savingOrderLabel?: string;
  savedOrderLabel?: string;
  selectedPermissionsLabel?: string;
  groupCountLabel?: string;
  roleSlugLabel?: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (updater: (prev: AdminRoleFormValues) => AdminRoleFormValues) => void;
  onSortOrderDecrease?: () => void;
  onSortOrderIncrease?: () => void;
  onSortOrderInputChange?: (value: number) => void;
  isSavingOrder?: boolean;
  isOrderSaved?: boolean;
  cancelHref?: string;
};

export function RoleEditorForm({
  values,
  permissionGroups,
  title,
  description,
  nameLabel,
  namePlaceholder,
  descriptionLabel,
  descriptionPlaceholder,
  permissionsTitle,
  permissionsDescription,
  submitLabel,
  submittingLabel,
  cancelLabel,
  loading,
  errorMessage,
  sortOrderLabel,
  sortOrderHint,
  savingOrderLabel,
  savedOrderLabel,
  selectedPermissionsLabel,
  groupCountLabel,
  roleSlugLabel,
  onSubmit,
  onChange,
  onSortOrderDecrease,
  onSortOrderIncrease,
  onSortOrderInputChange,
  isSavingOrder = false,
  isOrderSaved = false,
  cancelHref = "/admin/roles",
}: RoleEditorFormProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <AdminSectionCard
        title={title}
        description={description}
        delay={0.12}
      >
        <form onSubmit={onSubmit} className="space-y-6">
          {errorMessage ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">{errorMessage}</p>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role-name">{nameLabel}</Label>
              <Input
                id="role-name"
                value={values.name}
                onChange={(event) =>
                  onChange((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder={namePlaceholder}
                className="h-11 border-border bg-transparent"
              />
            </div>

            {typeof values.sortOrder === "number" && onSortOrderInputChange ? (
              <div className="space-y-2">
                <Label htmlFor="role-sort-order">{sortOrderLabel}</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-border bg-transparent"
                    onClick={onSortOrderDecrease}
                  >
                    -
                  </Button>
                  <Input
                    id="role-sort-order"
                    type="number"
                    value={values.sortOrder}
                    onChange={(event) =>
                      onSortOrderInputChange(Number(event.target.value))
                    }
                    className="h-11 border-border bg-transparent text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-border bg-transparent"
                    onClick={onSortOrderIncrease}
                  >
                    +
                  </Button>
                </div>
                {sortOrderHint ? (
                  <p className="text-xs text-muted-foreground">{sortOrderHint}</p>
                ) : null}
                {isSavingOrder ? (
                  <p className="text-xs text-muted-foreground">{savingOrderLabel}</p>
                ) : null}
                {!isSavingOrder && isOrderSaved ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {savedOrderLabel}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-description">{descriptionLabel}</Label>
            <Textarea
              id="role-description"
              value={values.description}
              onChange={(event) =>
                onChange((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder={descriptionPlaceholder}
              className="min-h-[120px] border-border bg-transparent"
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold">{permissionsTitle}</h3>
              <p className="text-sm text-muted-foreground">{permissionsDescription}</p>
            </div>

            <RolePermissionsSelector
              groups={permissionGroups}
              selectedPermissionIds={values.permissions}
              onTogglePermission={(permissionId, checked) => {
                onChange((prev) => ({
                  ...prev,
                  permissions: checked
                    ? [...prev.permissions, permissionId]
                    : prev.permissions.filter((id) => id !== permissionId),
                }));
              }}
            />
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <Button type="submit" disabled={loading} className="min-w-[180px]">
              <Save className="mr-2 h-4 w-4" />
              {loading ? submittingLabel : submitLabel}
            </Button>
            <Link href={cancelHref}>
              <Button type="button" variant="outline" className="border-border bg-transparent">
                {cancelLabel}
              </Button>
            </Link>
          </div>
        </form>
      </AdminSectionCard>

      <div className="space-y-6">
        <AdminSidebarCard
          icon={Save}
          title={selectedPermissionsLabel ?? "Summary"}
          description={groupCountLabel ?? ""}
          delay={0.2}
        >
          <div className="space-y-4">
            <AdminOverviewItem
              label={selectedPermissionsLabel ?? "Selected permissions"}
              value={String(values.permissions.length)}
              valueClassName="text-primary"
            />
            <AdminOverviewItem
              label={groupCountLabel ?? "Permission groups"}
              value={String(permissionGroups.length)}
            />
            {roleSlugLabel ? (
              <AdminOverviewItem
                label={roleSlugLabel}
                value={
                  values.name.trim()
                    ? values.name
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                    : "—"
                }
              />
            ) : null}
            {typeof values.sortOrder === "number" ? (
              <AdminOverviewItem label={sortOrderLabel ?? "Sort order"} value={String(values.sortOrder)} />
            ) : null}
          </div>
        </AdminSidebarCard>
      </div>
    </div>
  );
}
