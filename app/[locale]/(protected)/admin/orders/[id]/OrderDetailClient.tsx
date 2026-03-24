"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  MessageSquare,
  Save,
  UserRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AdminOrderStatusBadge, AdminPaymentStatusBadge } from "@/components/admin/order-badges";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import {
  AdminOverviewItem,
  AdminSidebarCard,
} from "@/components/admin/admin-sidebar-card";
import { AdminSpinner } from "@/components/admin/admin-state";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { PriceDisplay } from "@/components/PriceDisplay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminOrderFallbackById,
  type AdminOrderFallback,
  type AdminOrderStatus,
} from "@/lib/admin-orders-fallback";

export default function OrderDetailClient({ id }: { id: string }) {
  const locale = useLocale();
  const t = useTranslations();
  const dateLocale = locale === "ro" ? "ro-RO" : "en-US";
  const [order, setOrder] = useState<AdminOrderFallback | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [newStatus, setNewStatus] = useState<AdminOrderStatus | "">("");
  const [adminNotes, setAdminNotes] = useState("");

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
    PENDING: t("admin.orders.payment_statuses.pending"),
    PAID: t("admin.orders.payment_statuses.paid"),
    FAILED: t("admin.orders.payment_statuses.failed"),
    REFUNDED: t("admin.orders.payment_statuses.refunded"),
  } as const;

  const loadOrder = useCallback(async () => {
    try {
      const fallbackOrder = getAdminOrderFallbackById(id);

      if (!fallbackOrder) {
        setOrder(null);
        return;
      }

      setOrder(fallbackOrder);
      setNewStatus(fallbackOrder.status);
      setAdminNotes(fallbackOrder.providerNotes ?? "");
      setError("");
    } catch {
      setError(t("admin.orders.load_error"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const updateOrderStatus = async () => {
    setUpdating(true);
    try {
      setOrder((prev) => {
        if (!prev || !newStatus) return prev;

        return {
          ...prev,
          status: newStatus,
          providerNotes: adminNotes || prev.providerNotes,
        };
      });
      setError("");
    } catch {
      setError(t("admin.orders.update_error"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <ProjectAdminShell>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <AdminSpinner />
        </div>
      </ProjectAdminShell>
    );
  }

  if (!order) {
    return (
      <ProjectAdminShell>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t("admin.orders.not_found")}</AlertDescription>
          </Alert>
        </div>
      </ProjectAdminShell>
    );
  }

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          backHref="/admin/orders"
          title={`${t("admin.orders.order_label")} #${order.orderNumber}`}
          description={t("admin.orders.detail_subtitle")}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <AdminOrderStatusBadge
                status={order.status}
                label={statusLabels[order.status]}
              />
              <AdminPaymentStatusBadge
                status={order.paymentStatus}
                label={paymentStatusLabels[order.paymentStatus]}
              />
            </div>
          }
        />

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <AdminSectionCard title={t("admin.orders.details_title")} delay={0.08}>
              <div className="space-y-6">
                <div className="rounded-2xl border border-border/60 bg-background/40 p-5">
                  <p className="text-lg font-semibold text-primary">{order.service.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("admin.orders.category_label")} {order.service.category.name}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("admin.orders.requirements_title")}
                  </h4>
                  <div className="rounded-2xl border border-border/60 bg-background/40 p-5 text-sm text-foreground">
                    {order.requirements}
                  </div>
                </div>

                {order.clientNotes ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {t("admin.orders.client_notes_title")}
                    </h4>
                    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5 text-sm text-foreground">
                      {order.clientNotes}
                    </div>
                  </div>
                ) : null}

                {order.providerNotes ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {t("admin.orders.provider_notes_title")}
                    </h4>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-foreground">
                      {order.providerNotes}
                    </div>
                  </div>
                ) : null}

                {order.deliverables.length ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {t("admin.orders.deliverables_title")}
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {order.deliverables.map((deliverable) => (
                        <div
                          key={deliverable}
                          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/40 p-4"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <span className="text-sm text-foreground">{deliverable}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </AdminSectionCard>

            <AdminSectionCard title={t("admin.orders.participants_title")} delay={0.16}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/40 p-5">
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-sky-500">
                    {t("admin.orders.client_label")}
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">
                      {order.client.firstName} {order.client.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.client.email}</p>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {t("admin.orders.message_button")}
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/40 p-5">
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-500">
                    {t("admin.orders.provider_label")}
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">
                      {order.provider.firstName} {order.provider.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.provider.email}</p>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {t("admin.orders.message_button")}
                    </Button>
                  </div>
                </div>
              </div>
            </AdminSectionCard>
          </div>

          <div className="space-y-6">
            <AdminSidebarCard
              icon={FileText}
              title={t("admin.orders.financial_title")}
              delay={0.1}
            >
              <div className="space-y-3">
                <AdminOverviewItem
                  label={t("admin.orders.order_value_label")}
                  value={<PriceDisplay value={order.amount} currency={order.currency} />}
                  valueClassName="text-base font-semibold text-emerald-600 dark:text-emerald-400"
                />
                <AdminOverviewItem
                  label={t("admin.orders.platform_fee_label")}
                  value={<PriceDisplay value={order.amount * 0.05} currency={order.currency} />}
                />
                <AdminOverviewItem
                  label={t("admin.orders.provider_receives_label")}
                  value={<PriceDisplay value={order.amount * 0.95} currency={order.currency} />}
                />
                <AdminOverviewItem label={t("admin.orders.payment_status_label")}>
                  <div className="mt-2">
                    <AdminPaymentStatusBadge
                      status={order.paymentStatus}
                      label={paymentStatusLabels[order.paymentStatus]}
                    />
                  </div>
                </AdminOverviewItem>
              </div>
            </AdminSidebarCard>

            <AdminSidebarCard
              icon={UserRound}
              title={t("admin.orders.timeline_title")}
              delay={0.18}
            >
              <div className="space-y-3">
                <AdminOverviewItem
                  label={t("admin.orders.order_placed_label")}
                  value={new Date(order.createdAt).toLocaleDateString(dateLocale)}
                />
                <AdminOverviewItem
                  label={t("admin.orders.delivery_due_label")}
                  value={new Date(order.deliveryDate).toLocaleDateString(dateLocale)}
                />
                <AdminOverviewItem label={t("admin.orders.current_status_label")}>
                  <div className="mt-2">
                    <AdminOrderStatusBadge
                      status={order.status}
                      label={statusLabels[order.status]}
                    />
                  </div>
                </AdminOverviewItem>
              </div>
            </AdminSidebarCard>

            <AdminSidebarCard
              icon={Save}
              title={t("admin.orders.admin_actions_title")}
              delay={0.26}
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    {t("admin.orders.update_status_label")}
                  </label>
                  <Select
                    value={newStatus}
                    onValueChange={(value) => setNewStatus(value as AdminOrderStatus)}
                  >
                    <SelectTrigger className="border-slate-300/80 bg-white shadow-sm dark:border-border dark:bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">{statusLabels.PENDING}</SelectItem>
                      <SelectItem value="ACCEPTED">{statusLabels.ACCEPTED}</SelectItem>
                      <SelectItem value="IN_PROGRESS">{statusLabels.IN_PROGRESS}</SelectItem>
                      <SelectItem value="DELIVERED">{statusLabels.DELIVERED}</SelectItem>
                      <SelectItem value="COMPLETED">{statusLabels.COMPLETED}</SelectItem>
                      <SelectItem value="CANCELLED">{statusLabels.CANCELLED}</SelectItem>
                      <SelectItem value="DISPUTED">{statusLabels.DISPUTED}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    {t("admin.orders.admin_notes_label")}
                  </label>
                  <Textarea
                    value={adminNotes}
                    onChange={(event) => setAdminNotes(event.target.value)}
                    placeholder={t("admin.orders.admin_notes_placeholder")}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={updateOrderStatus}
                  disabled={updating}
                  className="w-full bg-primary text-white hover:bg-primary/90"
                >
                  {updating ? t("admin.orders.updating") : t("admin.orders.save_changes")}
                </Button>

                <div className="grid gap-3">
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    {t("admin.orders.download_invoice")}
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {t("admin.orders.message_history")}
                  </Button>
                </div>
              </div>
            </AdminSidebarCard>
          </div>
        </div>
      </div>
    </ProjectAdminShell>
  );
}
