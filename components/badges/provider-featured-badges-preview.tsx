"use client";

import Image from 'next/image';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { usePublicUserFeaturedBadges } from '@/hooks/use-api';
import {
  normalizeUserBadgeCollection,
  resolveBadgeIcon,
  resolveBadgePalette,
} from '@/lib/badges';

type ProviderFeaturedBadgesPreviewProps = {
  provider: {
    id: string | number;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
    rating?: string | number | null;
    featuredBadges?: unknown[];
    featured_badges?: unknown[];
  };
};

const normalizeRating = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export function ProviderFeaturedBadgesPreview({
  provider,
}: ProviderFeaturedBadgesPreviewProps) {
  const t = useTranslations('services.results');
  const [open, setOpen] = useState(false);
  const inlineFeaturedBadges = normalizeUserBadgeCollection(
    provider?.featuredBadges ?? provider?.featured_badges
  );
  const shouldFetchFeaturedBadges = open && inlineFeaturedBadges.length === 0 && Boolean(provider?.id);
  const {
    data: fetchedFeaturedBadgesData,
    loading: loadingFeaturedBadges,
  } = usePublicUserFeaturedBadges(provider?.id, shouldFetchFeaturedBadges);
  const featuredBadges =
    inlineFeaturedBadges.length > 0
      ? inlineFeaturedBadges
      : (fetchedFeaturedBadgesData ?? []);
  const previewBadges = featuredBadges.slice(0, 3);
  const hasFeaturedBadges = previewBadges.length > 0;
  const providerName = `${provider.firstName ?? ''} ${provider.lastName ?? ''}`.trim() || 'Provider';
  const providerRating = normalizeRating(provider.rating);

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          className="relative group focus:outline-none"
          aria-label={providerName}
        >
          <Image
            src={provider.avatar || '/placeholder-avatar.png'}
            alt={providerName}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full border-2 border-white object-cover"
          />
          {hasFeaturedBadges ? (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-emerald-500 text-white shadow-sm">
              <Star className="h-2 w-2 fill-current" />
            </span>
          ) : null}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-72 border-slate-200 bg-white/95 p-4 backdrop-blur-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]/95"
      >
        <div className="flex items-start gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-100 dark:bg-[#111B2D]">
            <Image
              src={provider.avatar || '/placeholder-avatar.png'}
              alt={providerName}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                {providerName}
              </p>
              {providerRating !== null ? (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-[#A3ADC2]">
                  <Star className="h-3 w-3 fill-[#F5A623] text-[#F5A623]" />
                  {providerRating.toFixed(providerRating % 1 === 0 ? 0 : 1)}
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-[#6B7285]">
              {t('provider_badges_title')}
            </p>
          </div>
        </div>

        <div className="mt-4">
          {loadingFeaturedBadges ? (
            <p className="text-xs text-slate-500 dark:text-[#A3ADC2]">
              {t('badges_loading')}
            </p>
          ) : hasFeaturedBadges ? (
            <div className="flex flex-wrap gap-2">
              {previewBadges.map((badgeRecord, index) => {
                const badgeDefinition = badgeRecord.badge;
                const Icon = resolveBadgeIcon(badgeDefinition);
                const palette = resolveBadgePalette(badgeDefinition);

                return (
                  <div
                    key={String(badgeRecord.id ?? badgeDefinition?.code ?? `service-badge-${index}`)}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      color: palette.color,
                      backgroundColor: palette.backgroundColor,
                      borderColor: palette.borderColor,
                    }}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{badgeDefinition?.name ?? t('provider_badges_title')}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Badge
              variant="outline"
              className="border-slate-200 bg-white text-[11px] text-slate-600 dark:border-[#1E2A3D] dark:bg-[#111B2D] dark:text-[#A3ADC2]"
            >
              {t('badges_none')}
            </Badge>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
