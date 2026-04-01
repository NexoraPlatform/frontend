"use client";

import { Calendar } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  humanizeBadgeToken,
  resolveBadgeIcon,
  resolveBadgePalette,
  resolveBadgeRewardSummary,
  type UserBadgeRecord,
} from '@/lib/badges';
import { cn } from '@/lib/utils';

type BadgeCardProps = {
  record: UserBadgeRecord;
  locale?: string;
  compact?: boolean;
  className?: string;
  showRewardHint?: boolean;
};

export function BadgeCard({
  record,
  locale = 'ro-RO',
  compact = false,
  className,
  showRewardHint = true,
}: BadgeCardProps) {
  const badge = record.badge;

  if (!badge) {
    return null;
  }

  const Icon = resolveBadgeIcon(badge);
  const palette = resolveBadgePalette(badge);
  const rewardHint = showRewardHint ? resolveBadgeRewardSummary(badge.reward_config) : null;
  const tierLabel = record.tier?.tier_name ?? humanizeBadgeToken(record.tier?.tier_code);
  const awardedAt = record.awarded_at ? new Date(record.awarded_at) : null;
  const awardedAtLabel =
    awardedAt && !Number.isNaN(awardedAt.getTime())
      ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(awardedAt)
      : null;

  return (
    <article
      className={cn(
        'rounded-2xl border shadow-sm backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5',
        compact ? 'p-4' : 'p-5',
        className
      )}
      style={{
        backgroundColor: palette.backgroundColor,
        borderColor: palette.borderColor,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-white/80"
          style={{
            color: palette.color,
            borderColor: palette.borderColor,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{badge.name}</h3>
            {tierLabel ? (
              <Badge variant="secondary" className="bg-white/80 text-xs text-foreground/80">
                {tierLabel}
              </Badge>
            ) : null}
          </div>

          <p className={cn('mt-2 text-sm leading-relaxed text-muted-foreground', compact ? 'line-clamp-2' : '')}>
            {badge.short_description || badge.description || badge.name}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {badge.category ? (
          <Badge variant="outline" className="border-white/70 bg-white/70 text-xs text-foreground/80">
            {humanizeBadgeToken(badge.category)}
          </Badge>
        ) : null}

        {rewardHint ? (
          <Badge className="bg-white text-xs text-foreground hover:bg-white">
            {rewardHint}
          </Badge>
        ) : null}

        {awardedAtLabel ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {awardedAtLabel}
          </span>
        ) : null}
      </div>
    </article>
  );
}
