"use client";

import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Loader2, MapPin, Star} from "lucide-react";
import ProviderServiceBadge from "./provider-service-badge";
import { useRouter } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { usePublicUserFeaturedBadges } from '@/hooks/use-api';
import {
    normalizeUserBadgeCollection,
    resolveBadgeIcon,
    resolveBadgePalette,
} from '@/lib/badges';

interface ProviderCardProps {
    provider: any;
    avatarPriority?: boolean;
}
export default function ProviderCard({ provider, avatarPriority = false }: ProviderCardProps) {
    const router = useRouter();
    const t = useTranslations();
    const profileTarget = provider.profile_url || provider.id;
    const providerFeaturedBadges = normalizeUserBadgeCollection(
        provider?.featuredBadges ?? provider?.featured_badges
    );
    const shouldFetchFeaturedBadges = providerFeaturedBadges.length === 0 && Boolean(provider?.id);
    const { data: fetchedFeaturedBadgesData, loading: loadingFeaturedBadges } =
        usePublicUserFeaturedBadges(provider?.id, shouldFetchFeaturedBadges);
    const featuredBadges =
        providerFeaturedBadges.length > 0
            ? providerFeaturedBadges
            : (fetchedFeaturedBadgesData ?? []);
    const badgePreview = featuredBadges.slice(0, 2);
    const hiddenBadgesCount = Math.max(0, featuredBadges.length - badgePreview.length);

    return (
        <Card
            key={provider.id}
            className="cursor-pointer glass-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            onClick={() => router.push(`/provider/${profileTarget}`)}
        >
            <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-100 dark:bg-[#111B2D]">
                        {provider.avatar ? (
                            <Image
                                src={provider.avatar}
                                alt={t('projects.provider_card.avatar_alt', {
                                    firstName: provider.firstName,
                                    lastName: provider.lastName,
                                })}
                                fill
                                priority={avatarPriority}
                                className="object-cover"
                                sizes="40px"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600 dark:text-[#A3ADC2]">
                                {provider.firstName?.[0]}{provider.lastName?.[0]}
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div>
                                    <div className="font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                        {provider.firstName} {provider.lastName}
                                    </div>
                                    <div className="flex items-center space-x-3 text-sm text-slate-500 dark:text-[#A3ADC2]">
                                        <div className="flex items-center space-x-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>{provider.location || t('projects.provider_card.location_fallback')}</span>
                                        </div>
                                    </div>
                                    {(loadingFeaturedBadges || badgePreview.length > 0) && (
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            {badgePreview.map((badgeRecord: any, index: number) => {
                                                const badgeDefinition = badgeRecord.badge;
                                                const Icon = resolveBadgeIcon(badgeDefinition);
                                                const palette = resolveBadgePalette(badgeDefinition);

                                                return (
                                                    <div
                                                        key={String(badgeRecord.id ?? badgeDefinition?.code ?? `listing-badge-${index}`)}
                                                        className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                                                        style={{
                                                            color: palette.color,
                                                            backgroundColor: palette.backgroundColor,
                                                            borderColor: palette.borderColor,
                                                        }}
                                                    >
                                                        <Icon className="h-3 w-3 shrink-0" />
                                                        <span className="truncate max-w-[140px]">
                                                            {badgeDefinition?.name ?? t('projects.provider_card.badges_label')}
                                                        </span>
                                                    </div>
                                                );
                                            })}

                                            {hiddenBadgesCount > 0 && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-slate-200 bg-white/80 text-[11px] text-slate-600 dark:border-[#1E2A3D] dark:bg-[#111B2D] dark:text-[#A3ADC2]"
                                                >
                                                    {t('projects.provider_card.more_badges', { count: hiddenBadgesCount })}
                                                </Badge>
                                            )}

                                            {loadingFeaturedBadges && badgePreview.length === 0 && (
                                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#A3ADC2]">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    {t('projects.provider_card.badges_loading')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-3 text-sm text-slate-500 dark:text-[#A3ADC2]">
                                        {provider.services?.length > 0 && provider.services.map((service: any, index: number) => (
                                            <ProviderServiceBadge service={ service} key={index} />
                                        ))}
                                    </div>
                                </div>
                                {provider.bio && (<div className="mt-2 text-xs text-slate-500 dark:text-[#A3ADC2]">{provider.bio}</div>)}
                            </div>

                            <div className="text-right">
                                <div className="flex items-center space-x-1">
                                    <Star className="w-3 h-3 fill-[#F5A623] text-[#F5A623]" />
                                    <span>{provider.rating || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
