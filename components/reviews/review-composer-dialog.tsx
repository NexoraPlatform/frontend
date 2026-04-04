"use client";

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, Loader2, LockKeyhole, MessageSquareText } from 'lucide-react';

import { ReviewRatingStars } from '@/components/reviews/review-rating-stars';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  ProjectReviewRecord,
  ProjectReviewRole,
  ReviewOpportunityRecord,
  SubmitProjectReviewPayload,
  UpdateProjectReviewPayload,
} from '@/lib/reviews';

export type ReviewMilestoneOption = {
  id: string;
  title: string;
  status: string | null;
  service_name: string | null;
};

type ReviewComposerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  reviewerRole: ProjectReviewRole;
  opportunity?: ReviewOpportunityRecord | null;
  review?: ProjectReviewRecord | null;
  milestoneOptions?: ReviewMilestoneOption[];
  loadingMilestones?: boolean;
  onSubmit: (
    payload: SubmitProjectReviewPayload | UpdateProjectReviewPayload
  ) => Promise<void>;
};

type DetailedScoreField =
  | 'communication'
  | 'quality'
  | 'timeliness'
  | 'professionalism'
  | 'scope_clarity'
  | 'payment_reliability';

const CLIENT_SCORE_FIELDS: DetailedScoreField[] = [
  'communication',
  'quality',
  'timeliness',
  'professionalism',
  'scope_clarity',
];

const PROVIDER_SCORE_FIELDS: DetailedScoreField[] = [
  'communication',
  'payment_reliability',
  'scope_clarity',
  'professionalism',
];

const EMPTY_SCORE_STATE: Record<DetailedScoreField, number> = {
  communication: 0,
  quality: 0,
  timeliness: 0,
  professionalism: 0,
  scope_clarity: 0,
  payment_reliability: 0,
};

