import { Loader2, SquarePen } from "lucide-react";
import { useTranslations } from "next-intl";

import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSpinner } from "@/components/admin/admin-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { REVIEW_COMMENT_TYPE_OPTIONS } from "@/lib/admin-contracts";

import type { AdminContractsConsoleController } from "../_hooks/use-admin-contracts-console-controller";
import {
  AdminErrorBanner,
  formatDateTime,
  getToneClass,
  humanizeCode,
} from "../_lib/admin-contracts-console-helpers";

type AdminContractsReviewDialogProps = Pick<
  AdminContractsConsoleController,
  | "canApproveReviews"
  | "canAssignReviews"
  | "canCreateReviewComments"
  | "canRejectReviews"
  | "canRequestReviewChanges"
  | "canStartReviews"
  | "handleCreateReviewComment"
  | "handleReviewAction"
  | "locale"
  | "reviewActionLoading"
  | "reviewActionMode"
  | "reviewAssignComment"
  | "reviewAssignUserId"
  | "reviewCommentBody"
  | "reviewCommentLoading"
  | "reviewCommentType"
  | "reviewDecisionNotes"
  | "reviewDetail"
  | "reviewDetailError"
  | "reviewDetailLoading"
  | "reviewDialogOpen"
  | "reviewRequestedChanges"
  | "reviewRequestedChangesComment"
  | "reviewStartComment"
  | "setReviewActionMode"
  | "setReviewAssignComment"
  | "setReviewAssignUserId"
  | "setReviewCommentBody"
  | "setReviewCommentType"
  | "setReviewDecisionNotes"
  | "setReviewDialogOpen"
  | "setReviewRequestedChanges"
  | "setReviewRequestedChangesComment"
  | "setReviewStartComment"
>;

