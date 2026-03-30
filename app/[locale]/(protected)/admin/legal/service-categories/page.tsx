"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  ScrollText,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import {
  AdminSpinner,
  AdminTableEmptyRow,
  AdminTableLoadingRow,
} from "@/components/admin/admin-state";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminLegalServiceCategories } from "@/hooks/use-api";
import {
  ADMIN_SERVICE_CATEGORY_CONTRACT_TYPE_OPTIONS,
  ADMIN_SERVICE_CATEGORY_SORT_OPTIONS,
  parseAdminBooleanFilter,
  stringifyAdminBooleanFilter,
  type AdminBooleanFilterValue,
} from "@/lib/admin-legal-service-categories";
import { apiClient } from "@/lib/api";
import { Link, useRouter } from "@/lib/navigation";

function BooleanFilterField({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: AdminBooleanFilterValue;
  onValueChange: (value: AdminBooleanFilterValue) => void;
}) {
  const t = useTranslations();

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as AdminBooleanFilterValue)}>
        <SelectTrigger className="border-border bg-transparent">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("admin.legal_service_categories.filters.all")}</SelectItem>
          <SelectItem value="true">{t("admin.legal_service_categories.filters.yes")}</SelectItem>
          <SelectItem value="false">{t("admin.legal_service_categories.filters.no")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function AdminLegalServiceCategoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [serviceGroup, setServiceGroup] = useState(searchParams.get("service_group") ?? "");
  const [defaultContractType, setDefaultContractType] = useState(
    searchParams.get("default_contract_type") ?? "all"
  );
  const [ipTransferExpected, setIpTransferExpected] = useState<AdminBooleanFilterValue>(
    stringifyAdminBooleanFilter(parseAdminBooleanFilter(searchParams.get("ip_transfer_expected")))
  );
  const [dpaRequiredByDefault, setDpaRequiredByDefault] = useState<AdminBooleanFilterValue>(
    stringifyAdminBooleanFilter(
      parseAdminBooleanFilter(searchParams.get("dpa_required_by_default"))
    )
  );
  const [personalDataProcessingLikely, setPersonalDataProcessingLikely] =
    useState<AdminBooleanFilterValue>(
      stringifyAdminBooleanFilter(
        parseAdminBooleanFilter(searchParams.get("personal_data_processing_likely"))
      )
    );
  const [serviceLevelsRequired, setServiceLevelsRequired] =
    useState<AdminBooleanFilterValue>(
      stringifyAdminBooleanFilter(
        parseAdminBooleanFilter(searchParams.get("service_levels_required"))
      )
    );
  const [regulatedActivityRisk, setRegulatedActivityRisk] =
    useState<AdminBooleanFilterValue>(
      stringifyAdminBooleanFilter(
        parseAdminBooleanFilter(searchParams.get("regulated_activity_risk"))
      )
    );
  const [exportControlRisk, setExportControlRisk] = useState<AdminBooleanFilterValue>(
    stringifyAdminBooleanFilter(
      parseAdminBooleanFilter(searchParams.get("export_control_risk"))
    )
  );
  const [isActive, setIsActive] = useState<AdminBooleanFilterValue>(
    stringifyAdminBooleanFilter(parseAdminBooleanFilter(searchParams.get("is_active")))
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort_by") ?? ADMIN_SERVICE_CATEGORY_SORT_OPTIONS[0]
  );
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (serviceGroup.trim()) params.set("service_group", serviceGroup.trim());
    if (defaultContractType !== "all") {
      params.set("default_contract_type", defaultContractType);
    }
    if (ipTransferExpected !== "all") {
      params.set("ip_transfer_expected", ipTransferExpected);
    }
    if (dpaRequiredByDefault !== "all") {
      params.set("dpa_required_by_default", dpaRequiredByDefault);
    }
    if (personalDataProcessingLikely !== "all") {
      params.set(
        "personal_data_processing_likely",
        personalDataProcessingLikely
      );
    }
    if (serviceLevelsRequired !== "all") {
      params.set("service_levels_required", serviceLevelsRequired);
    }
    if (regulatedActivityRisk !== "all") {
      params.set("regulated_activity_risk", regulatedActivityRisk);
    }
    if (exportControlRisk !== "all") {
      params.set("export_control_risk", exportControlRisk);
    }
    if (isActive !== "all") {
      params.set("is_active", isActive);
    }
    if (sortBy !== ADMIN_SERVICE_CATEGORY_SORT_OPTIONS[0]) {
      params.set("sort_by", sortBy);
    }
    if (page !== 1) {
      params.set("page", String(page));
    }

    const query = params.toString();
    router.replace(
      query
        ? `/admin/legal/service-categories?${query}`
        : "/admin/legal/service-categories",
      { scroll: false }
    );
  }, [
    defaultContractType,
    dpaRequiredByDefault,
    exportControlRisk,
    ipTransferExpected,
    isActive,
    page,
    personalDataProcessingLikely,
    regulatedActivityRisk,
    router,
    search,
    serviceGroup,
    serviceLevelsRequired,
    sortBy,
  ]);

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      service_group: serviceGroup.trim() || undefined,
      default_contract_type:
        defaultContractType !== "all"
          ? (defaultContractType as (typeof ADMIN_SERVICE_CATEGORY_CONTRACT_TYPE_OPTIONS)[number])
          : undefined,
      ip_transfer_expected: parseAdminBooleanFilter(ipTransferExpected),
      dpa_required_by_default: parseAdminBooleanFilter(dpaRequiredByDefault),
      personal_data_processing_likely: parseAdminBooleanFilter(
        personalDataProcessingLikely
      ),
      service_levels_required: parseAdminBooleanFilter(serviceLevelsRequired),
      regulated_activity_risk: parseAdminBooleanFilter(regulatedActivityRisk),
      export_control_risk: parseAdminBooleanFilter(exportControlRisk),
      is_active: parseAdminBooleanFilter(isActive),
      sort_by:
        sortBy !== ""
          ? (sortBy as (typeof ADMIN_SERVICE_CATEGORY_SORT_OPTIONS)[number])
          : undefined,
      page,
    }),
    [
      defaultContractType,
      dpaRequiredByDefault,
      exportControlRisk,
      ipTransferExpected,
      isActive,
      page,
      personalDataProcessingLikely,
      regulatedActivityRisk,
      search,
      serviceGroup,
      serviceLevelsRequired,
      sortBy,
    ]
  );

  const {
    data,
    loading,
    error,
    refetch,
  } = useAdminLegalServiceCategories(queryParams);

  const categories = data?.data ?? [];

  const contractTypeLabels = useMemo(
    () => ({
      SERVICES: t("admin.legal_service_categories.contract_types.services"),
      WORK_FOR_RESULT: t("admin.legal_service_categories.contract_types.work_for_result"),
      MIXED: t("admin.legal_service_categories.contract_types.mixed"),
    }),
    [t]
  );

  const summaryCards = useMemo(
    () => [
      {
        title: t("admin.legal_service_categories.summary.total"),
        value: data?.total ?? categories.length,
        icon: ScrollText,
        color: "bg-gradient-to-br from-primary to-emerald-400",
      },
      {
        title: t("admin.legal_service_categories.summary.active"),
        value: categories.filter((category) => category.is_active).length,
        icon: ShieldCheck,
        color: "bg-gradient-to-br from-blue-500 to-cyan-400",
      },
      {
        title: t("admin.legal_service_categories.summary.dpa_default"),
        value: categories.filter((category) => category.dpa_required_by_default).length,
        icon: RefreshCcw,
        color: "bg-gradient-to-br from-purple-500 to-pink-400",
      },
      {
        title: t("admin.legal_service_categories.summary.high_risk"),
        value: categories.filter(
          (category) =>
            category.regulated_activity_risk || category.export_control_risk
        ).length,
        icon: ScrollText,
        color: "bg-gradient-to-br from-orange-500 to-amber-400",
      },
    ],
    [categories, data?.total, t]
  );

  const handleDelete = async (categoryId: number | null) => {
    if (!categoryId) {
      return;
    }

    if (!confirm(t("admin.legal_service_categories.errors.delete_confirm"))) {
      return;
    }

    try {
      await apiClient.deleteAdminLegalServiceCategory(categoryId);
      await refetch();
    } catch (nextError: any) {
      alert(
        nextError?.message || t("admin.legal_service_categories.errors.delete_failed")
      );
    }
  };

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={t("admin.legal_service_categories.manage_title")}
          description={t("admin.legal_service_categories.manage_subtitle")}
          action={
            <Link href="/admin/legal/service-categories/new">
              <Button className="bg-primary text-white hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                {t("admin.legal_service_categories.add_category")}
              </Button>
            </Link>
          }
        />

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card, index) => (
            <AdminSummaryCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              colorClassName={card.color}
              delay={index * 0.06}
            />
          ))}
        </div>

        <AdminSectionCard
          delay={0.18}
          title={t("admin.legal_service_categories.filters.title")}
          description={t("admin.legal_service_categories.filters.description")}
        >
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <Label>{t("admin.legal_service_categories.filters.search")}</Label>
              <AdminSearchInput
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={t("admin.legal_service_categories.filters.search_placeholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceGroupFilter">
                {t("admin.legal_service_categories.filters.service_group")}
              </Label>
              <Input
                id="serviceGroupFilter"
                value={serviceGroup}
                onChange={(event) => {
                  setServiceGroup(event.target.value);
                  setPage(1);
                }}
                placeholder={t(
                  "admin.legal_service_categories.filters.service_group_placeholder"
                )}
                className="border-border bg-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("admin.legal_service_categories.filters.default_contract_type")}</Label>
              <Select
                value={defaultContractType}
                onValueChange={(value) => {
                  setDefaultContractType(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="border-border bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.legal_service_categories.filters.all")}
                  </SelectItem>
                  {ADMIN_SERVICE_CATEGORY_CONTRACT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {contractTypeLabels[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <BooleanFilterField
              label={t("admin.legal_service_categories.filters.ip_transfer_expected")}
              value={ipTransferExpected}
              onValueChange={(value) => {
                setIpTransferExpected(value);
                setPage(1);
              }}
            />
            <BooleanFilterField
              label={t("admin.legal_service_categories.filters.dpa_required_by_default")}
              value={dpaRequiredByDefault}
              onValueChange={(value) => {
                setDpaRequiredByDefault(value);
                setPage(1);
              }}
            />
            <BooleanFilterField
              label={t(
                "admin.legal_service_categories.filters.personal_data_processing_likely"
              )}
              value={personalDataProcessingLikely}
              onValueChange={(value) => {
                setPersonalDataProcessingLikely(value);
                setPage(1);
              }}
            />
            <BooleanFilterField
              label={t("admin.legal_service_categories.filters.service_levels_required")}
              value={serviceLevelsRequired}
              onValueChange={(value) => {
                setServiceLevelsRequired(value);
                setPage(1);
              }}
            />
            <BooleanFilterField
              label={t("admin.legal_service_categories.filters.regulated_activity_risk")}
              value={regulatedActivityRisk}
              onValueChange={(value) => {
                setRegulatedActivityRisk(value);
                setPage(1);
              }}
            />
            <BooleanFilterField
              label={t("admin.legal_service_categories.filters.export_control_risk")}
              value={exportControlRisk}
              onValueChange={(value) => {
                setExportControlRisk(value);
                setPage(1);
              }}
            />
            <BooleanFilterField
              label={t("admin.legal_service_categories.filters.is_active")}
              value={isActive}
              onValueChange={(value) => {
                setIsActive(value);
                setPage(1);
              }}
            />

            <div className="space-y-2">
              <Label>{t("admin.legal_service_categories.filters.sort_by")}</Label>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="border-border bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_SERVICE_CATEGORY_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`admin.legal_service_categories.sort.${option}` as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          delay={0.22}
          title={t("admin.legal_service_categories.list_title")}
          description={t("admin.legal_service_categories.list_description", {
            count: data?.total ?? categories.length,
          })}
        >
          {error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.legal_service_categories.table.service")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.legal_service_categories.table.contract_type")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.legal_service_categories.table.requirements")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.legal_service_categories.table.risks")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.legal_service_categories.table.versioning")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.legal_service_categories.table.status")}
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-muted-foreground">
                    {t("admin.legal_service_categories.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <AdminTableLoadingRow colSpan={7} />
                ) : categories.length === 0 ? (
                  <AdminTableEmptyRow
                    colSpan={7}
                    icon={ScrollText}
                    title={t("admin.legal_service_categories.empty_title")}
                    description={t("admin.legal_service_categories.empty_description")}
                    action={
                      <Link href="/admin/legal/service-categories/new" className="inline-flex">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          {t("admin.legal_service_categories.add_first_category")}
                        </Button>
                      </Link>
                    }
                  />
                ) : (
                  categories.map((category, index) => {
                    const requirements = [
                      category.ip_transfer_expected
                        ? t("admin.legal_service_categories.badges.ip_transfer")
                        : null,
                      category.nda_recommended
                        ? t("admin.legal_service_categories.badges.nda")
                        : null,
                      category.dpa_required_by_default
                        ? t("admin.legal_service_categories.badges.dpa")
                        : null,
                      category.service_levels_required
                        ? t("admin.legal_service_categories.badges.sla")
                        : null,
                    ].filter(Boolean);
                    const risks = [
                      category.open_source_risk
                        ? t("admin.legal_service_categories.badges.open_source")
                        : null,
                      category.third_party_material_risk
                        ? t("admin.legal_service_categories.badges.third_party")
                        : null,
                      category.regulated_activity_risk
                        ? t("admin.legal_service_categories.badges.regulated")
                        : null,
                      category.export_control_risk
                        ? t("admin.legal_service_categories.badges.export")
                        : null,
                    ].filter(Boolean);

                    return (
                      <tr
                        key={category.id ?? `${category.service_code}-${index}`}
                        className="border-b border-border/50 transition-colors hover:bg-secondary/30"
                      >
                        <td className="px-4 py-4 align-top">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium">
                                {category.service_name || category.name || "-"}
                              </p>
                              <Badge variant="outline">{category.service_code || category.code}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {category.service_group || category.group || "-"}
                            </div>
                            <p className="max-w-md text-xs text-muted-foreground line-clamp-2">
                              {category.description || t("admin.legal_service_categories.empty")}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                          {contractTypeLabels[category.default_contract_type]}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            {requirements.length > 0 ? (
                              requirements.map((item) => (
                                <Badge key={item} variant="secondary">
                                  {item}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {t("admin.legal_service_categories.none")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            {risks.length > 0 ? (
                              risks.map((item) => (
                                <Badge key={item} variant="outline">
                                  {item}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {t("admin.legal_service_categories.none")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                          <div>{t("admin.legal_service_categories.table.order_label", { value: category.sort_order })}</div>
                          <div>{t("admin.legal_service_categories.table.version_label", { value: category.version ?? 1 })}</div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          {category.is_active ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              {t("admin.legal_service_categories.status.active")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-destructive/20 px-3 py-1 text-xs font-medium text-destructive">
                              {t("admin.legal_service_categories.status.inactive")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center align-top">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/admin/legal/service-categories/${category.id}`
                                  )
                                }
                                disabled={!category.id}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                {t("admin.legal_service_categories.actions.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(category.id)}
                                className="text-destructive focus:text-destructive"
                                disabled={!category.id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("admin.legal_service_categories.actions.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {data && data.last_page > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {t("admin.legal_service_categories.pagination", {
                  page: data.current_page,
                  total: data.last_page,
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.current_page <= 1 || loading}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  {t("admin.legal_service_categories.actions.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.current_page >= data.last_page || loading}
                  onClick={() => setPage((prev) => Math.min(data.last_page, prev + 1))}
                >
                  {t("admin.legal_service_categories.actions.next")}
                </Button>
              </div>
            </div>
          ) : null}
        </AdminSectionCard>
      </div>
    </ProjectAdminShell>
  );
}

export default function AdminLegalServiceCategoriesPage() {
  return (
    <Suspense
      fallback={
        <ProjectAdminShell>
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <AdminSpinner />
          </div>
        </ProjectAdminShell>
      }
    >
      <AdminLegalServiceCategoriesContent />
    </Suspense>
  );
}
