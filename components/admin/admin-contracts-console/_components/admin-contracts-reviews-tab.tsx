import { MessageSquareText } from "lucide-react";
import { useTranslations } from "next-intl";

import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminTableLoadingRow } from "@/components/admin/admin-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { AdminContractsConsoleController } from "../_hooks/use-admin-contracts-console-controller";
import {
  AdminErrorBanner,
  EmptyTableMessage,
  formatDateTime,
  getToneClass,
  humanizeCode,
} from "../_lib/admin-contracts-console-helpers";
import {
  CONTRACT_STATUS_OPTIONS,
  REVIEW_PRIORITY_OPTIONS,
  REVIEW_STATUS_OPTIONS,
} from "../_lib/admin-contracts-console-types";

type AdminContractsReviewsTabProps = Pick<
  AdminContractsConsoleController,
  | "locale"
  | "openReviewDialog"
  | "reviewContractStatus"
  | "reviewPage"
  | "reviewPriority"
  | "reviewSearch"
  | "reviewStatus"
  | "reviews"
  | "reviewsError"
  | "reviewsLoading"
  | "setReviewContractStatus"
  | "setReviewPage"
  | "setReviewPriority"
  | "setReviewSearch"
  | "setReviewStatus"
>;

export function AdminContractsReviewsTab({
  locale,
  openReviewDialog,
  reviewContractStatus,
  reviewPage,
  reviewPriority,
  reviewSearch,
  reviewStatus,
  reviews,
  reviewsError,
  reviewsLoading,
  setReviewContractStatus,
  setReviewPage,
  setReviewPriority,
  setReviewSearch,
  setReviewStatus,
}: AdminContractsReviewsTabProps) {
  const t = useTranslations("admin.contracts");

  return (
    <div className="space-y-6">
      <AdminErrorBanner title={t("reviews_tab.errors.title")} message={reviewsError} />

      <AdminSectionCard
        title={t("reviews_tab.filters.title")}
        description={t("reviews_tab.filters.description")}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <AdminSearchInput
            value={reviewSearch}
            onChange={(event) => {
              setReviewSearch(event.target.value);
              setReviewPage(1);
            }}
            placeholder={t("reviews_tab.filters.search")}
            className="relative xl:col-span-2"
          />
          <Select
            value={reviewStatus}
            onValueChange={(value) => {
              setReviewStatus(value);
              setReviewPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("reviews_tab.filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {REVIEW_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {humanizeCode(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={reviewPriority}
            onValueChange={(value) => {
              setReviewPriority(value);
              setReviewPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("reviews_tab.filters.priority")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {REVIEW_PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {humanizeCode(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={reviewContractStatus}
            onValueChange={(value) => {
              setReviewContractStatus(value);
              setReviewPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("reviews_tab.filters.contract_status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {CONTRACT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {humanizeCode(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title={t("reviews_tab.list.title")}
        description={t("reviews_tab.list.description", {
          count: reviews?.total ?? 0,
        })}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t("reviews_tab.table.contract")}</th>
                <th className="px-4 py-3">{t("reviews_tab.table.status")}</th>
                <th className="px-4 py-3">{t("reviews_tab.table.priority")}</th>
                <th className="px-4 py-3">{t("reviews_tab.table.assigned_to")}</th>
                <th className="px-4 py-3">{t("reviews_tab.table.due_at")}</th>
                <th className="px-4 py-3">{t("reviews_tab.table.comments")}</th>
                <th className="px-4 py-3">{t("reviews_tab.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {reviewsLoading ? <AdminTableLoadingRow colSpan={7} /> : null}
              {!reviewsLoading && (reviews?.data.length ?? 0) === 0 ? (
                <EmptyTableMessage
                  icon={MessageSquareText}
                  title={t("reviews_tab.empty_title")}
                  description={t("reviews_tab.empty_description")}
                  colSpan={7}
                />
              ) : null}
              {!reviewsLoading
                ? reviews?.data.map((review) => (
                    <tr
                      key={review.id}
                      className="border-b border-border/60 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium">
                          {review.contract?.reference ?? t("common.unavailable")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {review.review_summary ?? t("reviews_tab.no_summary")}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className={getToneClass(review.status)}>
                          {humanizeCode(review.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {review.priority ? humanizeCode(review.priority) : "—"}
                      </td>
                      <td className="px-4 py-4">
                        {review.assigned_to_user?.name ??
                          review.assigned_to_user?.email ??
                          "—"}
                      </td>
                      <td className="px-4 py-4">
                        {formatDateTime(review.due_at, locale) ?? "—"}
                      </td>
                      <td className="px-4 py-4">{review.comments_count}</td>
                      <td className="px-4 py-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewDialog(review.id)}
                        >
                          {t("common.view")}
                        </Button>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>
            {t("common.pagination", {
              current: reviews?.current_page ?? 1,
              total: reviews?.last_page ?? 1,
            })}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={(reviews?.current_page ?? 1) <= 1}
              onClick={() => setReviewPage((current) => Math.max(1, current - 1))}
            >
              {t("common.previous")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={(reviews?.current_page ?? 1) >= (reviews?.last_page ?? 1)}
              onClick={() =>
                setReviewPage((current) =>
                  Math.min(reviews?.last_page ?? current, current + 1)
                )
              }
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      </AdminSectionCard>
    </div>
  );
}