export function AdminContractsReviewDialog({
  canApproveReviews,
  canAssignReviews,
  canCreateReviewComments,
  canRejectReviews,
  canRequestReviewChanges,
  canStartReviews,
  handleCreateReviewComment,
  handleReviewAction,
  locale,
  reviewActionLoading,
  reviewActionMode,
  reviewAssignComment,
  reviewAssignUserId,
  reviewCommentBody,
  reviewCommentLoading,
  reviewCommentType,
  reviewDecisionNotes,
  reviewDetail,
  reviewDetailError,
  reviewDetailLoading,
  reviewDialogOpen,
  reviewRequestedChanges,
  reviewRequestedChangesComment,
  reviewStartComment,
  setReviewActionMode,
  setReviewAssignComment,
  setReviewAssignUserId,
  setReviewCommentBody,
  setReviewCommentType,
  setReviewDecisionNotes,
  setReviewDialogOpen,
  setReviewRequestedChanges,
  setReviewRequestedChangesComment,
  setReviewStartComment,
}: AdminContractsReviewDialogProps) {
  const t = useTranslations("admin.contracts");

  return (
    <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("review_detail.title")}</DialogTitle>
          <DialogDescription>{t("review_detail.description")}</DialogDescription>
        </DialogHeader>

        <AdminErrorBanner
          title={t("review_detail.errors.title")}
          message={reviewDetailError}
        />

        {reviewDetailLoading ? (
          <div className="py-10">
            <AdminSpinner />
          </div>
        ) : reviewDetail ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={getToneClass(reviewDetail.status)}>
                {humanizeCode(reviewDetail.status)}
              </Badge>
              {reviewDetail.priority ? (
                <Badge variant="outline">{humanizeCode(reviewDetail.priority)}</Badge>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("review_detail.labels.contract")}
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {reviewDetail.contract?.reference ?? t("common.unavailable")}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("review_detail.labels.assigned_to")}
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {reviewDetail.assigned_to_user?.name ??
                    reviewDetail.assigned_to_user?.email ??
                    t("common.unavailable")}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("review_detail.labels.opened_at")}
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {formatDateTime(reviewDetail.opened_at, locale) ??
                    t("common.unavailable")}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("review_detail.labels.due_at")}
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {formatDateTime(reviewDetail.due_at, locale) ??
                    t("common.unavailable")}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-sm font-semibold">
                {reviewDetail.review_summary ?? t("review_detail.no_summary")}
              </div>
              {reviewDetail.review_reason_codes.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {reviewDetail.review_reason_codes.map((reason) => (
                    <Badge key={reason} variant="outline">
                      {humanizeCode(reason)}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {reviewDetail.requested_changes.length > 0 ? (
                <div className="mt-4">
                  <div className="text-sm font-medium">
                    {t("review_detail.labels.requested_changes")}
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {reviewDetail.requested_changes.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {reviewDetail.final_decision_notes ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm">
                  {reviewDetail.final_decision_notes}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {canAssignReviews ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewActionMode("assign")}
                >
                  {t("review_detail.actions.assign")}
                </Button>
              ) : null}
              {canStartReviews ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewActionMode("start")}
                >
                  {t("review_detail.actions.start")}
                </Button>
              ) : null}
              {canRequestReviewChanges ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewActionMode("request_changes")}
                >
                  {t("review_detail.actions.request_changes")}
                </Button>
              ) : null}
              {canApproveReviews ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewActionMode("approve")}
                >
                  {t("review_detail.actions.approve")}
                </Button>
              ) : null}
              {canRejectReviews ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewActionMode("reject")}
                >
                  {t("review_detail.actions.reject")}
                </Button>
              ) : null}
            </div>

            {reviewActionMode ? (
              <AdminSectionCard
                title={t(`review_detail.actions.${reviewActionMode}` as never)}
                description={t("review_detail.action_description")}
              >
                <div className="space-y-3">
                  {reviewActionMode === "assign" ? (
                    <>
                      <Input
                        value={reviewAssignUserId}
                        onChange={(event) => setReviewAssignUserId(event.target.value)}
                        placeholder={t("review_detail.placeholders.assigned_user_id")}
                      />
                      <Textarea
                        value={reviewAssignComment}
                        onChange={(event) => setReviewAssignComment(event.target.value)}
                        placeholder={t("review_detail.placeholders.comment")}
                        rows={3}
                      />
                    </>
                  ) : null}
                  {reviewActionMode === "start" ? (
                    <Textarea
                      value={reviewStartComment}
                      onChange={(event) => setReviewStartComment(event.target.value)}
                      placeholder={t("review_detail.placeholders.comment")}
                      rows={3}
                    />
                  ) : null}
                  {reviewActionMode === "request_changes" ? (
                    <>
                      <Textarea
                        value={reviewRequestedChanges}
                        onChange={(event) => setReviewRequestedChanges(event.target.value)}
                        placeholder={t("review_detail.placeholders.requested_changes")}
                        rows={4}
                      />
                      <Textarea
                        value={reviewRequestedChangesComment}
                        onChange={(event) =>
                          setReviewRequestedChangesComment(event.target.value)
                        }
                        placeholder={t("review_detail.placeholders.comment")}
                        rows={3}
                      />
                    </>
                  ) : null}
                  {reviewActionMode === "approve" || reviewActionMode === "reject" ? (
                    <Textarea
                      value={reviewDecisionNotes}
                      onChange={(event) => setReviewDecisionNotes(event.target.value)}
                      placeholder={t("review_detail.placeholders.notes")}
                      rows={4}
                    />
                  ) : null}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        void handleReviewAction();
                      }}
                      disabled={reviewActionLoading === reviewActionMode}
                    >
                      {reviewActionLoading === reviewActionMode ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t("review_detail.actions.submit")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReviewActionMode(null)}
                    >
                      {t("review_detail.actions.cancel")}
                    </Button>
                  </div>
                </div>
              </AdminSectionCard>
            ) : null}

            <AdminSectionCard
              title={t("review_detail.comments_title")}
              description={t("review_detail.comments_description")}
            >
              {canCreateReviewComments ? (
                <div className="mb-4 grid gap-3 md:grid-cols-[220px,1fr,auto]">
                  <Select
                    value={reviewCommentType}
                    onValueChange={(value) =>
                      setReviewCommentType(
                        value as (typeof REVIEW_COMMENT_TYPE_OPTIONS)[number]
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REVIEW_COMMENT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {humanizeCode(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={reviewCommentBody}
                    onChange={(event) => setReviewCommentBody(event.target.value)}
                    placeholder={t("review_detail.placeholders.comment")}
                    rows={3}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      void handleCreateReviewComment();
                    }}
                    disabled={reviewCommentLoading}
                  >
                    {reviewCommentLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <SquarePen className="mr-2 h-4 w-4" />
                    )}
                    {t("review_detail.actions.add_comment")}
                  </Button>
                </div>
              ) : null}

              <div className="space-y-3">
                {reviewDetail.comments.length > 0 ? (
                  reviewDetail.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{humanizeCode(comment.comment_type)}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(comment.created_at, locale) ?? "—"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm">{comment.body}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {comment.author_user?.name ?? comment.author_user?.email ?? "—"}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("review_detail.no_comments")}
                  </p>
                )}
              </div>
            </AdminSectionCard>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
