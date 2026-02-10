"use client";

import {Card, CardContent} from "@/components/ui/card";
import {MapPin, Star} from "lucide-react";
import ProviderService from "./[id]/provider-service";
import { useRouter } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface ProviderCardProps {
    provider: any;
    avatarPriority?: boolean;
}
export default function ProviderCard({ provider, avatarPriority = false }: ProviderCardProps) {
    const router = useRouter();
    const t = useTranslations();
    const profileTarget = provider.profile_url || provider.id;

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
                                    <div className="flex items-center space-x-3 text-sm text-slate-500 dark:text-[#A3ADC2]">
                                        {provider.services?.length > 0 && provider.services.map((service: any, index: number) => (
                                            <ProviderService service={ service} key={index} />
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
