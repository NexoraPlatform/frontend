"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  ReceiptText,
  ShieldAlert,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AdminOrderStatusBadge, AdminPaymentStatusBadge } from "@/components/admin/order-badges";
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
  getAdminOrdersFallback,
  type AdminOrderFallback,
} from "@/lib/admin-orders-fallback";
import { Link } from "@/lib/navigation";

export default function AdminOrdersPage() {
  const locale = useLocale();
  const t = useTranslations();
  const dateLocale = locale === "ro" ? "ro-RO" : "en-US";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const ordersData = useMemo(() => ({ orders: getAdminOrdersFallback() }), []);
  const ordersLoading = false;

  const statusLabels = {
    PENDING: t("admin.orders.statuses.pending"),
    ACCEPTED: t("admin.orders.statuses.accepted"),
    IN_PROGRESS: t("admin.orders.statuses.in_progress"),
    DELIVERED: t("admin.orders.statuses.delivered"),
    COMPLETED: t("admin.orders.statuses.completed"),
    CANCELLED: t("admin.orders.statuses.cancelled"),
    DISPUTED: t("admin.orders.statuses.disputed"),
  } as const;

  const paymentStatusLabels = {
    PAID: t("admin.orders.payment_statuses.paid"),
    PENDING: t("admin.orders.payment_statuses.pending"),
    FAILED: t("admin.orders.payment_statuses.failed"),
    REFUNDED: t("admin.orders.payment_statuses.refunded"),
  } as const;

  const orders: AdminOrderFallback[] = useMemo(() => ordersData.orders || [], [ordersData]);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        [
          order.orderNumber,
          order.service?.title,
          order.service?.category?.name,
          order.client?.firstName,
          order.client?.lastName,
          order.client?.email,
          order.provider?.firstName,
          order.provider?.lastName,
          order.provider?.email,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesFilter = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [orders, searchTerm, statusFilter]);

  const summaryCards = useMemo(() => {
    const totalValue = orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);

    return [
      {
        title: t("admin.orders.summary.cards.total"),
        value: orders.length,
        icon: ReceiptText,
        color: "bg-gradient-to-br from-primary to-emerald-400",
      },
      {
        title: t("admin.orders.summary.cards.active"),
        value: orders.filter((order) =>
          ["ACCEPTED", "IN_PROGRESS", "DELIVERED"].includes(order.status)
        ).length,
        icon: BriefcaseBusiness,
        color: "bg-gradient-to-br from-blue-500 to-cyan-400",
      },
      {
        title: t("admin.orders.summary.cards.completed"),
        value: orders.filter((order) => order.status === "COMPLETED").length,
        icon: CheckCircle2,
        color: "bg-gradient-to-br from-emerald-500 to-lime-400",
      },
      {
        title: t("admin.orders.summary.cards.value"),
        value: <PriceDisplay value={totalValue} currency={orders[0]?.currency || "USD"} />,
        icon: ArrowUpRight,
        color: "bg-gradient-to-br from-purple-500 to-pink-400",
      },
    ];
  }, [orders, t]);

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={t("admin.orders.manage_title")}
          description={t("admin.orders.manage_subtitle")}
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
          title={t("admin.orders.list_title")}
          description={t("admin.orders.list_description", { count: filteredOrders.length })}
        >
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
            <AdminSearchInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("admin.orders.search_placeholder")}
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 w-full border-border bg-transparent lg:w-56">
                <SelectValue placeholder={t("admin.orders.status_filter_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.orders.statuses.all")}</SelectItem>
                <SelectItem value="PENDING">{t("admin.orders.statuses.pending")}</SelectItem>
                <SelectItem value="ACCEPTED">{t("admin.orders.statuses.accepted")}</SelectItem>
                <SelectItem value="IN_PROGRESS">
                  {t("admin.orders.statuses.in_progress")}
                </SelectItem>
                <SelectItem value="DELIVERED">{t("admin.orders.statuses.delivered")}</SelectItem>
                <SelectItem value="COMPLETED">
                  {t("admin.orders.statuses.completed")}
                </SelectItem>
                <SelectItem value="CANCELLED">
                  {t("admin.orders.statuses.cancelled")}
                </SelectItem>
                <SelectItem value="DISPUTED">{t("admin.orders.statuses.disputed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.orders.table.project")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.orders.table.client")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.orders.table.provider")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.orders.table.value")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.orders.table.timeline")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.orders.table.status")}
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground">
                    {t("admin.orders.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? <AdminTableLoadingRow colSpan={7} /> : null}

                {!ordersLoading &&
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border/70 transition-colors hover:bg-secondary/20"
                    >
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-[230px] space-y-1">
                          <p className="font-semibold text-foreground">
                            #{order.orderNumber}
                          </p>
                          <p className="font-medium text-primary">{order.service.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.service.category.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-[180px] space-y-1">
                          <p className="font-medium text-foreground">
                            {order.client.firstName} {order.client.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{order.client.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-[180px] space-y-1">
                          <p className="font-medium text-foreground">
                            {order.provider.firstName} {order.provider.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{order.provider.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-[140px] space-y-1">
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                            <PriceDisplay value={order.amount} currency={order.currency} />
                          </p>
                          <AdminPaymentStatusBadge
                            status={order.paymentStatus}
                            label={paymentStatusLabels[order.paymentStatus]}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-[190px] space-y-1 text-sm">
                          <p className="text-foreground">
                            {t("admin.orders.table.created_at", {
                              date: new Date(order.createdAt).toLocaleDateString(dateLocale),
                            })}
                          </p>
                          <p className="text-muted-foreground">
                            {t("admin.orders.table.delivery_due", {
                              date: new Date(order.deliveryDate).toLocaleDateString(dateLocale),
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-[150px]">
                          <AdminOrderStatusBadge
                            status={order.status}
                            label={statusLabels[order.status]}
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
                              <Link href={`/admin/orders/${order.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t("admin.orders.view_details")}
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}

                {!ordersLoading && filteredOrders.length === 0 ? (
                  <AdminTableEmptyRow
                    colSpan={7}
                    icon={ShieldAlert}
                    title={t("admin.orders.no_orders_title")}
                    description={t("admin.orders.no_orders_description")}
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
