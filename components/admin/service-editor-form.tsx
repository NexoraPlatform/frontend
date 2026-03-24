"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";

import { AdminOverviewItem, AdminSidebarCard } from "@/components/admin/admin-sidebar-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSpinner } from "@/components/admin/admin-state";
import { useCategories } from "@/hooks/use-api";
import apiClient from "@/lib/api";
import { getLocalizedAdminValue } from "@/lib/admin-format";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type ServiceEditorValues = {
  title: string;
  slug: string;
  description: string;
  requirements: string;
  category_id: string;
  delivery_provider: string;
  skills: string[];
  tags: string[];
  status: string;
};

type DeliveryProviderOption = {
  value: string;
  label: string;
};

type ServiceEditorFormProps = {
  mode: "create" | "edit";
  initialValues: ServiceEditorValues;
  initialCategorySlug?: string | null;
  loading?: boolean;
  submitting?: boolean;
  error?: string;
  onSubmit: (values: ServiceEditorValues) => Promise<void> | void;
};

const generateSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

export function ServiceEditorForm({
  mode,
  initialValues,
  initialCategorySlug = null,
  loading = false,
  submitting = false,
  error,
  onSubmit,
}: ServiceEditorFormProps) {
  const locale = useLocale();
  const t = useTranslations();
  const { data: categoriesData } = useCategories();

  const [formData, setFormData] = useState<ServiceEditorValues>(initialValues);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(initialCategorySlug);
  const [newSkill, setNewSkill] = useState("");
  const [newTag, setNewTag] = useState("");
  const [deliveryProviderOptions, setDeliveryProviderOptions] = useState<DeliveryProviderOption[]>([]);
  const [deliveryProviderOpen, setDeliveryProviderOpen] = useState(false);
  const [loadingDeliveryProviders, setLoadingDeliveryProviders] = useState(true);
  const [localError, setLocalError] = useState("");

  const pageTitle = mode === "create"
    ? t("admin.services.new_service.title")
    : t("admin.services.edit_service.title");
  const pageSubtitle = mode === "create"
    ? t("admin.services.new_service.subtitle")
    : t("admin.services.edit_service.subtitle");
  const submitLabel = mode === "create"
    ? t("admin.services.create_service")
    : t("admin.services.save_changes");
  const submitLoadingLabel = mode === "create"
    ? t("admin.services.creating")
    : t("admin.services.saving");
  const overviewDescription = mode === "create"
    ? t("admin.services.overview.description_create")
    : t("admin.services.overview.description_edit");
  const actionsTitle = mode === "create"
    ? t("admin.services.actions_card.create_title")
    : t("admin.services.actions_card.edit_title");
  const actionsDescription = mode === "create"
    ? t("admin.services.actions_card.create_description")
    : t("admin.services.actions_card.edit_description");

  useEffect(() => {
    setFormData(initialValues);
    setSelectedCategorySlug(initialCategorySlug ?? null);
  }, [initialCategorySlug, initialValues]);

  useEffect(() => {
    let mounted = true;

    const loadDeliveryProviders = async () => {
      setLoadingDeliveryProviders(true);
      try {
        const response = await apiClient.getDeliveryProviders();
        const providers = Array.isArray(response?.data) ? response.data : [];
        const normalized = providers
          .filter((provider: any) => provider?.value && provider?.label)
          .map((provider: any) => ({
            value: String(provider.value),
            label: String(provider.label),
          }));

        if (!mounted) return;
        setDeliveryProviderOptions(normalized);
      } catch {
        if (!mounted) return;
        setLocalError(t("admin.services.error_occurred"));
      } finally {
        if (mounted) {
          setLoadingDeliveryProviders(false);
        }
      }
    };

    void loadDeliveryProviders();
    return () => {
      mounted = false;
    };
  }, [t]);

  const buildCategoryOptions = useCallback(
    (categories: any[], parentId: number | null = null, level = 0): any[] => {
      let result: any[] = [];

      categories
        .filter((category) => category.parent_id === parentId)
        .forEach((category) => {
          const localizedName = getLocalizedAdminValue(category?.name, locale);

          result.push({
            ...category,
            displayName: `${"--".repeat(level)} ${localizedName}`.trim(),
          });

          result = result.concat(buildCategoryOptions(categories, category.id, level + 1));
        });

      return result;
    },
    [locale]
  );

  const categoryOptions = useMemo(
    () => buildCategoryOptions(Array.isArray(categoriesData) ? categoriesData : []),
    [buildCategoryOptions, categoriesData]
  );

  const selectedCategoryLabel = useMemo(() => {
    const category = categoryOptions.find(
      (option) => String(option.id) === String(formData.category_id)
    );

    return category?.displayName?.trim() || t("admin.services.overview.empty");
  }, [categoryOptions, formData.category_id, t]);

  const selectedDeliveryProvider = useMemo(
    () => deliveryProviderOptions.find((option) => option.value === formData.delivery_provider) ?? null,
    [deliveryProviderOptions, formData.delivery_provider]
  );

  const syncCategorySlug = useCallback(async (categoryId: string) => {
    if (!categoryId) {
      setSelectedCategorySlug(null);
      return;
    }

    try {
      const categorySlug = await apiClient.getCategorySlugById(categoryId);
      setSelectedCategorySlug(typeof categorySlug === "string" ? categorySlug : null);
    } catch {
      setLocalError(t("admin.services.category_load_error"));
    }
  }, [t]);

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug:
        prev.slug === generateSlug(prev.title) || prev.slug === ""
          ? generateSlug(title)
          : prev.slug,
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((value) => value !== skill),
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((value) => value !== tag),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError("");

    if (!formData.delivery_provider) {
      setLocalError(t("admin.services.delivery_provider_required"));
      return;
    }

    await onSubmit(formData);
  };

  const displayError = error || localError;

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
        backHref="/admin/services"
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <AdminSectionCard
            delay={0.15}
            title={t("admin.services.info_title")}
            description={t("admin.services.info_description")}
          >
            {displayError ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t("admin.services.title_label")}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  placeholder={t("admin.services.title_placeholder")}
                  required
                  className="border-border bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">{t("admin.services.slug_label")}</Label>
                <div className="flex min-h-11 rounded-lg border border-border bg-transparent">
                  {selectedCategorySlug ? (
                    <span className="flex items-center border-r border-border px-3 text-sm text-muted-foreground">
                      {selectedCategorySlug}/
                    </span>
                  ) : null}
                  <input
                    id="slug"
                    value={formData.slug}
                    onChange={(event) => setFormData((prev) => ({ ...prev, slug: event.target.value }))}
                    placeholder={t("admin.services.slug_placeholder")}
                    required
                    className="h-11 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                </div>
                <p className="text-sm text-muted-foreground">{t("admin.services.slug_help")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("admin.services.description_label")}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder={t("admin.services.description_placeholder")}
                  rows={5}
                  required
                  className="border-border bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">{t("admin.services.requirements_label")}</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, requirements: event.target.value }))
                  }
                  placeholder={t("admin.services.requirements_placeholder")}
                  rows={4}
                  className="border-border bg-transparent"
                />
              </div>

              <div className={`grid gap-4 ${mode === "edit" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                <div className="space-y-2">
                  <Label htmlFor="category_id">{t("admin.services.category_label")}</Label>
                  <Select
                    value={String(formData.category_id)}
                    onValueChange={(value) => {
                      setFormData((prev) => ({ ...prev, category_id: value }));
                      void syncCategorySlug(value);
                    }}
                  >
                    <SelectTrigger id="category_id" className="border-border bg-transparent">
                      <SelectValue placeholder={t("admin.services.category_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((category: any) => (
                        <SelectItem
                          key={category.id}
                          value={typeof category.id === "string" ? category.id : String(category.id)}
                        >
                          {category.displayName.trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_provider">
                    {t("admin.services.delivery_provider_label")}
                  </Label>
                  <Popover open={deliveryProviderOpen} onOpenChange={setDeliveryProviderOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="delivery_provider"
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={deliveryProviderOpen}
                        className="w-full justify-between border-border bg-transparent"
                        disabled={loadingDeliveryProviders}
                      >
                        <span className="truncate">
                          {selectedDeliveryProvider?.label ||
                            formData.delivery_provider ||
                            (loadingDeliveryProviders
                              ? t("admin.services.delivery_provider_loading")
                              : t("admin.services.delivery_provider_placeholder"))}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder={t("admin.services.delivery_provider_search_placeholder")}
                        />
                        <CommandList className="max-h-[260px] overflow-y-auto">
                          <CommandEmpty>{t("admin.services.delivery_provider_empty")}</CommandEmpty>
                          <CommandGroup>
                            {deliveryProviderOptions.map((provider) => (
                              <CommandItem
                                key={provider.value}
                                value={`${provider.label} ${provider.value}`}
                                onSelect={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    delivery_provider: provider.value,
                                  }));
                                  setDeliveryProviderOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.delivery_provider === provider.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {provider.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {mode === "edit" ? (
                  <div className="space-y-2">
                    <Label htmlFor="status">{t("admin.services.edit_service.status_label")}</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger id="status" className="border-border bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">{t("admin.services.statuses.DRAFT")}</SelectItem>
                        <SelectItem value="ACTIVE">{t("admin.services.statuses.ACTIVE")}</SelectItem>
                        <SelectItem value="SUSPENDED">{t("admin.services.statuses.SUSPENDED")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            delay={0.2}
            title={t("admin.services.skills_tags_title")}
            description={t("admin.services.skills_tags_description")}
          >
            <div className="space-y-6">
              <div>
                <Label>{t("admin.services.skills_label")}</Label>
                <div className="mb-3 mt-2 flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(event) => setNewSkill(event.target.value)}
                    placeholder={t("admin.services.skills_placeholder")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addSkill();
                      }
                    }}
                    className="border-border bg-transparent"
                  />
                  <Button type="button" onClick={addSkill} variant="outline" className="border-border bg-transparent">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="flex items-center space-x-1 bg-secondary/70"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>{t("admin.services.tags_label")}</Label>
                <div className="mb-3 mt-2 flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(event) => setNewTag(event.target.value)}
                    placeholder={t("admin.services.tags_placeholder")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTag();
                      }
                    }}
                    className="border-border bg-transparent"
                  />
                  <Button type="button" onClick={addTag} variant="outline" className="border-border bg-transparent">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="flex items-center space-x-1 border-border"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </AdminSectionCard>
        </div>

        <div className="space-y-6">
          <AdminSidebarCard
            delay={0.25}
            icon={Settings2}
            title={t("admin.services.overview.title")}
            description={overviewDescription}
          >
            <div className="space-y-4">
              <AdminOverviewItem
                label={t("admin.services.overview.selected_category")}
                value={selectedCategoryLabel}
              />

              <AdminOverviewItem
                label={t("admin.services.overview.selected_provider")}
                value={
                  selectedDeliveryProvider?.label ||
                  formData.delivery_provider ||
                  t("admin.services.overview.empty")
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <AdminOverviewItem
                  label={t("admin.services.overview.skills_count")}
                  value={formData.skills.length}
                  valueClassName="mt-2 text-sm font-medium"
                />
                <AdminOverviewItem
                  label={t("admin.services.overview.tags_count")}
                  value={formData.tags.length}
                  valueClassName="mt-2 text-sm font-medium"
                />
              </div>

              {mode === "edit" ? (
                <AdminOverviewItem
                  label={t("admin.services.overview.status")}
                  value={formData.status}
                  valueClassName="mt-2 text-sm font-medium"
                />
              ) : null}
            </div>
          </AdminSidebarCard>

          <AdminSidebarCard
            delay={0.3}
            icon={ShieldCheck}
            className="border-emerald-500/30 bg-emerald-500/10"
            title={
              <span className="text-emerald-900 dark:text-emerald-100">
                {t(mode === "create" ? "admin.services.pricing_note_title" : "admin.services.pricing_note_title_edit")}
              </span>
            }
            description={
              <span className="text-emerald-800 dark:text-emerald-200">
                {t(
                  mode === "create"
                    ? "admin.services.pricing_note_description"
                    : "admin.services.pricing_note_description_edit"
                )}
              </span>
            }
          />

          <AdminSidebarCard
            delay={0.35}
            icon={ShieldCheck}
            title={actionsTitle}
            description={actionsDescription}
          >
            <div className="space-y-3">
              <Button type="submit" disabled={submitting} className="w-full bg-primary text-white hover:bg-primary/90">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {submitLoadingLabel}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {submitLabel}
                  </>
                )}
              </Button>

              <Link href="/admin/services" className="block">
                <Button type="button" variant="outline" className="w-full border-border bg-transparent">
                  {t("admin.services.cancel")}
                </Button>
              </Link>
            </div>
          </AdminSidebarCard>
        </div>
      </form>
    </div>
  );
}
