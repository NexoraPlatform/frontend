"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Calendar,
    DollarSign,
    Clock,
    User,
    CheckCircle,
    XCircle,
    MapPin,
    Star,
    Eye,
    MessageSquare,
    Loader2,
    Banknote,
    Shield
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ro } from 'date-fns/locale';
import { useAuth } from "@/contexts/auth-context";
import apiClient from "@/lib/api";
import { MuiIcon } from "@/components/MuiIcons";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
    DialogTitle,
    DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { useRouter } from '@/lib/navigation';
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { formatDeadline } from '@/lib/projects';
import { Input } from "@/components/ui/input";
import { Locale } from '@/types/locale';
import { PriceDisplay } from '@/components/PriceDisplay';
import RapydCheckoutButton from "@/components/RapydCheckoutButton";

interface ProjectRequestCardProps {
    project: any;
    onResponse: (
        projectId: string,
        payload: {
            response: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NEW_PROPOSE';
            proposedBudget?: number;
            reason?: string;
            refusal_scope?: 'project' | 'milestone' | 'milestones';
            milestone_ids?: Array<string | number>;
            suggestions_limit?: number;
        }
    ) => void;
    onRefresh?: () => void;
}

const toFiniteNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
};

const normalizeStatusValue = (value: unknown): string => String(value ?? '').trim().toUpperCase();
const normalizePositiveBudget = (value: unknown): number | null => {
    const numeric = toFiniteNumber(value);
    if (numeric === null || numeric <= 0) return null;
    return numeric;
};

