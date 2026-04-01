"use client";

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { AlertCircle, FilePenLine, Loader2, MessageSquareQuote, Star } from 'lucide-react';
import { toast } from 'sonner';

import { ReviewComposerDialog, type ReviewMilestoneOption } from '@/components/reviews/review-composer-dialog';
import { ReviewRatingStars } from '@/components/reviews/review-rating-stars';
import { ReviewScoreList, type ReviewScoreLabels } from '@/components/reviews/review-score-list';
import { ReviewStatusBadge } from '@/components/reviews/review-status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api';
import { useMyReviewOpportunities, useMyReviews } from '@/hooks/use-api';
import {
  getProjectReviewDisplayDate,
  getProjectReviewDisplayPerson,
  type ProjectReviewRecord,
  type ReviewOpportunityRecord,
} from '@/lib/reviews';

type DashboardProjectReviewsPanelProps = {
  isClient: boolean;
  isProvider: boolean;
  resolveMilestoneOptions: (
    projectId: string,
    eligibleMilestoneIds: string[]
  ) => Promise<ReviewMilestoneOption[]>;
};

type ComposerState =
  | {
      mode: 'create';
      opportunity: ReviewOpportunityRecord;
    }
  | {
      mode: 'edit';
      review: ProjectReviewRecord;
    };

function ReviewPersonAvatar({
  name,
  avatar,
}: {
  name: string;
  avatar: string | null;
}) {
  const initials = name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Avatar className="h-11 w-11 border border-slate-200 dark:border-[#23314D]">
      <AvatarImage src={avatar ?? undefined} alt={name} />
      <AvatarFallback>{initials || 'RV'}</AvatarFallback>
    </Avatar>
  );
}

