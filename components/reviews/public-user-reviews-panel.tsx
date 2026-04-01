"use client";

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/lib/navigation';
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

import { ReviewFlagDialog } from '@/components/reviews/review-flag-dialog';
import { ReviewRatingStars } from '@/components/reviews/review-rating-stars';
import { ReviewScoreList, type ReviewScoreLabels } from '@/components/reviews/review-score-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { usePublicUserReviews } from '@/hooks/use-api';
import {
  getProjectReviewDisplayDate,
  type ProjectReviewRecord,
} from '@/lib/reviews';

type PublicUserReviewsPanelProps = {
  userId: string | number;
  currentUserId?: string | number | null;
};

export function PublicUserReviewsPanel({
  userId,
  currentUserId = null,
}: PublicUserReviewsPanelProps) {
  const locale = useLocale();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [flagTarget, setFlagTarget] = useState<ProjectReviewRecord | null>(null);
  const [flaggedReviewIds, setFlaggedReviewIds] = useState<string[]>([]);
  const isEnglish = locale.toLowerCase().startsWith('en');

  const copy = useMemo(
    () =>
      isEnglish
        ? {
            title: 'Public reviews',
            average: 'Average rating',
            count: 'Published reviews',
            noReviewsTitle: 'No public reviews yet',
            noReviewsDescription:
              'Published reviews will appear here once the review window is completed.',
            reviewer: 'Reviewer',
            publishedAt: 'Published',
            milestone: 'Milestone',
            service: 'Service',
            report: 'Report review',
            alreadyReported: 'Reported',
            reportSuccess: 'Review reported successfully.',
            authRequired: 'Sign in to report a review.',
            prev: 'Previous',
            next: 'Next',
            projectFallback: 'Project',
            personFallback: 'Platform user',
          }
        : {
            title: 'Recenzii publice',
            average: 'Rating mediu',
            count: 'Recenzii publicate',
            noReviewsTitle: 'Încă nu există recenzii publice',
            noReviewsDescription:
              'Recenziile publicate vor apărea aici după ce se încheie fereastra de review.',
            reviewer: 'Autor',
            publishedAt: 'Publicată',
            milestone: 'Milestone',
            service: 'Serviciu',
            report: 'Raportează recenzia',
            alreadyReported: 'Raportată',
            reportSuccess: 'Recenzia a fost raportată.',
            authRequired: 'Autentifică-te ca să raportezi o recenzie.',
            prev: 'Anterior',
            next: 'Următor',
            projectFallback: 'Proiect',
            personFallback: 'Utilizator Trustora',
          },
    [isEnglish]
  );

  const scoreLabels = useMemo<ReviewScoreLabels>(
    () =>
      isEnglish
        ? {
            communication: 'Communication',
            quality: 'Quality',
            timeliness: 'Timeliness',
            professionalism: 'Professionalism',
            scope_clarity: 'Scope clarity',
            payment_reliability: 'Payment reliability',
            would_work_again: 'Would work again',
            would_work_again_yes: 'Yes',
            would_work_again_no: 'No',
          }
        : {
            communication: 'Comunicare',
            quality: 'Calitate',
            timeliness: 'Respectarea termenelor',
            professionalism: 'Profesionalism',
            scope_clarity: 'Claritatea scope-ului',
            payment_reliability: 'Fiabilitatea plății',
            would_work_again: 'Ar colabora din nou',
            would_work_again_yes: 'Da',
            would_work_again_no: 'Nu',
          },
    [isEnglish]
  );

  const {
    data,
    loading,
    error,
    refetch,
  } = usePublicUserReviews(
    userId,
    {
      page,
      per_page: 6,
    },
    true
  );

  const summary = data?.summary;
  const reviews = data?.data ?? [];
  const meta = data?.meta;

  const formatDate = (value: string | null) => {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat(isEnglish ? 'en-US' : 'ro-RO', {
      dateStyle: 'medium',
    }).format(date);
  };

  const handleOpenFlagDialog = (review: ProjectReviewRecord) => {
    if (!currentUserId) {
      toast.error(copy.authRequired);
      router.push('/auth/signin');
      return;
    }

    setFlagTarget(review);
  };

  const handleFlagSubmit = async (payload: {
    reason_code: string;
    notes?: string | null;
  }) => {
    if (!flagTarget) {
      return;
    }

    await apiClient.flagProjectReview(flagTarget.id, payload);
    setFlaggedReviewIds((current) =>
      current.includes(flagTarget.id) ? current : [...current, flagTarget.id]
    );
    setFlagTarget(null);
    toast.success(copy.reportSuccess);
  };

  const canGoBack = (meta?.current_page ?? 1) > 1;
  const canGoForward = (meta?.current_page ?? 1) < (meta?.last_page ?? 1);

  return (
    <>
      <div className="grid xs:grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{copy.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-500">
                {summary?.average_rating?.toFixed(1) ?? '0.0'}
              </div>
              <div className="mt-2 flex justify-center">
                <ReviewRatingStars value={summary?.average_rating ?? 0} sizeClassName="h-5 w-5" />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {copy.count}: {summary?.review_count ?? 0}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-[#23314D] dark:bg-[#111827]">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {copy.average}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {summary?.average_rating?.toFixed(1) ?? '0.0'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : reviews.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-500" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {copy.noReviewsTitle}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  {copy.noReviewsDescription}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {reviews.map((review) => {
                const reviewerName = review.reviewer?.full_name || copy.personFallback;
                const publishedAt = formatDate(getProjectReviewDisplayDate(review));
                const isOwnReview =
                  currentUserId !== null &&
                  String(currentUserId) === String(review.reviewer?.id ?? '');
                const isAlreadyFlagged = flaggedReviewIds.includes(review.id);

                return (
                  <Card key={review.id} className="glass-card">
                    <CardContent className="space-y-5 p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-11 w-11 border border-slate-200 dark:border-[#23314D]">
                            <AvatarImage src={review.reviewer?.avatar ?? undefined} alt={reviewerName} />
                            <AvatarFallback>
                              {reviewerName
                                .split(' ')
                                .map((part) => part.charAt(0))
                                .join('')
                                .slice(0, 2)
                                .toUpperCase() || 'RV'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              {copy.reviewer}
                            </p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {reviewerName}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {review.project?.title || copy.projectFallback}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          {publishedAt ? (
                            <Badge variant="outline">
                              {copy.publishedAt}: {publishedAt}
                            </Badge>
                          ) : null}
                          {!isOwnReview ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenFlagDialog(review)}
                              disabled={isAlreadyFlagged}
                            >
                              {isAlreadyFlagged ? copy.alreadyReported : copy.report}
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <ReviewRatingStars value={review.rating_overall} />
                        <span>{review.rating_overall}/5</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {review.milestone?.title ? (
                          <Badge variant="outline">
                            {copy.milestone}: {review.milestone.title}
                          </Badge>
                        ) : null}
                        {review.milestone?.service?.name ? (
                          <Badge variant="outline">
                            {copy.service}: {review.milestone.service.name}
                          </Badge>
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
                    </CardContent>
                  </Card>
                );
              })}

              {(meta?.last_page ?? 1) > 1 ? (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={!canGoBack}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {copy.prev}
                  </Button>
                  <Badge variant="outline">
                    {meta?.current_page ?? 1} / {meta?.last_page ?? 1}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={!canGoForward}
                  >
                    {copy.next}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <ReviewFlagDialog
        open={flagTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFlagTarget(null);
          }
        }}
        locale={locale}
        onSubmit={handleFlagSubmit}
      />
    </>
  );
}
