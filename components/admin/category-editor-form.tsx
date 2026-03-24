"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  FolderEdit,
  FolderPlus,
  Loader2,
  Shapes,
} from "lucide-react";

import { AdminOverviewItem, AdminSidebarCard } from "@/components/admin/admin-sidebar-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSpinner } from "@/components/admin/admin-state";
import { IconSearchDropdown } from "@/components/IconSearchDropdown";
import { MuiIcon } from "@/components/MuiIcons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/lib/navigation";

export type CategoryEditorValues = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  parentId: string;
  sortOrder: number;
};

type CategoryOption = {
  id: string;
  name: string;
};

type CategoryEditorFormProps = {
  mode: "create" | "edit";
  initialValues: CategoryEditorValues;
  parentOptions: CategoryOption[];
  excludeParentId?: string | null;
  loading?: boolean;
  submitting?: boolean;
  error?: string;
  onSubmit: (values: CategoryEditorValues) => Promise<void> | void;
};

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

export function CategoryEditorForm({
  mode,
  initialValues,
  parentOptions,
  excludeParentId = null,
  loading = false,
  submitting = false,
  error,
  onSubmit,
}: CategoryEditorFormProps) {
  const t = useTranslations();
  const [formData, setFormData] = useState<CategoryEditorValues>(initialValues);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const pageTitle =
    mode === "create"
      ? t("admin.categories.add_new_title")
      : t("admin.categories.modify_title");
  const pageSubtitle =
    mode === "create"
      ? t("admin.categories.add_new_subtitle")
      : t("admin.categories.modify_subtitle");
  const submitLabel =
    mode === "create"
      ? t("admin.categories.create_category")
      : t("admin.categories.modify_button");
  const submittingLabel =
    mode === "create"
      ? t("admin.categories.creating")
      : t("admin.categories.modifying");
  const overviewDescription =
    mode === "create"
      ? t("admin.categories.overview.description_create")
      : t("admin.categories.overview.description_edit");
  const actionsTitle =
    mode === "create"
      ? t("admin.categories.actions_card.create_title")
      : t("admin.categories.actions_card.edit_title");
  const actionsDescription =
    mode === "create"
      ? t("admin.categories.actions_card.create_description")
      : t("admin.categories.actions_card.edit_description");

  const parentSelectOptions = useMemo(
    () => parentOptions.filter((option) => option.id !== excludeParentId),
    [excludeParentId, parentOptions]
  );

  const selectedParentName = useMemo(() => {
    if (formData.parentId === "none") {
      return t("admin.categories.no_parent");
    }

    return (
      parentSelectOptions.find((option) => option.id === formData.parentId)?.name ??
      t("admin.categories.overview.empty")
    );
  }, [formData.parentId, parentSelectOptions, t]);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug === generateSlug(prev.name) || prev.slug === "" ? generateSlug(name) : prev.slug,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(formData);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="glass-effect rounded-2xl border border-border p-12">
          <AdminSpinner className="flex justify-center" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <AdminPageHeader
        title={pageTitle}
        description={pageSubtitle}
        backHref="/admin/categories"
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <AdminSectionCard
          delay={0.15}
          title={t("admin.categories.info_title")}
          description={t("admin.categories.info_description")}
        >
          {error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t("admin.categories.name_label")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder={t("admin.categories.name_placeholder")}
                required
                className="border-border bg-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">{t("admin.categories.slug_label")}</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, slug: event.target.value }))
                }
                placeholder={t("admin.categories.slug_placeholder")}
                required
                className="border-border bg-transparent"
              />
              <p className="text-sm text-muted-foreground">{t("admin.categories.slug_help")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("admin.categories.description_label")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder={t("admin.categories.description_placeholder")}
                rows={4}
                className="border-border bg-transparent"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("admin.categories.icon_label")}</Label>
                <IconSearchDropdown
                  collections="*"
                  value={formData.icon}
                  onChangeAction={(iconName) =>
                    setFormData((prev) => ({ ...prev, icon: iconName }))
                  }
                />
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t("admin.categories.preview")}:</span>
                  {formData.icon ? (
                    <MuiIcon icon={formData.icon} size={22} />
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">{t("admin.categories.sort_order_label")}</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={String(formData.sortOrder)}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      sortOrder: Number.parseInt(event.target.value, 10) || 0,
                    }))
                  }
                  placeholder={t("admin.categories.sort_order_placeholder")}
                  className="border-border bg-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">{t("admin.categories.parent_category_label")}</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, parentId: value }))}
              >
                <SelectTrigger id="parentId" className="border-border bg-transparent">
                  <SelectValue placeholder={t("admin.categories.parent_category_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("admin.categories.no_parent")}</SelectItem>
                  {parentSelectOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{t("admin.categories.no_parent_help")}</p>
            </div>
          </div>
        </AdminSectionCard>

        <div className="space-y-6">
          <AdminSidebarCard
            delay={0.2}
            icon={Shapes}
            title={t("admin.categories.overview.title")}
            description={overviewDescription}
          >
            <div className="space-y-4">
              <AdminOverviewItem
                label={t("admin.categories.overview.parent")}
                value={selectedParentName}
              />

              <AdminOverviewItem label={t("admin.categories.overview.icon")}>
                <div className="flex items-center gap-3 text-sm">
                  {formData.icon ? <MuiIcon icon={formData.icon} size={20} /> : null}
                  <span>{formData.icon || t("admin.categories.overview.empty")}</span>
                </div>
              </AdminOverviewItem>

              <div className="grid gap-4 sm:grid-cols-2">
                <AdminOverviewItem
                  label={t("admin.categories.overview.sort_order")}
                  value={formData.sortOrder}
                  valueClassName="mt-2 text-sm font-medium"
                />
                <AdminOverviewItem
                  label={t("admin.categories.overview.slug")}
                  value={formData.slug || "-"}
                  valueClassName="mt-2 text-sm font-medium"
                />
              </div>
            </div>
          </AdminSidebarCard>

          <AdminSidebarCard
            delay={0.25}
            icon={mode === "create" ? FolderPlus : FolderEdit}
            title={actionsTitle}
            description={actionsDescription}
          >
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-white hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {submittingLabel}
                  </>
                ) : (
                  <>
                    {mode === "create" ? (
                      <FolderPlus className="mr-2 h-4 w-4" />
                    ) : (
                      <FolderEdit className="mr-2 h-4 w-4" />
                    )}
                    {submitLabel}
                  </>
                )}
              </Button>

              <Link href="/admin/categories" className="block">
                <Button type="button" variant="outline" className="w-full border-border bg-transparent">
                  {t("admin.categories.cancel")}
                </Button>
              </Link>
            </div>
          </AdminSidebarCard>
        </div>
      </form>
    </div>
  );
}