export function DashboardProjectReviewsPanel({
  isClient,
  isProvider,
  resolveMilestoneOptions,
}: DashboardProjectReviewsPanelProps) {
  const t = useTranslations('dashboard.reviews');
  const locale = useLocale();
  const [tab, setTab] = useState<'opportunities' | 'authored' | 'received'>('opportunities');
  const [composerState, setComposerState] = useState<ComposerState | null>(null);
  const [composerMilestones, setComposerMilestones] = useState<ReviewMilestoneOption[]>([]);
  const [loadingComposerMilestones, setLoadingComposerMilestones] = useState(false);

  const {
    data: opportunitiesData,
    loading: loadingOpportunities,
    error: opportunitiesError,
    refetch: refetchOpportunities,
  } = useMyReviewOpportunities(true);
  const {
    data: authoredResponse,
    loading: loadingAuthored,
    error: authoredError,
    refetch: refetchAuthored,
  } = useMyReviews(
    {
      scope: 'authored',
      per_page: 50,
    },
    true
  );
  const {
    data: receivedResponse,
    loading: loadingReceived,
    error: receivedError,
    refetch: refetchReceived,
  } = useMyReviews(
    {
      scope: 'received',
      per_page: 50,
    },
    true
  );

  const opportunities = opportunitiesData ?? [];
  const authoredReviews = authoredResponse?.data ?? [];
  const receivedReviews = receivedResponse?.data ?? [];
  const statusLabels = useMemo(
    () => ({
      SUBMITTED: t('status.submitted'),
      PUBLISHED: t('status.published'),
      REMOVED: t('status.removed'),
    }),
    [t]
  );
  const scoreLabels = useMemo<ReviewScoreLabels>(
    () => ({
      communication: t('dimensions.communication'),
      quality: t('dimensions.quality'),
      timeliness: t('dimensions.timeliness'),
      professionalism: t('dimensions.professionalism'),
      scope_clarity: t('dimensions.scope_clarity'),
      payment_reliability: t('dimensions.payment_reliability'),
      would_work_again: t('dimensions.would_work_again'),
      would_work_again_yes: t('dimensions.would_work_again_yes'),
      would_work_again_no: t('dimensions.would_work_again_no'),
    }),
    [t]
  );

  const formatTimestamp = (value: string | null) => {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat(locale.toLowerCase().startsWith('en') ? 'en-US' : 'ro-RO', {
      dateStyle: 'medium',
    }).format(date);
  };

  const handleRefetchAll = async () => {
    await Promise.all([
      refetchOpportunities(),
      refetchAuthored(),
      refetchReceived(),
    ]);
  };

  const openCreateDialog = async (opportunity: ReviewOpportunityRecord) => {
    setComposerState({
      mode: 'create',
      opportunity,
    });
    setComposerMilestones([]);
    setLoadingComposerMilestones(true);

    try {
      const nextMilestones = await resolveMilestoneOptions(
        opportunity.project_id,
        opportunity.eligible_milestone_ids
      );
      setComposerMilestones(nextMilestones);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('composer.errors.generic')
      );
    } finally {
      setLoadingComposerMilestones(false);
    }
  };

  const openEditDialog = (review: ProjectReviewRecord) => {
    setComposerMilestones([]);
    setLoadingComposerMilestones(false);
    setComposerState({
      mode: 'edit',
      review,
    });
  };

  const handleComposerSubmit = async (payload: any) => {
    if (!composerState) {
      return;
    }

    if (composerState.mode === 'create') {
      const createdReview = await apiClient.submitProjectReview(
        composerState.opportunity.project_id,
        payload
      );
      toast.success(
        createdReview.status === 'PUBLISHED'
          ? t('composer.success_published')
          : t('composer.success_submitted')
      );
    } else {
      await apiClient.updateProjectReview(composerState.review.id, payload);
      toast.success(t('composer.success_updated'));
    }

    setComposerState(null);
    setComposerMilestones([]);
    await handleRefetchAll();
  };

  const renderReviewCard = (
    review: ProjectReviewRecord,
    perspective: 'authored' | 'received'
  ) => {
    const counterparty = getProjectReviewDisplayPerson(
      review,
      perspective === 'authored' ? 'reviewee' : 'reviewer'
    );
    const publishedOrSubmittedAt = formatTimestamp(getProjectReviewDisplayDate(review));
    const isSubmitted = review.status === 'SUBMITTED';
    const isRemoved = review.status === 'REMOVED';

    return (
      <Card
        key={review.id}
        className="glass-card border-slate-200/80 shadow-sm dark:border-[#1E2A3D]"
      >
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <ReviewPersonAvatar
                name={counterparty?.full_name || t('labels.person_fallback')}
                avatar={counterparty?.avatar ?? null}
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {perspective === 'authored'
                    ? t('labels.reviewee')
                    : t('labels.reviewer')}
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {counterparty?.full_name || t('labels.person_fallback')}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {review.project?.title || t('labels.project_fallback')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <ReviewStatusBadge status={review.status} labels={statusLabels} />
              {review.flag_count > 0 ? (
                <Badge variant="outline">
                  {t('labels.flags', { count: review.flag_count })}
                </Badge>
              ) : null}
              {perspective === 'authored' && isSubmitted ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(review)}
                >
                  <FilePenLine className="mr-2 h-4 w-4" />
                  {t('actions.edit')}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <ReviewRatingStars value={review.rating_overall} />
            <span>{t('labels.rating', { value: review.rating_overall })}</span>
            {publishedOrSubmittedAt ? (
              <span>
                {isSubmitted ? t('labels.submitted_at') : t('labels.published_at')} {publishedOrSubmittedAt}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {review.milestone?.title ? (
              <Badge variant="outline">
                {t('labels.milestone')}: {review.milestone.title}
              </Badge>
            ) : null}
            {review.milestone?.service?.name ? (
              <Badge variant="outline">
                {t('labels.service')}: {review.milestone.service.name}
              </Badge>
            ) : null}
            {counterparty?.profile_url && perspective === 'authored' && review.reviewer_role === 'CLIENT' ? (
              <Button asChild variant="ghost" size="sm" className="h-auto px-0 text-[#1BC47D] hover:text-[#15935f]">
                <Link href={`/provider/${counterparty.profile_url}`}>
                  {t('actions.view_profile')}
                </Link>
              </Button>
            ) : null}
          </div>

          {review.headline ? (
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {review.headline}
            </h4>
          ) : null}
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
            {review.body}
          </p>

          <ReviewScoreList review={review} labels={scoreLabels} />

          {isSubmitted ? (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
              <MessageSquareQuote className="h-4 w-4" />
              <AlertDescription>{t('notes.submitted')}</AlertDescription>
            </Alert>
          ) : null}
          {isRemoved ? (
            <Alert className="border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t('notes.removed')}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (title: string, description: string) => (
    <Card className="glass-card border-dashed border-slate-200 dark:border-[#23314D]">
      <CardContent className="py-12 text-center">
        <Star className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-500" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card className="glass-card border-slate-200/80 shadow-sm dark:border-[#1E2A3D]">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="space-y-5">
            <TabsList className="grid w-full gap-2 rounded-2xl bg-slate-100/80 p-1.5 dark:bg-[#111827] md:grid-cols-3">
              <TabsTrigger value="opportunities">
                {t('tabs.opportunities', { count: opportunities.length })}
              </TabsTrigger>
              <TabsTrigger value="authored">
                {t('tabs.authored', { count: authoredReviews.length })}
              </TabsTrigger>
              <TabsTrigger value="received">
                {t('tabs.received', { count: receivedReviews.length })}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="opportunities" className="space-y-4">
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                <MessageSquareQuote className="h-4 w-4" />
                <AlertDescription>{t('double_blind.description')}</AlertDescription>
              </Alert>

              {loadingOpportunities ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : opportunitiesError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{opportunitiesError}</AlertDescription>
                </Alert>
              ) : opportunities.length === 0 ? (
                renderEmptyState(
                  t('empty.opportunities_title'),
                  isProvider && !isClient
                    ? t('empty.opportunities_provider')
                    : t('empty.opportunities_client')
                )
              ) : (
                <div className="grid gap-4">
                  {opportunities.map((opportunity) => (
                    <Card
                      key={`${opportunity.project_id}-${opportunity.reviewee?.id ?? 'unknown'}`}
                      className="border-slate-200/80 bg-white/85 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0F172A]"
                    >
                      <CardContent className="space-y-4 p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              {opportunity.project_status || t('labels.project_status_fallback')}
                            </p>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                              {opportunity.project_title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {t('opportunity.review_target', {
                                role:
                                  opportunity.reviewer_role === 'PROVIDER'
                                    ? t('opportunity.client')
                                    : t('opportunity.provider'),
                                name:
                                  opportunity.reviewee?.full_name || t('labels.person_fallback'),
                              })}
                            </p>
                          </div>

                          <Button
                            type="button"
                            className="btn-primary"
                            onClick={() => void openCreateDialog(opportunity)}
                          >
                            <FilePenLine className="mr-2 h-4 w-4" />
                            {t('actions.write')}
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {opportunity.service_names.map((serviceName) => (
                            <Badge key={serviceName} variant="outline">
                              {serviceName}
                            </Badge>
                          ))}
                          {opportunity.eligible_milestone_ids.length > 0 ? (
                            <Badge variant="outline">
                              {t('opportunity.milestones', {
                                count: opportunity.eligible_milestone_ids.length,
                              })}
                            </Badge>
                          ) : null}
                          {opportunity.reviewee?.profile_url &&
                          opportunity.reviewer_role === 'CLIENT' ? (
                            <Button asChild variant="ghost" size="sm" className="h-auto px-0 text-[#1BC47D] hover:text-[#15935f]">
                              <Link href={`/provider/${opportunity.reviewee.profile_url}`}>
                                {t('actions.view_profile')}
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="authored" className="space-y-4">
              {loadingAuthored ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : authoredError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authoredError}</AlertDescription>
                </Alert>
              ) : authoredReviews.length === 0 ? (
                renderEmptyState(t('empty.authored_title'), t('empty.authored_description'))
              ) : (
                <div className="grid gap-4">
                  {authoredReviews.map((review) => renderReviewCard(review, 'authored'))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="received" className="space-y-4">
              {loadingReceived ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : receivedError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{receivedError}</AlertDescription>
                </Alert>
              ) : receivedReviews.length === 0 ? (
                renderEmptyState(t('empty.received_title'), t('empty.received_description'))
              ) : (
                <div className="grid gap-4">
                  {receivedReviews.map((review) => renderReviewCard(review, 'received'))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ReviewComposerDialog
        open={composerState !== null}
        onOpenChange={(open) => {
          if (!open) {
            setComposerState(null);
            setComposerMilestones([]);
          }
        }}
        mode={composerState?.mode ?? 'create'}
        reviewerRole={
          composerState?.mode === 'edit'
            ? composerState.review.reviewer_role
            : composerState?.opportunity.reviewer_role ?? (isProvider ? 'PROVIDER' : 'CLIENT')
        }
        opportunity={composerState?.mode === 'create' ? composerState.opportunity : null}
        review={composerState?.mode === 'edit' ? composerState.review : null}
        milestoneOptions={composerMilestones}
        loadingMilestones={loadingComposerMilestones}
        onSubmit={handleComposerSubmit}
      />
    </>
  );
}