export function ReviewComposerDialog({
  open,
  onOpenChange,
  mode,
  reviewerRole,
  opportunity,
  review,
  milestoneOptions = [],
  loadingMilestones = false,
  onSubmit,
}: ReviewComposerDialogProps) {
  const t = useTranslations('dashboard.reviews');
  const [ratingOverall, setRatingOverall] = useState(0);
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [privateFeedback, setPrivateFeedback] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [wouldWorkAgain, setWouldWorkAgain] = useState<'unset' | 'yes' | 'no'>('unset');
  const [detailedScores, setDetailedScores] =
    useState<Record<DetailedScoreField, number>>(EMPTY_SCORE_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedReviewerRole = reviewerRole.toUpperCase();
  const isCreateMode = mode === 'create';
  const scoreFields =
    normalizedReviewerRole === 'PROVIDER' ? PROVIDER_SCORE_FIELDS : CLIENT_SCORE_FIELDS;

  const title = useMemo(() => {
    if (!isCreateMode) {
      return t('composer.edit_title');
    }

    return normalizedReviewerRole === 'PROVIDER'
      ? t('composer.new_title_client')
      : t('composer.new_title_provider');
  }, [isCreateMode, normalizedReviewerRole, t]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
    setRatingOverall(review?.rating_overall ?? 0);
    setHeadline(review?.headline ?? '');
    setBody(review?.body ?? '');
    setPrivateFeedback('');
    setSelectedMilestoneId('');
    setWouldWorkAgain(
      typeof review?.score_payload?.would_work_again === 'boolean'
        ? review.score_payload.would_work_again
          ? 'yes'
          : 'no'
        : 'unset'
    );
    setDetailedScores({
      communication: review?.score_payload.communication ?? 0,
      quality: review?.score_payload.quality ?? 0,
      timeliness: review?.score_payload.timeliness ?? 0,
      professionalism: review?.score_payload.professionalism ?? 0,
      scope_clarity: review?.score_payload.scope_clarity ?? 0,
      payment_reliability: review?.score_payload.payment_reliability ?? 0,
    });
  }, [open, review]);

  const handleDetailedScoreChange = (field: DetailedScoreField, value: number) => {
    setDetailedScores((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const scoreFieldLabels = useMemo(
    () => ({
      communication: t('dimensions.communication'),
      quality: t('dimensions.quality'),
      timeliness: t('dimensions.timeliness'),
      professionalism: t('dimensions.professionalism'),
      scope_clarity: t('dimensions.scope_clarity'),
      payment_reliability: t('dimensions.payment_reliability'),
    }),
    [t]
  );

  const currentMilestoneLabel = useMemo(() => {
    if (review?.milestone) {
      return review.milestone.service?.name
        ? `${review.milestone.title} • ${review.milestone.service.name}`
        : review.milestone.title;
    }

    return null;
  }, [review?.milestone]);

  const handleSubmit = async () => {
    if (!isCreateMode && !review) {
      setError(t('composer.errors.review_missing'));
      return;
    }

    if (isCreateMode && !opportunity?.reviewee?.id) {
      setError(t('composer.errors.reviewee_missing'));
      return;
    }

    if (ratingOverall < 1 || ratingOverall > 5) {
      setError(t('composer.errors.rating_required'));
      return;
    }

    if (body.trim().length < 10) {
      setError(t('composer.errors.body_too_short'));
      return;
    }

    const scorePayload = scoreFields.reduce<Record<string, number | boolean>>((acc, field) => {
      const value = detailedScores[field];
      if (value > 0) {
        acc[field] = value;
      }

      return acc;
    }, {});

    if (wouldWorkAgain !== 'unset') {
      scorePayload.would_work_again = wouldWorkAgain === 'yes';
    }

    const payload = {
      ...(isCreateMode && opportunity?.reviewee?.id
        ? { reviewee_user_id: opportunity.reviewee.id }
        : {}),
      ...(isCreateMode
        ? { project_line_milestone_id: selectedMilestoneId || null }
        : {}),
      rating_overall: ratingOverall,
      headline: headline.trim() ? headline.trim() : null,
      body: body.trim(),
      ...(privateFeedback.trim() ? { private_feedback: privateFeedback.trim() } : {}),
      ...(Object.keys(scorePayload).length > 0 ? { score_payload: scorePayload } : {}),
    } satisfies SubmitProjectReviewPayload | UpdateProjectReviewPayload;

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(payload);
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : t('composer.errors.generic')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-slate-200 bg-white/95 dark:border-[#23314D] dark:bg-[#0B1220]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? t('composer.description_create')
              : t('composer.description_edit')}
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
          <LockKeyhole className="h-4 w-4" />
          <AlertDescription>{t('double_blind.description')}</AlertDescription>
        </Alert>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {isCreateMode && opportunity?.reviewee ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-[#23314D] dark:bg-[#111827]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
              {t('composer.reviewee_label')}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {opportunity.reviewee.full_name || t('composer.reviewee_fallback')}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {opportunity.project_title}
            </p>
          </div>
        ) : null}

        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label>{t('composer.rating_label')}</Label>
            <div className="flex flex-wrap items-center gap-3">
              <ReviewRatingStars
                value={ratingOverall}
                onChange={setRatingOverall}
                sizeClassName="h-6 w-6"
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {ratingOverall > 0 ? t('composer.rating_value', { value: ratingOverall }) : t('composer.rating_empty')}
              </span>
            </div>
          </div>

          {isCreateMode ? (
            <div className="grid gap-2">
              <Label>{t('composer.milestone_label')}</Label>
              {loadingMilestones ? (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 dark:border-[#23314D] dark:text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('composer.loading_milestones')}
                </div>
              ) : milestoneOptions.length > 0 ? (
                <Select value={selectedMilestoneId || 'none'} onValueChange={(value) => {
                  setSelectedMilestoneId(value === 'none' ? '' : value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('composer.milestone_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('composer.milestone_none')}</SelectItem>
                    {milestoneOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.service_name
                          ? `${option.title} • ${option.service_name}`
                          : option.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  {t('composer.no_milestones')}
                </p>
              )}
            </div>
          ) : currentMilestoneLabel ? (
            <div className="grid gap-2">
              <Label>{t('composer.milestone_label')}</Label>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700 dark:border-[#23314D] dark:bg-[#111827] dark:text-slate-200">
                {currentMilestoneLabel}
              </div>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="review-headline">{t('composer.headline_label')}</Label>
            <Input
              id="review-headline"
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              placeholder={t('composer.headline_placeholder')}
              maxLength={180}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="review-body">{t('composer.body_label')}</Label>
            <Textarea
              id="review-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={
                normalizedReviewerRole === 'PROVIDER'
                  ? t('composer.body_placeholder_client')
                  : t('composer.body_placeholder_provider')
              }
              rows={7}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="review-private-feedback">{t('composer.private_feedback_label')}</Label>
            <Textarea
              id="review-private-feedback"
              value={privateFeedback}
              onChange={(event) => setPrivateFeedback(event.target.value)}
              placeholder={
                isCreateMode
                  ? t('composer.private_feedback_placeholder')
                  : t('composer.private_feedback_placeholder_edit')
              }
              rows={4}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <MessageSquareText className="mr-1 inline h-3.5 w-3.5" />
              {isCreateMode
                ? t('composer.private_feedback_hint')
                : t('composer.private_feedback_hint_edit')}
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-[#23314D] dark:bg-[#111827]">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {t('composer.score_section_title')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                {t('composer.score_section_description')}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {scoreFields.map((field) => (
                <div key={field} className="rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-[#23314D] dark:bg-[#0F172A]">
                  <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {scoreFieldLabels[field]}
                  </div>
                  <ReviewRatingStars
                    value={detailedScores[field]}
                    onChange={(value) => handleDetailedScoreChange(field, value)}
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-2">
              <Label>{t('composer.would_work_again_label')}</Label>
              <Select value={wouldWorkAgain} onValueChange={(value: 'unset' | 'yes' | 'no') => setWouldWorkAgain(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">{t('composer.would_work_again_unset')}</SelectItem>
                  <SelectItem value="yes">{t('composer.would_work_again_yes')}</SelectItem>
                  <SelectItem value="no">{t('composer.would_work_again_no')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('composer.cancel')}
          </Button>
          <Button type="button" className="btn-primary" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isCreateMode ? t('composer.submit') : t('composer.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
