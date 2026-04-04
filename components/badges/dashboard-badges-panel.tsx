"use client";

import { motion } from 'framer-motion';
import { Award, Loader2, Sparkles, Target } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { BadgeCard } from '@/components/badges/badge-card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { BadgeCounts, BadgeProgressRecord, BadgeRewardLogRecord, UserBadgeRecord } from '@/lib/badges';

type DashboardBadgesPanelProps = {
  badgeCounts: BadgeCounts;
  featuredBadges: UserBadgeRecord[];
  awardedBadges: UserBadgeRecord[];
  badgeProgress: BadgeProgressRecord[];
  badgeRewards: BadgeRewardLogRecord[];
  loading: boolean;
  error?: string | null;
};

export function DashboardBadgesPanel({
  badgeCounts,
  featuredBadges,
  awardedBadges,
  badgeProgress,
  badgeRewards,
  loading,
  error,
}: DashboardBadgesPanelProps) {
  const t = useTranslations();
  const locale = useLocale();
  const badgeLocale = locale === 'ro' ? 'ro-RO' : 'en-US';

  const showcaseBadges = useMemo(
    () => (featuredBadges.length > 0 ? featuredBadges : awardedBadges).slice(0, 3),
    [awardedBadges, featuredBadges]
  );

  const prioritizedProgress = useMemo(
    () =>
      [...badgeProgress]
        .sort((left, right) => {
          if (right.progress_percent !== left.progress_percent) {
            return right.progress_percent - left.progress_percent;
          }

          return right.completed_conditions_count - left.completed_conditions_count;
        })
        .slice(0, 3),
    [badgeProgress]
  );

  const activeRewards = useMemo(
    () =>
      badgeRewards
        .filter((reward) => !reward.status || !['revoked', 'expired'].includes(String(reward.status).toLowerCase()))
        .slice(0, 3),
    [badgeRewards]
  );

  const awardedCount = badgeCounts.awarded || awardedBadges.length;
  const inProgressCount = badgeCounts.in_progress || badgeProgress.length;
  const hasBadgeContent =
    showcaseBadges.length > 0 || prioritizedProgress.length > 0 || activeRewards.length > 0 || awardedCount > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="glass-effect rounded-3xl border border-border p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t('dashboard.badges.title')}
            </p>
            <h2 className="mt-3 text-xl font-bold">{t('dashboard.badges.headline')}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {t('dashboard.badges.description')}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t('dashboard.badges.awarded')}
              </p>
              <p className="mt-1 text-2xl font-bold">{awardedCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t('dashboard.badges.in_progress')}
              </p>
              <p className="mt-1 text-2xl font-bold">{inProgressCount}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('dashboard.badges.loading')}
            </div>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
            {error || t('dashboard.badges.error')}
          </div>
        ) : !hasBadgeContent ? (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-background/50 px-6 py-10 text-center">
            <Award className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{t('dashboard.badges.empty_title')}</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              {t('dashboard.badges.empty_description')}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {featuredBadges.length > 0
                  ? t('dashboard.badges.featured')
                  : t('dashboard.badges.latest')}
              </h3>
              {awardedBadges.length > showcaseBadges.length ? (
                <Badge variant="secondary" className="bg-secondary/80 text-foreground/80">
                  {t('dashboard.badges.all_unlocked', { count: awardedBadges.length })}
                </Badge>
              ) : null}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {showcaseBadges.map((record, index) => (
                <BadgeCard
                  key={String(record.id ?? record.badge?.code ?? `badge-${index}`)}
                  record={record}
                  compact
                  locale={badgeLocale}
                />
              ))}
            </div>
          </div>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.16 }}
        className="glass-effect rounded-3xl border border-border p-6"
      >
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Target className="h-3.5 w-3.5" />
            {t('dashboard.badges.progress_title')}
          </p>
          <h2 className="mt-3 text-xl font-bold">{t('dashboard.badges.progress_headline')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('dashboard.badges.progress_description')}
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('dashboard.badges.loading')}
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {prioritizedProgress.length > 0 ? (
              prioritizedProgress.map((progress) => {
                const badgeName = progress.badge?.name || t('dashboard.badges.untitled_badge');
                const progressValue = Math.max(0, Math.min(100, progress.progress_percent));
                const nextStep = progress.next_steps[0] || null;

                return (
                  <div
                    key={String(progress.id ?? progress.badge?.code ?? badgeName)}
                    className="rounded-2xl border border-border bg-background/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold">{badgeName}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {progress.completed_conditions_count}/{progress.total_conditions_count}{' '}
                          {t('dashboard.badges.criteria_complete')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {Math.round(progressValue)}%
                      </Badge>
                    </div>

                    <Progress value={progressValue} className="mt-3 h-2.5" />

                    {nextStep ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {t('dashboard.badges.next_step')}:
                        </span>{' '}
                        {nextStep}
                      </p>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-background/50 p-5 text-sm text-muted-foreground">
                {t('dashboard.badges.progress_empty')}
              </div>
            )}

            {activeRewards.length > 0 ? (
              <div className="rounded-2xl border border-border bg-background/50 p-4">
                <h3 className="text-sm font-semibold">{t('dashboard.badges.rewards_title')}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeRewards.map((reward) => (
                    <Badge key={String(reward.id ?? reward.reward_type)} variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                      {reward.badge?.name || t('dashboard.badges.untitled_badge')}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </motion.section>
    </div>
  );
}
