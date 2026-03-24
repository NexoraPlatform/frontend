"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle,
  Edit,
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
  Ban,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import {
  AdminTableEmptyRow,
  AdminTableLoadingRow,
} from "@/components/admin/admin-state";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminServices } from "@/hooks/use-api";
import { apiClient } from "@/lib/api";
import { getLocalizedAdminValue } from "@/lib/admin-format";
import { Link, useRouter } from "@/lib/navigation";

const formatDeliveryProvider = (value: string) => {
  if (!value) return "-";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

export default function AdminServicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const { data: servicesData, loading: servicesLoading, refetch: refetchServices } = useAdminServices();
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();

  const manageTitle = t("admin.services.manage_title");
  const manageSubtitle = t("admin.services.manage_subtitle");
  const addService = t("admin.services.add_service");
  const searchPlaceholder = t("admin.services.search_placeholder");
  const statusFilterPlaceholder = t("admin.services.status_filter_placeholder");
  const filterAll = t("admin.services.filters.all");
  const statusActive = t("admin.services.statuses.ACTIVE");
  const statusDraft = t("admin.services.statuses.DRAFT");
  const statusSuspended = t("admin.services.statuses.SUSPENDED");
  const listTitle = t("admin.services.list_title");
  const listDescription = t("admin.services.list_description");
  const viewDetails = t("admin.services.view_details");
  const editLabel = t("admin.services.edit");
  const approveLabel = t("admin.services.approve");
  const featureLabel = t("admin.services.feature");
  const unfeatureLabel = t("admin.services.unfeature");
  const suspendLabel = t("admin.services.suspend");
  const deleteLabel = t("admin.services.delete");
  const confirmDeleteText = t("admin.services.confirm_delete");
  const errorPrefix = t("admin.services.error_prefix");
  const noServicesTitle = t("admin.services.no_services_title");
  const noServicesDescription = t("admin.services.no_services_description");
  const recommendedLabel = t("admin.services.recommended");

  const services = useMemo(() => {
    if (Array.isArray(servicesData?.services)) {
      return servicesData.services;
    }

    if (Array.isArray(servicesData)) {
      return servicesData;
    }

    return [];
  }, [servicesData]);

  const filteredServices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const statusFilterNorm = serviceFilter.toUpperCase();

    return services.filter((service: any) => {
      const name = getLocalizedAdminValue(service?.name, locale).toLowerCase();
      const description = getLocalizedAdminValue(service?.description, locale).toLowerCase();
      const status = String(service?.status ?? "").toUpperCase();

      const matchesSearch = !query || name.includes(query) || description.includes(query);
      const matchesFilter = statusFilterNorm === "ALL" || status === statusFilterNorm;

      return matchesSearch && matchesFilter;
    });
  }, [locale, searchTerm, serviceFilter, services]);

  const summaryCards = useMemo(() => {
    const ratedServices = services.filter((service: any) => typeof service?.rating === "number");
    const averageRating =
      ratedServices.length > 0
        ? (
            ratedServices.reduce((sum: number, service: any) => sum + Number(service.rating || 0), 0) /
            ratedServices.length
          ).toFixed(1)
        : "0.0";

    return [
      {
        title: t("admin.services.summary.cards.total"),
        value: services.length,
        icon: FileText,
        color: "bg-gradient-to-br from-primary to-emerald-400",
      },
      {
        title: t("admin.services.summary.cards.active"),
        value: services.filter((service: any) => String(service?.status).toUpperCase() === "ACTIVE").length,
        icon: CheckCircle,
        color: "bg-gradient-to-br from-blue-500 to-cyan-400",
      },
      {
        title: t("admin.services.summary.cards.featured"),
        value: services.filter((service: any) => Boolean(service?.isFeatured)).length,
        icon: Star,
        color: "bg-gradient-to-br from-amber-500 to-orange-400",
      },
      {
        title: t("admin.services.summary.cards.average_rating"),
        value: averageRating,
        icon: ArrowUpRight,
        color: "bg-gradient-to-br from-purple-500 to-pink-400",
      },
    ];
  }, [services, t]);

  const handleServiceAction = async (
    serviceId: string,
    action: "delete" | "activate" | "suspend" | "toggle-feature",
    service?: any
  ) => {
    try {
      if (action === "delete") {
        if (confirm(confirmDeleteText)) {
          await apiClient.deleteService(serviceId);
          await refetchServices();
        }
        return;
      }

      if (action === "toggle-feature") {
        await apiClient.updateService(serviceId, {
          is_featured: !service?.isFeatured,
          isFeatured: !service?.isFeatured,
        });
        await refetchServices();
        return;
      }

      await apiClient.updateServiceStatus(
        serviceId,
        action === "activate" ? "ACTIVE" : "SUSPENDED"
      );
      await refetchServices();
    } catch (error: any) {
      alert(errorPrefix + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = String(status).toUpperCase();

    if (normalizedStatus === "ACTIVE") {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {statusActive}
        </span>
      );
    }

    if (normalizedStatus === "SUSPENDED") {
      return (
        <span className="inline-flex items-center rounded-full bg-destructive/20 px-3 py-1 text-xs font-medium text-destructive">
          {statusSuspended}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
        {statusDraft}
      </span>
    );
  };

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={manageTitle}
          description={manageSubtitle}
          action={
            <Link href="/admin/services/new">
              <Button className="bg-primary text-white hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                {addService}
              </Button>
            </Link>
          }
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <AdminSummaryCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              colorClassName={card.color}
              delay={index * 0.08}
            />
          ))}
        </div>

        <AdminSectionCard
          delay={0.2}
          title={listTitle}
          description={listDescription.replace("{count}", String(filteredServices.length))}
        >
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
            <AdminSearchInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
            />

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="h-11 w-full border-border bg-transparent lg:w-56">
                <SelectValue placeholder={statusFilterPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{filterAll}</SelectItem>
                <SelectItem value="ACTIVE">{statusActive}</SelectItem>
                <SelectItem value="DRAFT">{statusDraft}</SelectItem>
                <SelectItem value="SUSPENDED">{statusSuspended}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.services.table.service")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.services.table.category")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.services.table.delivery_provider")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.services.table.status")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.services.table.performance")}
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-muted-foreground">
                    {t("admin.services.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {servicesLoading ? (
                  <AdminTableLoadingRow colSpan={6} />
                ) : filteredServices.length === 0 ? (
                  <AdminTableEmptyRow
                    colSpan={6}
                    icon={FileText}
                    title={noServicesTitle}
                    description={noServicesDescription}
                  />
                ) : (
                  filteredServices.map((service: any, index: number) => {
                    const serviceName = getLocalizedAdminValue(service?.name, locale);
                    const serviceDescription = getLocalizedAdminValue(service?.description, locale);
                    const categoryName =
                      getLocalizedAdminValue(service?.category?.name, locale) ||
                      service?.category?.name ||
                      "-";

                    return (
                      <motion.tr
                        key={String(service.id)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + index * 0.04, duration: 0.35 }}
                        className="group border-b border-border/50 transition-colors hover:bg-secondary/30"
                      >
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium">{serviceName}</p>
                              {service.isFeatured ? (
                                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                  {recommendedLabel}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="max-w-md text-xs text-muted-foreground line-clamp-2">
                              {serviceDescription}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("admin.services.slug_prefix")}
                              {service.slug}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{categoryName}</td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {formatDeliveryProvider(service.delivery_provider)}
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(service.status)}</td>
                        <td className="px-4 py-4">
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-medium">{service.rating || 0}</span>
                              <span className="text-muted-foreground">
                                ({t("admin.services.reviews", { count: service.reviewCount || 0 })})
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t("admin.services.orders", { count: service.orderCount || 0 })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("admin.services.views", { count: service.viewCount || 0 })}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-70 transition-opacity group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem onClick={() => router.push(`/admin/services/${service.id}/edit`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {viewDetails}
                              </DropdownMenuItem>

                              <DropdownMenuItem asChild>
                                <Link href={`/admin/services/${service.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  {editLabel}
                                </Link>
                              </DropdownMenuItem>

                              {String(service.status).toUpperCase() !== "ACTIVE" ? (
                                <DropdownMenuItem
                                  onClick={() => handleServiceAction(String(service.id), "activate", service)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  {approveLabel}
                                </DropdownMenuItem>
                              ) : null}

                              <DropdownMenuItem
                                onClick={() => handleServiceAction(String(service.id), "toggle-feature", service)}
                              >
                                <Star className="mr-2 h-4 w-4" />
                                {service.isFeatured ? unfeatureLabel : featureLabel}
                              </DropdownMenuItem>

                              {String(service.status).toUpperCase() !== "SUSPENDED" ? (
                                <DropdownMenuItem
                                  onClick={() => handleServiceAction(String(service.id), "suspend", service)}
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  {suspendLabel}
                                </DropdownMenuItem>
                              ) : null}

                              <DropdownMenuItem
                                onClick={() => handleServiceAction(String(service.id), "delete", service)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {deleteLabel}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </AdminSectionCard>
      </div>
    </ProjectAdminShell>
  );
}