export function ProjectRequestCard({ project, onResponse, onRefresh }: ProjectRequestCardProps) {
    const { user, loading } = useAuth();
    const [responding, setResponding] = useState<string | null>(null);
    const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);
    const router = useRouter();
    const locale = useLocale() as Locale;
    const t = useTranslations();
    const dateLocale = locale?.toLowerCase().startsWith('en') ? enUS : ro;
    const [proposeNewBudgetProviderId, setProposeNewBudgetProviderId] = useState<string | null>(null);
    const [newBudget, setNewBudget] = useState<number>(0);



    const getNextMilestoneStatus = (status: string): 'work_in_progress' | 'finished' | null => {
        const normalized = normalizeStatusValue(status);
        if (normalized === 'PENDING') return 'work_in_progress';
        if (normalized === 'WORK_IN_PROGRESS' || normalized === 'IN_PROGRESS') return 'finished';
        return null;
    };

    const handleMarkMilestoneStatus = async (
        projectId: number | string,
        milestone: number | string,
        currentStatus: string
    ) => {
        const nextStatus = getNextMilestoneStatus(currentStatus);
        if (!nextStatus) return;

        const requestMilestoneId = String(milestone);
        setUpdatingMilestoneId(requestMilestoneId);
        try {
            await apiClient.markProjectMilestone(projectId, {
                milestone: requestMilestoneId,
                language: locale,
                status: nextStatus,
            });
            await onRefresh?.();
        } catch (error: any) {
            toast.error(t('client.project_requests.errors.generic', { message: error?.message ?? 'Unknown error' }));
        } finally {
            setUpdatingMilestoneId(null);
        }
    }

    const handleBudgetResponse = async (
        projectId: string,
        providerId: string,
        budget: number,
        response: 'ACCEPTED' | 'REJECTED'
    ) => {
        setResponding(`${projectId}-${providerId}`);
        try {
            await apiClient.respondToBudgetProposal(
                projectId,
                providerId,
                {
                    budget,
                    notes:
                        response === 'ACCEPTED'
                            ? 'Budget approved by client'
                            : 'Budget proposal rejected by client',
                },
                locale
            );
            toast.success(
                response === 'ACCEPTED'
                    ? t('client.project_requests.budget.approved')
                    : t('client.project_requests.budget.rejected')
            );
            onRefresh?.();
        } catch (error: any) {
            toast.error(t('client.project_requests.errors.generic', { message: error.message }));
        } finally {
            setResponding(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const normalizedStatus = normalizeStatusValue(status);
        switch (normalizedStatus) {
            case 'PENDING':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.pending')}
                    </Badge>
                );
            case 'WORK_IN_PROGRESS':
                return (
                    <Badge className="bg-sky-100 text-sky-800">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.work_in_progress')}
                    </Badge>
                );
            case 'AWAITING_BUDGET_APPROVAL':
                return (
                    <Badge className="bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.awaiting_budget_approval')}
                    </Badge>
                );
            case 'ACCEPTED':
                return (
                    <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.accepted')}
                    </Badge>
                );
            case 'REJECTED':
                return (
                    <Badge className="bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.rejected')}
                    </Badge>
                );
            case 'NEW_PROPOSE':
                return (
                    <Badge className="bg-emerald-100 text-emerald-800">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.budget_proposed')}
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{normalizedStatus || '-'}</Badge>;
        }
    };

    const getMilestonePaymentStatusBadge = (status: string) => {
        const normalizedStatus = normalizeStatusValue(status);
        switch (normalizedStatus) {
            case 'PENDING':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.payment_status.pending')}
                    </Badge>
                );
            case 'ESCROW':
                return (
                    <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.payment_status.escrow')}
                    </Badge>
                );
            case 'PAID':
                return (
                    <Badge className="bg-green-400 text-green-900">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.payment_status.paid')}
                    </Badge>
                );
            case 'REJECTED':
                return (
                    <Badge className="bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.payment_status.rejected')}
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{normalizedStatus || '-'}</Badge>;
        }
    };

    const getMilestoneStatusBadge = (status: string) => {
        const normalizedStatus = normalizeStatusValue(status);
        switch (normalizedStatus) {
            case 'PENDING':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.pending')}
                    </Badge>
                );
            case 'WORK_IN_PROGRESS':
            case 'IN_PROGRESS':
                return (
                    <Badge className="bg-sky-100 text-sky-800">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.work_in_progress')}
                    </Badge>
                );
            case 'FINISHED':
            case 'COMPLETED':
                return (
                    <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.finished')}
                    </Badge>
                );
            case 'PAID':
                return (
                    <Badge className="bg-green-400 text-green-900">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.paid')}
                    </Badge>
                );
            case 'REJECTED':
                return (
                    <Badge className="bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.rejected')}
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{normalizedStatus || '-'}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const roleSlugs = [
        ...(Array.isArray(user?.role_slugs) ? user.role_slugs : []),
        ...((Array.isArray(user?.roles) ? user.roles : []).map((role: any) => role?.slug).filter(Boolean)),
    ]
        .map((slug) => String(slug).toLowerCase())
        .filter(Boolean);
    const isClientRole = roleSlugs.includes('client') || String(user?.role ?? '').toLowerCase() === 'client';
    const isProviderRole = roleSlugs.includes('provider') || String(user?.role ?? '').toLowerCase() === 'provider';

    const existingServices = Array.isArray(project?.existing_services) ? project.existing_services : [];
    const customServices = Array.isArray(project?.custom_services) ? project.custom_services : [];
    const projectLines = Array.isArray(project?.project_lines) ? project.project_lines : [];
    const servicesMap = new Map(existingServices.map((service: any) => [String(service?.id ?? service?.name), service]));
    const selectedProviders = Array.isArray(project?.selected_providers) ? project.selected_providers : [];
    const selectedProvidersById: Map<string, any> = new Map(
        selectedProviders
            .map((provider: any): [string, any] => [String(provider?.id), provider])
            .filter((entry: [string, any]) => entry[0] !== 'undefined' && entry[0] !== 'null')
    );

    const getMilestoneId = (milestone: any) => {
        return (
            milestone?.id ??
            milestone?.milestone_id ??
            milestone?.milestoneId ??
            milestone?.milestone_uuid ??
            milestone?.milestoneUuid ??
            milestone?.uuid ??
            null
        );
    };

    const resolveProviderId = (value: any): string | null => {
        const rawId = value?.id ?? value?.provider_id ?? value?.providerId ?? null;
        return rawId === null || rawId === undefined ? null : String(rawId);
    };

    const deriveProviderServicesFromProjectLines = (providerId: string) => {
        const services = projectLines.flatMap((line: any) => {
            const lineProviders = Array.isArray(line?.providers) ? line.providers : [];
            const isProviderAssignedToLine = lineProviders.some(
                (lineProvider: any) => resolveProviderId(lineProvider) === providerId
            );
            if (!isProviderAssignedToLine) return [];

            const lineServiceId = line?.service_id ?? null;
            const lineServiceName = String(line?.service_name ?? '').trim();
            if (!lineServiceName) return [];

            return [{
                id: lineServiceId,
                name: lineServiceName,
                categoryIcon: undefined,
            }];
        });

        const deduplicated = new Map<string, { id?: unknown; name: string; categoryIcon?: string }>();
        services.forEach((service: { id?: unknown; name: string; categoryIcon?: string }) => {
            const key = `${String(service.id ?? '')}:${service.name.toLowerCase()}`;
            if (!deduplicated.has(key)) {
                deduplicated.set(key, service);
            }
        });

        return Array.from(deduplicated.values());
    };

    const normalizeProviderForCard = (providerRaw: any) => {
        const providerId = resolveProviderId(providerRaw);
        if (!providerId) return null;

        const selectedProvider = selectedProvidersById.get(providerId) ?? null;
        const providerResponse = normalizeStatusValue(
            providerRaw?.provider_response ??
            providerRaw?.pivotResponse ??
            providerRaw?.pivot?.provider_response ??
            selectedProvider?.provider_response ??
            selectedProvider?.pivot?.provider_response
        );
        const providerStatus = normalizeStatusValue(
            providerRaw?.status ??
            providerResponse ??
            selectedProvider?.status
        ) || 'PENDING';
        const services =
            Array.isArray(providerRaw?.services) && providerRaw.services.length > 0
                ? providerRaw.services
                : deriveProviderServicesFromProjectLines(providerId);
        const allocatedBudget = normalizePositiveBudget(
            providerRaw?.allocatedBudget ??
            providerRaw?.allocated_budget ??
            providerRaw?.pivot?.allocated_budget
        );
        const proposedBudget = normalizePositiveBudget(
            providerRaw?.proposedBudget ??
            providerRaw?.proposed_budget ??
            providerRaw?.pivot?.provider_budgets
        );

        return {
            ...providerRaw,
            id: providerId,
            firstName: providerRaw?.firstName ?? providerRaw?.first_name ?? selectedProvider?.firstName ?? '',
            lastName: providerRaw?.lastName ?? providerRaw?.last_name ?? selectedProvider?.lastName ?? '',
            avatar: providerRaw?.avatar ?? selectedProvider?.avatar ?? null,
            rating: toFiniteNumber(providerRaw?.rating ?? selectedProvider?.rating) ?? 0,
            location:
                providerRaw?.location ??
                selectedProvider?.location ??
                selectedProvider?.profile?.location ??
                null,
            services,
            status: providerStatus,
            provider_response: providerResponse,
            client_budget_approved: normalizeStatusValue(
                providerRaw?.client_budget_approved ??
                providerRaw?.pivotClientResponse ??
                providerRaw?.pivot?.client_budget_approved ??
                selectedProvider?.pivot?.client_budget_approved
            ),
            allocatedBudget,
            proposedBudget,
            respondedAt:
                providerRaw?.respondedAt ??
                providerRaw?.responded_at ??
                providerRaw?.pivot?.updated_at ??
                selectedProvider?.pivot?.updated_at ??
                null,
        };
    };

    const providersListRaw =
        Array.isArray(project?.providers) && project.providers.length > 0
            ? project.providers
            : selectedProviders;
    const normalizedProviders = providersListRaw
        .map((provider: any) => normalizeProviderForCard(provider))
        .filter((provider: any) => Boolean(provider));

    const getProjectMilestones = (projectData: any) => {
        const rootMilestones = Array.isArray(projectData?.project_line_milestones)
            ? projectData.project_line_milestones
            : [];
        if (rootMilestones.length > 0) {
            return rootMilestones;
        }

        const lineMilestones = Array.isArray(projectData?.project_lines)
            ? projectData.project_lines.flatMap((line: any) =>
                (Array.isArray(line?.milestones) ? line.milestones : []).map((milestone: any) => ({
                    ...milestone,
                    project_line_id: milestone?.project_line_id ?? milestone?.projectLineId ?? line?.id,
                    service_id: milestone?.service_id ?? milestone?.serviceId ?? line?.service_id,
                    service_name: milestone?.service_name ?? milestone?.serviceName ?? line?.service_name,
                    assigned_provider_id:
                        milestone?.assigned_provider_id ??
                        milestone?.providerId ??
                        milestone?.provider_id ??
                        null,
                }))
            )
            : [];
        if (lineMilestones.length > 0) {
            return lineMilestones;
        }

        if (!Array.isArray(projectData?.milestones)) {
            return [];
        }

        return projectData.milestones.flatMap((milestoneGroup: any) => {
            const groupServiceId = milestoneGroup?.service_id ?? milestoneGroup?.serviceId ?? null;
            const groupServiceName = milestoneGroup?.service_name ?? milestoneGroup?.serviceName ?? null;
            const groupLineId = milestoneGroup?.project_line_id ?? milestoneGroup?.projectLineId ?? null;
            const groupProviderId = milestoneGroup?.provider_id ?? milestoneGroup?.providerId ?? null;
            const groupedMilestones = Array.isArray(milestoneGroup?.milestones) ? milestoneGroup.milestones : [];

            return groupedMilestones.map((milestone: any) => ({
                ...milestone,
                project_line_id: milestone?.project_line_id ?? milestone?.projectLineId ?? groupLineId,
                service_id: milestone?.service_id ?? milestone?.serviceId ?? groupServiceId,
                service_name: milestone?.service_name ?? milestone?.serviceName ?? groupServiceName,
                assigned_provider_id:
                    milestone?.assigned_provider_id ??
                    milestone?.providerId ??
                    milestone?.provider_id ??
                    groupProviderId ??
                    null,
            }));
        });
    };

    const getProviderMilestones = (projectData: any, providerData: any) => {
        const providerId = resolveProviderId(providerData);
        if (!providerId) return [];

        const toSortableNumber = (value: unknown) => {
            if (value === null || value === undefined || value === '') {
                return Number.MAX_SAFE_INTEGER;
            }
            const numeric = Number(value);
            return Number.isFinite(numeric) ? numeric : Number.MAX_SAFE_INTEGER;
        };

        const sortAndDeduplicateMilestones = (milestones: any[]) => {
            const seenIds = new Set<string>();
            return [...milestones]
                .sort((a: any, b: any) => {
                    const lineOrderA = toSortableNumber(a?.project_line_id ?? a?.projectLineId);
                    const lineOrderB = toSortableNumber(b?.project_line_id ?? b?.projectLineId);
                    if (lineOrderA !== lineOrderB) return lineOrderA - lineOrderB;

                    const sequenceOrderA = toSortableNumber(
                        a?.sequence ??
                        a?.order ??
                        a?.order_index ??
                        a?.orderIndex ??
                        a?.position
                    );
                    const sequenceOrderB = toSortableNumber(
                        b?.sequence ??
                        b?.order ??
                        b?.order_index ??
                        b?.orderIndex ??
                        b?.position
                    );
                    if (sequenceOrderA !== sequenceOrderB) return sequenceOrderA - sequenceOrderB;

                    const numericIdA = toSortableNumber(getMilestoneId(a));
                    const numericIdB = toSortableNumber(getMilestoneId(b));
                    return numericIdA - numericIdB;
                })
                .filter((milestone: any) => {
                    const milestoneId = getMilestoneId(milestone);
                    if (milestoneId === null || milestoneId === undefined) {
                        return true;
                    }
                    const key = String(milestoneId);
                    if (seenIds.has(key)) {
                        return false;
                    }
                    seenIds.add(key);
                    return true;
                });
        };

        const allMilestones = getProjectMilestones(projectData);
        if (allMilestones.length === 0) {
            return [];
        }

        const getAssignedProviderId = (milestone: any) =>
            milestone?.assigned_provider_id ??
            milestone?.assignedProviderId ??
            milestone?.providerId ??
            milestone?.provider_id ??
            null;
        const isUnassignedMilestone = (milestone: any) => {
            const assignedProviderId = getAssignedProviderId(milestone);
            return assignedProviderId === null || assignedProviderId === undefined || String(assignedProviderId) === '';
        };

        const projectLinesForFiltering = Array.isArray(projectData?.project_lines) ? projectData.project_lines : [];
        const providerLineIds = new Set(
            projectLinesForFiltering
                .filter((line: any) =>
                    Array.isArray(line?.providers) &&
                    line.providers.some((lineProvider: any) => resolveProviderId(lineProvider) === providerId)
                )
                .map((line: any) => String(line?.id))
                .filter(Boolean)
        );

        const explicitlyAssignedMilestones = allMilestones.filter((milestone: any) => {
            const assignedProviderId = getAssignedProviderId(milestone);
            return assignedProviderId !== null &&
                assignedProviderId !== undefined &&
                String(assignedProviderId) === providerId;
        });
        const unassignedMilestonesFromProviderLines = allMilestones.filter((milestone: any) => {
            if (!isUnassignedMilestone(milestone)) {
                return false;
            }
            const lineId = milestone?.project_line_id ?? milestone?.projectLineId;
            if (lineId === null || lineId === undefined) {
                return false;
            }
            return providerLineIds.has(String(lineId));
        });

        const legacyProviderMilestones = projectData?.milestones
            ?.find((entry: any) => String(entry?.providerId ?? entry?.provider_id) === providerId)
            ?.milestones;
        const mergedPrimaryMilestones = [
            ...explicitlyAssignedMilestones,
            ...unassignedMilestonesFromProviderLines,
            ...(Array.isArray(legacyProviderMilestones) ? legacyProviderMilestones : []),
        ];
        if (mergedPrimaryMilestones.length > 0) {
            return sortAndDeduplicateMilestones(mergedPrimaryMilestones);
        }

        const providerServices =
            Array.isArray(providerData?.services) && providerData.services.length > 0
                ? providerData.services
                : deriveProviderServicesFromProjectLines(providerId);
        const providerServiceIds = new Set(
            providerServices
                .map((service: any) => service?.id ?? service?.service_id)
                .filter((id: unknown) => id !== null && id !== undefined)
                .map((id: unknown) => String(id))
        );
        const providerServiceNames = new Set(
            providerServices
                .map((service: any) => String(service?.name ?? '').trim().toLowerCase())
                .filter(Boolean)
        );

        if (providerServiceIds.size === 0 && providerServiceNames.size === 0) {
            return [];
        }

        const filtered = allMilestones.filter((milestone: any) => {
            if (!isUnassignedMilestone(milestone)) {
                return false;
            }

            const milestoneServiceId = milestone?.service_id;
            if (milestoneServiceId !== null && milestoneServiceId !== undefined) {
                if (providerServiceIds.has(String(milestoneServiceId))) {
                    return true;
                }
            }

            const milestoneServiceName = String(milestone?.service_name ?? '').trim().toLowerCase();
            if (milestoneServiceName && providerServiceNames.has(milestoneServiceName)) {
                return true;
            }

            const lineId = milestone?.project_line_id ?? milestone?.projectLineId;
            if (lineId === null || lineId === undefined) {
                return false;
            }

            const line = projectLinesForFiltering.find((entry: any) => String(entry?.id) === String(lineId));
            if (!line) {
                return false;
            }

            const lineServiceId = line?.service_id;
            if (lineServiceId !== null && lineServiceId !== undefined) {
                if (providerServiceIds.has(String(lineServiceId))) {
                    return true;
                }
            }

            const lineServiceName = String(line?.service_name ?? '').trim().toLowerCase();
            return Boolean(lineServiceName && providerServiceNames.has(lineServiceName));
        });

        return sortAndDeduplicateMilestones(filtered);
    };

    const projectBudgetAmount = (() => {
        if (project?.budget && typeof project.budget === 'object') {
            return toFiniteNumber((project.budget as { amount?: unknown }).amount);
        }

        return toFiniteNumber(project?.budget);
    })();
    const projectCreatedAt = project?.created_at ? new Date(project.created_at) : null;
    const hasValidProjectCreatedAt = Boolean(projectCreatedAt && !Number.isNaN(projectCreatedAt.getTime()));
    const activeServices = Array.from(servicesMap.values());
    const providersCount = normalizedProviders.length;

    return (
        <Card key={project.id} className="border-2">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-xl mb-2">
                            {project.title}
                            <span className="ms-2">{getStatusBadge(project.status)}</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                            {project.description}
                        </CardDescription>

                        <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4" />
                                <span>
                                    {t('client.project_requests.project.total_budget')}{' '}
                                    {projectBudgetAmount != null ? <PriceDisplay value={projectBudgetAmount} /> : '-'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    {project.project_duration
                                        ? `${t('client.project_requests.project.deadline')} ${formatDeadline(project.project_duration, locale)}`
                                        : t('client.project_requests.project.no_deadline')
                                    }
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    {t('client.project_requests.project.created')}{' '}
                                    {hasValidProjectCreatedAt && projectCreatedAt
                                        ? formatDistanceToNow(projectCreatedAt, {
                                            addSuffix: true,
                                            locale: dateLocale
                                        })
                                        : '-'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{t('client.project_requests.project.selected_providers', { count: providersCount })}</span>
                            </div>
                        </div>
                    </div>
                    {activeServices.map((service: any, index: number) => (
                        <Badge key={index} className="bg-emerald-100 text-emerald-800 inline-flex whitespace-nowrap me-1">
                            {service?.name ?? '-'}
                        </Badge>
                    ))}

                </div>
            </CardHeader>

            <CardContent>
                {/* Technologies */}
                {(existingServices.length > 0 || customServices.length > 0) && (
                        <div className="mb-4">
                            <div className="text-sm font-medium mb-2">{t('client.project_requests.project.technologies')}:</div>
                            <div className="flex flex-wrap gap-1">
                                {existingServices.map((tech: any, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {tech.name}
                                    </Badge>
                                ))}
                                {customServices.map((tech: any, index: number) => (
                                    <Badge key={`custom-${index}`} variant="outline" className="text-xs">
                                        {tech?.name ?? tech}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                {/* Providers List */}
                <div>
                    <div className="text-sm font-medium mb-3">{t('client.project_requests.providers.title')}:</div>
                    <div className="space-y-3">
                        {normalizedProviders.map((provider: any) => {
                            const providerMilestones = getProviderMilestones(project, provider);
                            const providerMilestonesTotal = providerMilestones.reduce((sum: number, milestone: any) => {
                                return sum + (toFiniteNumber(milestone?.amount) ?? 0);
                            }, 0);
                            const providerResponseStatus = normalizeStatusValue(provider?.provider_response);
                            const isCurrentUserProvider = String(provider?.id ?? '') === String(user?.id ?? '');
                            const isProjectPending = normalizeStatusValue(project?.status) === 'PENDING';
                            const providerBudgetBase =
                                provider.allocatedBudget != null
                                    ? provider.allocatedBudget
                                    : providerMilestonesTotal > 0
                                        ? providerMilestonesTotal
                                        : null;
                            const approveBudgetValue =
                                provider.proposedBudget != null ? provider.proposedBudget : providerBudgetBase;
                            const rejectBudgetValue =
                                providerBudgetBase != null ? providerBudgetBase : provider.proposedBudget;
                            const canClientManageBudgetProposal = isClientRole && providerResponseStatus === 'PENDING';
                            const canProviderRespondToProject =
                                isProviderRole &&
                                isCurrentUserProvider &&
                                isProjectPending &&
                                providerResponseStatus === 'PENDING';
                            const milestoneStatusFor = (entry: any) => normalizeStatusValue(entry?.status ?? '');
                            const milestonePaymentStatusFor = (entry: any) =>
                                normalizeStatusValue(entry?.payment_status ?? entry?.paymentStatus ?? 'PENDING');
                            const isPendingPaymentStatus = (entry: any) =>
                                milestonePaymentStatusFor(entry).startsWith('PENDING');
                            const isApprovedStatus = (value: unknown) => {
                                const normalized = normalizeStatusValue(value);
                                return normalized === 'ACCEPTED' || normalized === 'APPROVED' || normalized === 'TRUE';
                            };
                            const providerBudgetApprovalStatus = normalizeStatusValue(
                                provider?.client_budget_approved ??
                                provider?.pivotClientResponse ??
                                provider?.pivot?.client_budget_approved ??
                                ''
                            );
                            const getMilestoneBudgetApprovalStatus = (entry: any) =>
                                normalizeStatusValue(
                                    entry?.budget_approved ??
                                    entry?.budgetApproval ??
                                    entry?.client_budget_approved ??
                                    entry?.clientBudgetApproved ??
                                    entry?.assigned_provider?.client_budget_approved ??
                                    entry?.assigned_provider?.clientBudgetApproved ??
                                    entry?.assigned_provider?.pivot?.client_budget_approved ??
                                    ''
                                );
                            const isMilestoneBudgetApproved = (entry: any) => {
                                const milestoneBudgetApprovalStatus = getMilestoneBudgetApprovalStatus(entry);
                                if (milestoneBudgetApprovalStatus) {
                                    return isApprovedStatus(milestoneBudgetApprovalStatus);
                                }
                                if (providerBudgetApprovalStatus) {
                                    return isApprovedStatus(providerBudgetApprovalStatus);
                                }
                                return false;
                            };
                            const providerHasApprovedMilestoneBudget = providerMilestones.some((entry: any) => {
                                const milestoneBudgetApprovalStatus = getMilestoneBudgetApprovalStatus(entry);
                                if (!milestoneBudgetApprovalStatus) return false;
                                return isApprovedStatus(milestoneBudgetApprovalStatus);
                            });
                            const isProviderBudgetApproved =
                                isApprovedStatus(providerBudgetApprovalStatus) || providerHasApprovedMilestoneBudget;
                            const providerStatus = normalizeStatusValue(provider?.status ?? 'PENDING');
                            const providerDisplayStatus =
                                providerStatus === 'WORK_IN_PROGRESS' && !isProviderBudgetApproved
                                    ? 'AWAITING_BUDGET_APPROVAL'
                                    : providerStatus;
                            const isFinalizedMilestone = (entry: any) => {
                                const status = milestoneStatusFor(entry);
                                return status === 'FINISHED' || status === 'COMPLETED' || status === 'PAID';
                            };
                            const firstPendingIndex = providerMilestones.findIndex(
                                (milestone: any) => isPendingPaymentStatus(milestone)
                            );
                            const previousPendingMilestone =
                                firstPendingIndex > 0 ? providerMilestones[firstPendingIndex - 1] : null;
                            const canAdvanceToNextPendingMilestone =
                                firstPendingIndex === 0 ||
                                (previousPendingMilestone != null && isFinalizedMilestone(previousPendingMilestone));
                            const securizablePendingIndex =
                                firstPendingIndex >= 0 && canAdvanceToNextPendingMilestone ? firstPendingIndex : -1;
                            return (
                            <div key={provider.id} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={provider.avatar} />
                                            <AvatarFallback>
                                                {provider.firstName?.[0]}{provider.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">
                                                {provider.firstName} {provider.lastName}
                                            </div>
                                            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                                                <div className="flex items-center space-x-1">
                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                    <span>{provider.rating || 0}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <MapPin className="w-3 h-3" />
                                                    <span>{provider.location || t('client.project_requests.providers.location_fallback')}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                                                {provider.services?.length > 0 && provider.services.map((service: any, index: number) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        <MuiIcon icon={service.categoryIcon} size={20} className="mr-1" />
                                                        {service.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(providerDisplayStatus)}
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {t('client.project_requests.providers.allocated')}{' '}
                                            {providerBudgetBase != null ? (
                                                <PriceDisplay value={providerBudgetBase} />
                                            ) : (
                                                '-'
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {canProviderRespondToProject && (
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                onResponse(String(project.id), { response: 'ACCEPTED' })
                                            }
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            {t('client.project_requests.budget.approve')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setNewBudget(providerBudgetBase ?? 0);
                                                setProposeNewBudgetProviderId(provider.id);
                                            }}
                                        >
                                            <Banknote className="w-4 h-4 mr-1" />
                                            {t('client.project_requests.budget.propose_new')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                                onResponse(String(project.id), {
                                                    response: 'REJECTED',
                                                    refusal_scope: 'project',
                                                    suggestions_limit: 5,
                                                    reason: 'Provider rejected project participation',
                                                })
                                            }
                                        >
                                            <XCircle className="w-4 h-4 mr-1" />
                                            {t('client.project_requests.budget.reject')}
                                        </Button>
                                    </div>
                                )}

                                {canProviderRespondToProject && (
                                    <Dialog
                                        open={proposeNewBudgetProviderId === provider.id}
                                        onOpenChange={(isOpen) => {
                                            if (isOpen) {
                                                setNewBudget(providerBudgetBase ?? 0);
                                            }
                                            setProposeNewBudgetProviderId(isOpen ? provider.id : null);
                                        }}
                                    >
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>{t('client.project_requests.budget.new_proposal')}</DialogTitle>
                                                <DialogDescription>
                                                    {t('client.project_requests.budget.new_proposal_description')}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="flex flex-col flex-wrap gap-1">
                                                <div>
                                                    {t('client.project_requests.budget.original')}{' '}
                                                    {providerBudgetBase != null ? (
                                                        <PriceDisplay value={providerBudgetBase} />
                                                    ) : (
                                                        '-'
                                                    )}
                                                </div>
                                                <div>{t('client.project_requests.budget.enter_proposal')}</div>
                                                <div>
                                                    <Input
                                                        type="number"
                                                        value={newBudget}
                                                        onChange={(e) => setNewBudget(Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline">{t('client.project_requests.budget.cancel')}</Button>
                                                </DialogClose>
                                                <Button
                                                    variant="default"
                                                    onClick={() => {
                                                        onResponse(String(project.id), {
                                                            response: 'NEW_PROPOSE',
                                                            proposedBudget: newBudget,
                                                        });
                                                        setProposeNewBudgetProviderId(null);
                                                    }}
                                                >
                                                    {t('client.project_requests.budget.save_changes')}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}

                                {canClientManageBudgetProposal && (
                                    <Dialog
                                        open={proposeNewBudgetProviderId === provider.id}
                                        onOpenChange={(isOpen) => {
                                            if (isOpen) {
                                                setNewBudget(providerBudgetBase ?? 0);
                                            }
                                            setProposeNewBudgetProviderId(isOpen ? provider.id : null);
                                        }}
                                    >
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                onClick={() => setNewBudget(providerBudgetBase ?? 0)}
                                            >
                                                {t('client.project_requests.budget.new_proposal')}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>{t('client.project_requests.budget.new_proposal')}</DialogTitle>
                                                <DialogDescription>
                                                    {t('client.project_requests.budget.new_proposal_description')}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="flex flex-col flex-wrap gap-1">
                                                <div>
                                                    {t('client.project_requests.budget.original')}{' '}
                                                    {providerBudgetBase != null ? (
                                                        <PriceDisplay value={providerBudgetBase} />
                                                    ) : (
                                                        '-'
                                                    )}
                                                </div>
                                                <div>{t('client.project_requests.budget.enter_proposal')}</div>
                                                <div>
                                                    <Input
                                                        type="number"
                                                        value={newBudget}
                                                        onChange={(e) => setNewBudget(Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline">{t('client.project_requests.budget.cancel')}</Button>
                                                </DialogClose>
                                                <Button
                                                    variant="default"
                                                    onClick={() => {
                                                        onResponse(String(project.id), {
                                                            response: 'NEW_PROPOSE',
                                                            proposedBudget: newBudget,
                                                        });
                                                        setProposeNewBudgetProviderId(null);
                                                    }}
                                                >
                                                    {t('client.project_requests.budget.save_changes')}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}

                                {/* Budget Proposal */}
                                {canClientManageBudgetProposal && (
                                    <Alert className={`mt-3 border-emerald-200 dark:bg-emerald-500/20 bg-emerald-50/70`}>
                                        <DollarSign className="h-4 w-4" />
                                        <AlertDescription>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">{t('client.project_requests.budget.new_proposal')}:</div>
                                                    <div className="text-lg font-bold text-emerald-600">
                                                        {provider.proposedBudget != null ? (
                                                            <PriceDisplay value={provider.proposedBudget} />
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {t('client.project_requests.budget.original')}{' '}
                                                        {providerBudgetBase != null ? (
                                                            <PriceDisplay value={providerBudgetBase} />
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            if (approveBudgetValue == null) return;
                                                            handleBudgetResponse(
                                                                String(project.id),
                                                                String(provider.id),
                                                                approveBudgetValue,
                                                                'ACCEPTED'
                                                            );
                                                        }}
                                                        disabled={
                                                            responding === `${project.id}-${provider.id}` ||
                                                            providerResponseStatus !== 'PENDING' ||
                                                            approveBudgetValue == null
                                                        }
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        {t('client.project_requests.budget.approve')}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setProposeNewBudgetProviderId(provider.id)}
                                                        disabled={responding === `${project.id}-${provider.id}` || providerResponseStatus !== 'PENDING'}
                                                    >
                                                        <Banknote className="w-4 h-4 mr-1" />
                                                        {t('client.project_requests.budget.propose_new')}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                            if (rejectBudgetValue == null) return;
                                                            handleBudgetResponse(
                                                                String(project.id),
                                                                String(provider.id),
                                                                rejectBudgetValue,
                                                                'REJECTED'
                                                            );
                                                        }}
                                                        disabled={
                                                            responding === `${project.id}-${provider.id}` ||
                                                            rejectBudgetValue == null
                                                        }
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        {t('client.project_requests.budget.reject')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Response Time */}
                                {provider.respondedAt && !Number.isNaN(new Date(provider.respondedAt).getTime()) && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        {t('client.project_requests.providers.response_received')}{' '}
                                        {formatDistanceToNow(new Date(provider.respondedAt), {
                                            addSuffix: true,
                                            locale: dateLocale
                                        })}
                                    </div>
                                )}
                                {providerMilestones.length > 0 && (
                                    <div className="mt-4 border-t pt-3">
                                        <div className="text-sm font-medium mb-2">
                                            {t('client.project_requests.milestones.title')}
                                        </div>

                                        <div className="space-y-2">
                                            {providerMilestones.map((milestone: any, index: number) => {
                                                const milestoneId = getMilestoneId(milestone);
                                                const milestoneStatus = milestoneStatusFor(milestone);
                                                const milestonePaymentStatus = milestonePaymentStatusFor(milestone);
                                                const previousStatus = normalizeStatusValue(providerMilestones[index - 1]?.status ?? '');
                                                const previousPaymentStatus = normalizeStatusValue(
                                                    providerMilestones[index - 1]?.payment_status ?? providerMilestones[index - 1]?.paymentStatus ?? ''
                                                );
                                                const isPreviousMilestonePaid =
                                                    index === 0 ||
                                                    previousStatus === 'PAID' ||
                                                    previousPaymentStatus === 'PAID';
                                                const canSecureThisMilestone =
                                                    isClientRole &&
                                                    isPendingPaymentStatus(milestone) &&
                                                    isMilestoneBudgetApproved(milestone) &&
                                                    milestoneId !== null &&
                                                    milestoneId !== undefined &&
                                                    index === securizablePendingIndex;
                                                const showDisabledSecurePaymentButton =
                                                    isClientRole &&
                                                    isPendingPaymentStatus(milestone) &&
                                                    !canSecureThisMilestone;
                                                const nextMilestoneStatus = getNextMilestoneStatus(milestoneStatus);
                                                const canAdvanceMilestoneStatus =
                                                    project.status === 'ACCEPTED' &&
                                                    milestonePaymentStatus === 'ESCROW' &&
                                                    isPreviousMilestonePaid &&
                                                    milestoneId &&
                                                    nextMilestoneStatus !== null;
                                                const isMilestoneUpdating =
                                                    milestoneId !== null &&
                                                    milestoneId !== undefined &&
                                                    updatingMilestoneId === String(milestoneId);

                                                return (
                                                    <div
                                                        key={milestoneId ?? index}
                                                        className={`flex items-center justify-between rounded-md border p-2 text-sm ${(milestoneStatus === 'PAID' || milestonePaymentStatus === 'PAID') ? 'bg-green-300' : ''}`}
                                                    >
                                                        <div className="flex items-center justify-between gap-6">
                                                            <span>{milestone.title}</span>
                                                            <span>/</span>
                                                            <span className="font-medium">
                                                                {t('client.project_requests.providers.milestone_budget')}{' '}
                                                                <PriceDisplay value={toFiniteNumber(milestone.amount) ?? 0} />
                                                            </span>
                                                        </div>
                                                        <div className="ms-2 flex items-center gap-2">
                                                            {getMilestoneStatusBadge(milestoneStatus)}
                                                            {getMilestonePaymentStatusBadge(milestonePaymentStatus)}
                                                        </div>
                                                        {canAdvanceMilestoneStatus && (
                                                            <span>
                                                                <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    onClick={() =>
                                                                        handleMarkMilestoneStatus(project.id, milestoneId, milestoneStatus)
                                                                    }
                                                                    disabled={isMilestoneUpdating}
                                                                >
                                                                    {isMilestoneUpdating ? (
                                                                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                                                    ) : null}
                                                                    {milestoneStatus === 'PENDING'
                                                                        ? t('client.project_requests.milestones.start_work')
                                                                        : milestoneStatus === 'WORK_IN_PROGRESS' || milestoneStatus === 'IN_PROGRESS'
                                                                            ? t('client.project_requests.milestones.mark_finished')
                                                                            : t('client.project_requests.milestones.finished')}
                                                                </Button>
                                                            </span>
                                                        )}
                                                        {canSecureThisMilestone && (
                                                            <span>
                                                                <RapydCheckoutButton
                                                                    project={project}
                                                                    milestone={milestone}
                                                                    countryCode="RO"
                                                                    onSuccess={() => {
                                                                        onRefresh?.();
                                                                    }}
                                                                />
                                                            </span>
                                                        )}
                                                        {showDisabledSecurePaymentButton && (
                                                            <span>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled
                                                                >
                                                                    <Shield className="w-3.5 h-3.5 mr-2" />
                                                                    {t('client.project_requests.actions.secure_payment')}
                                                                </Button>
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                        })}


                    </div>
                </div>

                {/* Project Actions */}
                <div className="flex space-x-3 mt-6 pt-4 border-t">

                    <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${project.slug}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        {t('client.project_requests.actions.view_details')}
                    </Button>
                    <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {t('client.project_requests.actions.messages')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
