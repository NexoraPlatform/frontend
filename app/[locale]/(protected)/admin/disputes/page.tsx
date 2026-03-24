"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Eye,
  MoreHorizontal,
  Scale,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  AdminDisputePriorityBadge,
  AdminDisputeStatusBadge,
} from "@/components/admin/dispute-badges";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import {
  AdminTableEmptyRow,
  AdminTableLoadingRow,
} from "@/components/admin/admin-state";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { PriceDisplay } from "@/components/PriceDisplay";
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
import {
  getAdminDisputesFallback,
  type AdminDisputeFallback,
} from "@/lib/admin-disputes-fallback";
import { Link } from "@/lib/navigation";

export default function AdminDisputesPage() {
  const locale = useLocale();
  const t = useTranslations();
  const dateLocale = locale === "ro" ? "ro-RO" : "en-US";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const disputesData = useMemo(() => ({ disputes: getAdminDisputesFallback() }), []);
  const disputesLoading = false;

  const disputes: AdminDisputeFallback[] = useMemo(
    () => disputesData.disputes || [],
    [disputesData]
  );

  const statusLabels = {
    OPEN: t("admin.disputes.statuses.open"),
    UNDER_REVIEW: t("admin.disputes.statuses.under_review"),
    ESCALATED: t("admin.disputes.statuses.escalated"),
    RESOLVED: t("admin.disputes.statuses.resolved"),
  } as const;

  const priorityLabels = {
    LOW: t("admin.disputes.priorities.low"),
    MEDIUM: t("admin.disputes.priorities.medium"),
    HIGH: t("admin.disputes.priorities.high"),
    CRITICAL: t("admin.disputes.priorities.critical"),
  } as const;

  const roleLabels = {
    CLIENT: t("admin.disputes.roles.client"),
    PROVIDER: t("admin.disputes.roles.provider"),
  } as const;

  const filteredDisputes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return disputes.filter((dispute) => {
      const matchesSearch =
        !query ||
        [
          dispute.caseNumber,
          dispute.orderNumber,
          dispute.subject,
          dispute.category,
          dispute.summary,
          dispute.claimantName,
          dispute.respondentName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || dispute.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || dispute.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [disputes, priorityFilter, searchTerm, statusFilter]);

  const summaryCards = useMemo(() => {
    const atRiskValue = disputes
      .filter((dispute) => dispute.status !== "RESOLVED")
      .reduce((sum, dispute) => sum + Number(dispute.amount || 0), 0);

    return [
      {
        title: t("admin.disputes.summary.cards.total"),
        value: disputes.length,
        icon: Scale,
        color: "bg-gradient-to-br from-primary to-emerald-400",
      },
      {
        title: t("admin.disputes.summary.cards.open"),
        value: disputes.filter((dispute) =>
          ["OPEN", "UNDER_REVIEW"].includes(dispute.status)
        ).length,
        icon: ShieldAlert,
        color: "bg-gradient-to-br from-amber-500 to-orange-400",
      },
      {
        title: t("admin.disputes.summary.cards.escalated"),
        value: disputes.filter((dispute) => dispute.status === "ESCALATED").length,
        icon: AlertTriangle,
        color: "bg-gradient-to-br from-rose-500 to-red-400",
      },
      {
        title: t("admin.disputes.summary.cards.value_at_risk"),
        value: <PriceDisplay value={atRiskValue} currency={disputes[0]?.currency || "USD"} />,
        icon: ArrowUpRight,
        color: "bg-gradient-to-br from-purple-500 to-pink-400",
      },
    ];
  }, [disputes, t]);

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={t("admin.disputes.manage_title")}
          description={t("admin.disputes.manage_subtitle")}
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <AdminSummaryCard
              key={String(card.title)}
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
          title={t("admin.disputes.list_title")}
          description={t("admin.disputes.list_description", {
            count: filteredDisputes.length,
          })}
        >
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center">
            <AdminSearchInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("admin.disputes.search_placeholder")}
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 w-full border-border bg-transparent xl:w-56">
                <SelectValue placeholder={t("admin.disputes.status_filter_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.disputes.statuses.all")}</SelectItem>
                <SelectItem value="OPEN">{t("admin.disputes.statuses.open")}</SelectItem>
                <SelectItem value="UNDER_REVIEW">
                  {t("admin.disputes.statuses.under_review")}
                </SelectItem>
                <SelectItem value="ESCALATED">
                  {t("admin.disputes.statuses.escalated")}
                </SelectItem>
                <SelectItem value="RESOLVED">
                  {t("admin.disputes.statuses.resolved")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-11 w-full border-border bg-transparent xl:w-56">
                <SelectValue placeholder={t("admin.disputes.priority_filter_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.disputes.priorities.all")}</SelectItem>
                <SelectItem value="LOW">{t("admin.disputes.priorities.low")}</SelectItem>
                <SelectItem value="MEDIUM">
                  {t("admin.disputes.priorities.medium")}
                </SelectItem>
                <SelectItem value="HIGH">{t("admin.disputes.priorities.high")}</SelectItem>
                <SelectItem value="CRITICAL">
                  {t("admin.disputes.priorities.critical")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.disputes.table.case")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.disputes.table.order")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.disputes.table.parties")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.disputes.table.priority")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.disputes.table.value")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.disputes.table.status")}
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground">
                    {t("admin.disputes.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {disputesLoading ? <AdminTableLoadingRow colSpan={7} /> : null}

                {!disputesLoading &&
                  filteredDisputes.map((dispute) => (
                    <tr
                      key={dispute.id}
                      className="border-b border-border/70 transition-colors hover:bg-secondary/20"
                    >
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-[230px] space-y-1">
                          <p className="font-semibold text-foreground">{dispute.caseNumber}</p>
                          <p className="font-medium text-primary">{dispute.subject}</p>
                          <p className="text-sm text-muted-foreground">{dispute.category}</p>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {dispute.summary}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-[170px] space-y-1">
                          <p className="font-medium text-foreground">
                            #{dispute.orderNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("admin.disputes.table.opened_at", {
                              date: new Date(dispute.createdAt).toLocaleDateString(dateLocale),
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-[220px] space-y-2">
                          <p className="text-sm font-medium text-foreground">
                            {roleLabels[dispute.claimantRole]}: {dispute.claimantName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("admin.disputes.table.against")}: {dispute.respondentName}
                          </p>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            {t("admin.disputes.table.evidence_count", {
                              count: dispute.evidenceCount,
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-[140px] space-y-2">
                          <AdminDisputePriorityBadge
                            priority={dispute.priority}
                            label={priorityLabels[dispute.priority]}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-[140px] space-y-1">
                          <p className="font-semibold text-foreground">
                            <PriceDisplay value={dispute.amount} currency={dispute.currency} />
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("admin.disputes.table.updated_at", {
                              date: new Date(dispute.updatedAt).toLocaleDateString(dateLocale),
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-[150px]">
                          <AdminDisputeStatusBadge
                            status={dispute.status}
                            label={statusLabels[dispute.status]}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right align-top">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/orders/${dispute.orderId}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t("admin.disputes.view_related_order")}
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}

                {!disputesLoading && filteredDisputes.length === 0 ? (
                  <AdminTableEmptyRow
                    colSpan={7}
                    icon={ShieldCheck}
                    title={t("admin.disputes.empty_title")}
                    description={t("admin.disputes.empty_description")}
                  />
                ) : null}
              </tbody>
            </table>
          </div>
        </AdminSectionCard>
      </div>
    </ProjectAdminShell>
  );
}
