import { Clock3, FileSignature, MessageSquareText, Signature } from "lucide-react";
import { useTranslations } from "next-intl";

import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import { Badge } from "@/components/ui/badge";

import { AdminErrorBanner } from "../_lib/admin-contracts-console-helpers";
import type { AdminContractsConsoleController } from "../_hooks/use-admin-contracts-console-controller";

type AdminContractsOverviewTabProps = Pick<
  AdminContractsConsoleController,
  "stats" | "statsError" | "statsLoading"
>;

export function AdminContractsOverviewTab({
  stats,
  statsError,
  statsLoading,
}: AdminContractsOverviewTabProps) {
  const t = useTranslations("admin.contracts");

  return (
    <div className="space-y-6">
      <AdminErrorBanner title={t("overview.errors.title")} message={statsError} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard
          title={t("overview.cards.contracts")}
          value={statsLoading ? "…" : stats?.contracts.total ?? 0}
          icon={FileSignature}
          colorClassName="bg-gradient-to-br from-sky-500 to-cyan-400"
        />
        <AdminSummaryCard
          title={t("overview.cards.reviews")}
          value={statsLoading ? "…" : stats?.reviews.open_like_total ?? 0}
          icon={MessageSquareText}
          colorClassName="bg-gradient-to-br from-amber-500 to-orange-400"
          badge={
            <Badge variant="outline">
              {t("overview.cards.urgent_badge", {
                count: stats?.reviews.urgent_total ?? 0,
              })}
            </Badge>
          }
        />
        <AdminSummaryCard
          title={t("overview.cards.signatures")}
          value={statsLoading ? "…" : stats?.signatures.active_total ?? 0}
          icon={Signature}
          colorClassName="bg-gradient-to-br from-emerald-500 to-teal-400"
          badge={
            <Badge variant="outline">
              {t("overview.cards.stalled_badge", {
                count: stats?.signatures.stalled_total ?? 0,
              })}
            </Badge>
          }
        />
        <AdminSummaryCard
          title={t("overview.cards.obligations")}
          value={statsLoading ? "…" : stats?.obligations.overdue_total ?? 0}
          icon={Clock3}
          colorClassName="bg-gradient-to-br from-rose-500 to-pink-400"
          badge={
            <Badge variant="outline">
              {t("overview.cards.due_soon_badge", {
                count: stats?.obligations.due_soon_total ?? 0,
              })}
            </Badge>
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
        <AdminSectionCard
          title={t("overview.operational.title")}
          description={t("overview.operational.description")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-sm font-semibold">
                {t("overview.operational.flow_status_title")}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("overview.operational.flow_status_body")}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-sm font-semibold">
                {t("overview.operational.upload_title")}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("overview.operational.upload_body")}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-sm font-semibold">
                {t("overview.operational.backfill_title")}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("overview.operational.backfill_body")}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-sm font-semibold">
                {t("overview.operational.business_title")}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("overview.operational.business_body")}
              </p>
            </div>
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          title={t("overview.error_reference.title")}
          description={t("overview.error_reference.description")}
        >
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
              <div className="font-semibold">401</div>
              <div className="text-muted-foreground">
                {t("overview.error_reference.unauthenticated")}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
              <div className="font-semibold">403</div>
              <div className="text-muted-foreground">
                {t("overview.error_reference.forbidden")}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
              <div className="font-semibold">404</div>
              <div className="text-muted-foreground">
                {t("overview.error_reference.not_found")}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
              <div className="font-semibold">422</div>
              <div className="text-muted-foreground">
                {t("overview.error_reference.validation")}
              </div>
            </div>
          </div>
        </AdminSectionCard>
      </div>
    </div>
  );
}
