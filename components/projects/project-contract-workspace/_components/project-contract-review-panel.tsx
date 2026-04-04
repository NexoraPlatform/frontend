import { AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import type { ProjectContractWorkspaceController } from '../_hooks/use-project-contract-workspace-controller';
import {
  formatDateTime,
  getProcessTone,
  humanizeCode,
} from '../_lib/project-contract-workspace-helpers';

type ProjectContractReviewPanelProps = Pick<
  ProjectContractWorkspaceController,
  | 'activeReview'
  | 'assignReviewForm'
  | 'canApproveManualReview'
  | 'canAssignManualReview'
  | 'canOpenManualReview'
  | 'canReadAdminContract'
  | 'canRejectManualReview'
  | 'canRequestManualReviewChanges'
  | 'canStartManualReview'
  | 'decisionNotes'
  | 'effectiveSummary'
  | 'handleOpenManualReview'
  | 'handleSubmitReviewAction'
  | 'locale'
  | 'openReviewForm'
  | 'operationsLoading'
  | 'requestChangesForm'
  | 'reviewActionLoading'
  | 'reviewActionMode'
  | 'reviewError'
  | 'reviewIsClosedLike'
  | 'reviewNeedsAttention'
  | 'setAssignReviewForm'
  | 'setDecisionNotes'
  | 'setOpenReviewForm'
  | 'setRequestChangesForm'
  | 'setReviewActionMode'
  | 'setStartReviewComment'
  | 'sortedReviewComments'
  | 'startReviewComment'
  | 'translateIfPresent'
>;

export function ProjectContractReviewPanel({
  activeReview,
  assignReviewForm,
  canApproveManualReview,
  canAssignManualReview,
  canOpenManualReview,
  canReadAdminContract,
  canRejectManualReview,
  canRequestManualReviewChanges,
  canStartManualReview,
  decisionNotes,
  effectiveSummary,
  handleOpenManualReview,
  handleSubmitReviewAction,
  locale,
  openReviewForm,
  operationsLoading,
  requestChangesForm,
  reviewActionLoading,
  reviewActionMode,
  reviewError,
  reviewIsClosedLike,
  reviewNeedsAttention,
  setAssignReviewForm,
  setDecisionNotes,
  setOpenReviewForm,
  setRequestChangesForm,
  setReviewActionMode,
  setStartReviewComment,
  sortedReviewComments,
  startReviewComment,
  translateIfPresent,
}: ProjectContractReviewPanelProps) {
  const t = useTranslations('projects.detail.contracts');

  return (
    <Card className="border-slate-200 dark:border-[#1E2A3D]">
      <CardHeader>
        <CardTitle>{t('review.title')}</CardTitle>
        <CardDescription>{t('review.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {operationsLoading && canReadAdminContract ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : null}

        {reviewError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('review.errors.title')}</AlertTitle>
            <AlertDescription>{reviewError}</AlertDescription>
          </Alert>
        ) : null}

        {activeReview ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getProcessTone(activeReview.status)}
                  >
                    {translateIfPresent(
                      `review.statuses.${String(activeReview.status).toLowerCase()}`,
                      humanizeCode(activeReview.status)
                    )}
                  </Badge>
                  {activeReview.priority ? (
                    <Badge variant="outline">
                      {t('review.labels.priority')}: {humanizeCode(activeReview.priority)}
                    </Badge>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                    {activeReview.review_summary ?? t('review.empty_summary')}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-[#A3ADC2]">
                    {[activeReview.opened_at, activeReview.due_at]
                      .map((value) => formatDateTime(value, locale))
                      .filter(Boolean)
                      .join(' • ') || t('summary.unavailable')}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                    {t('review.labels.assigned_to')}
                  </div>
                  <div className="mt-2 text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                    {activeReview.assigned_to_user?.name ??
                      activeReview.assigned_to_user?.email ??
                      t('summary.unavailable')}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                    {t('review.labels.contract_status')}
                  </div>
                  <div className="mt-2 text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                    {activeReview.contract?.status
                      ? translateIfPresent(
                          `statuses.${String(activeReview.contract.status).toLowerCase()}`,
                          humanizeCode(activeReview.contract.status)
                        )
                      : t('summary.unavailable')}
                  </div>
                </div>
              </div>
            </div>

            {activeReview.review_reason_codes.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {t('review.labels.reason_codes')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeReview.review_reason_codes.map((reasonCode) => (
                    <Badge key={reasonCode} variant="outline">
                      {humanizeCode(reasonCode)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {activeReview.requested_changes.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {t('review.labels.requested_changes')}
                </div>
                <div className="space-y-2">
                  {activeReview.requested_changes.map((entry, index) => (
                    <div
                      key={`${activeReview.id}-change-${index}`}
                      className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900"
                    >
                      {entry}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeReview.final_decision_notes ? (
              <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
                <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {t('review.labels.final_notes')}
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-[#A3ADC2]">
                  {activeReview.final_decision_notes}
                </p>
              </div>
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
              <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                {t('review.labels.comments')}
              </div>
              <div className="mt-3 space-y-3">
                {sortedReviewComments.length > 0 ? (
                  sortedReviewComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-[#A3ADC2]">
                        <Badge variant="outline">
                          {comment.comment_type
                            ? humanizeCode(comment.comment_type)
                            : t('summary.unavailable')}
                        </Badge>
                        <span>
                          {comment.author_user?.name ??
                            comment.author_user?.email ??
                            t('summary.unavailable')}
                        </span>
                        <span>
                          {formatDateTime(comment.created_at, locale) ??
                            t('summary.unavailable')}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700 dark:text-[#E6EDF3]">
                        {comment.body ?? t('summary.unavailable')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                    {t('review.empty_comments')}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : reviewNeedsAttention ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('review.pending_title')}</AlertTitle>
            <AlertDescription>{t('review.pending_description')}</AlertDescription>
          </Alert>
        ) : (
          <p className="text-sm text-slate-500 dark:text-[#A3ADC2]">{t('review.empty')}</p>
        )}

        {!activeReview && canOpenManualReview ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
            <div className="mb-4">
              <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                {t('review.actions.open')}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#A3ADC2]">
                {t('review.open_description')}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={openReviewForm.summary}
                onChange={(event) =>
                  setOpenReviewForm((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
                placeholder={t('review.form.summary')}
              />
              <Input
                value={openReviewForm.priority}
                onChange={(event) =>
                  setOpenReviewForm((current) => ({
                    ...current,
                    priority: event.target.value,
                  }))
                }
                placeholder={t('review.form.priority')}
              />
              <Input
                value={openReviewForm.reasonCodes}
                onChange={(event) =>
                  setOpenReviewForm((current) => ({
                    ...current,
                    reasonCodes: event.target.value,
                  }))
                }
                placeholder={t('review.form.reason_codes')}
                className="md:col-span-2"
              />
              <Input
                type="datetime-local"
                value={openReviewForm.dueAt}
                onChange={(event) =>
                  setOpenReviewForm((current) => ({
                    ...current,
                    dueAt: event.target.value,
                  }))
                }
              />
              <Textarea
                value={openReviewForm.comment}
                onChange={(event) =>
                  setOpenReviewForm((current) => ({
                    ...current,
                    comment: event.target.value,
                  }))
                }
                placeholder={t('review.form.comment')}
                className="min-h-[110px] md:col-span-2"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  void handleOpenManualReview();
                }}
                disabled={reviewActionLoading === 'open'}
              >
                {reviewActionLoading === 'open' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t('review.actions.open')}
              </Button>
            </div>
          </div>
        ) : null}

        {activeReview &&
        !reviewIsClosedLike &&
        (canAssignManualReview ||
          canStartManualReview ||
          canRequestManualReviewChanges ||
          canApproveManualReview ||
          canRejectManualReview) ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
            <div className="flex flex-wrap gap-2">
              {canAssignManualReview ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewActionMode('assign')}
                >
                  {t('review.actions.assign')}
                </Button>
              ) : null}
              {canStartManualReview ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewActionMode('start')}
                >
                  {t('review.actions.start')}
                </Button>
              ) : null}
              {canRequestManualReviewChanges ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewActionMode('request_changes')}
                >
                  {t('review.actions.request_changes')}
                </Button>
              ) : null}
              {canApproveManualReview ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewActionMode('approve')}
                >
                  {t('review.actions.approve')}
                </Button>
              ) : null}
              {canRejectManualReview ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewActionMode('reject')}
                >
                  {t('review.actions.reject')}
                </Button>
              ) : null}
            </div>

            {reviewActionMode ? (
              <div className="mt-4 space-y-3">
                {reviewActionMode === 'assign' ? (
                  <>
                    <Input
                      value={assignReviewForm.assignedToUserId}
                      onChange={(event) =>
                        setAssignReviewForm((current) => ({
                          ...current,
                          assignedToUserId: event.target.value,
                        }))
                      }
                      placeholder={t('review.form.assigned_to_user_id')}
                    />
                    <Textarea
                      value={assignReviewForm.comment}
                      onChange={(event) =>
                        setAssignReviewForm((current) => ({
                          ...current,
                          comment: event.target.value,
                        }))
                      }
                      placeholder={t('review.form.comment')}
                      className="min-h-[100px]"
                    />
                  </>
                ) : null}

                {reviewActionMode === 'start' ? (
                  <Textarea
                    value={startReviewComment}
                    onChange={(event) => setStartReviewComment(event.target.value)}
                    placeholder={t('review.form.comment')}
                    className="min-h-[100px]"
                  />
                ) : null}

                {reviewActionMode === 'request_changes' ? (
                  <>
                    <Textarea
                      value={requestChangesForm.requestedChanges}
                      onChange={(event) =>
                        setRequestChangesForm((current) => ({
                          ...current,
                          requestedChanges: event.target.value,
                        }))
                      }
                      placeholder={t('review.form.requested_changes')}
                      className="min-h-[120px]"
                    />
                    <Textarea
                      value={requestChangesForm.comment}
                      onChange={(event) =>
                        setRequestChangesForm((current) => ({
                          ...current,
                          comment: event.target.value,
                        }))
                      }
                      placeholder={t('review.form.comment')}
                      className="min-h-[100px]"
                    />
                  </>
                ) : null}

                {reviewActionMode === 'approve' || reviewActionMode === 'reject' ? (
                  <Textarea
                    value={decisionNotes}
                    onChange={(event) => setDecisionNotes(event.target.value)}
                    placeholder={t('review.form.notes')}
                    className="min-h-[110px]"
                  />
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReviewActionMode(null)}
                  >
                    {t('review.actions.cancel')}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      void handleSubmitReviewAction();
                    }}
                    disabled={reviewActionLoading === reviewActionMode}
                  >
                    {reviewActionLoading === reviewActionMode ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {t('review.actions.submit')}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
