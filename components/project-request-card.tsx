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
    Banknote
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

interface ProjectRequestCardProps {
    project: any;
    onResponse: (projectId: string, response: 'ACCEPTED' | 'REJECTED' | 'NEW_PROPOSE', proposedBudget?: number) => void;
    onRefresh?: () => void;
}

export function ProjectRequestCard({ project, onResponse, onRefresh }: ProjectRequestCardProps) {
    const { user, loading } = useAuth();
    const [responding, setResponding] = useState<string | null>(null);
    const router = useRouter();
    const locale = useLocale() as Locale;
    const t = useTranslations();
    const dateLocale = locale?.toLowerCase().startsWith('en') ? enUS : ro;
    const [proposeNewBudgetProviderId, setProposeNewBudgetProviderId] = useState<string | null>(null);
    const [newBudget, setNewBudget] = useState<number>(0);



    const handleMarkMilestoneAsComplete = async (projectId: number | string, milestone: number | string) => {
        try {
            await apiClient.markMilestoneAsComplete(projectId, milestone, locale);
            await onRefresh?.();
        } catch (error: any) {
            toast.error(t('client.project_requests.errors.generic', { message: error?.message ?? 'Unknown error' }));
        }
    }

    const handleBudgetResponse = async (
        projectId: string,
        providerId: string,
        response: 'ACCEPTED' | 'REJECTED'
    ) => {
        setResponding(`${projectId}-${providerId}`);
        try {
            await apiClient.respondToBudgetProposal(projectId, providerId, { response }, locale);
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
        switch (status) {
            case 'PENDING':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.pending')}
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
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getMilestonePaymentStatusBadge = (status: string) => {
        switch (status) {
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
                return <Badge variant="secondary">{status}</Badge>;
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

    const servicesMap = new Map(
        (project?.existing_services ?? []).map((s: any) => [s.id, s])
    );

    const getMilestoneId = (milestone: any) => {
        return milestone?.id ?? milestone?.milestone_id ?? milestone?.milestoneId ?? null;
    };

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
                    service_id: milestone?.service_id ?? line?.service_id,
                    service_name: milestone?.service_name ?? line?.service_name,
                }))
            )
            : [];
        if (lineMilestones.length > 0) {
            return lineMilestones;
        }

        return Array.isArray(projectData?.milestones)
            ? projectData.milestones.flatMap((milestoneGroup: any) =>
                Array.isArray(milestoneGroup?.milestones) ? milestoneGroup.milestones : []
            )
            : [];
    };

    const getProviderMilestones = (projectData: any, providerData: any) => {
        const legacyProviderMilestones = projectData?.milestones
            ?.find((entry: any) => String(entry?.providerId) === String(providerData?.id))
            ?.milestones;
        if (Array.isArray(legacyProviderMilestones) && legacyProviderMilestones.length > 0) {
            return legacyProviderMilestones;
        }

        const allMilestones = getProjectMilestones(projectData);
        if (allMilestones.length === 0) {
            return [];
        }

        const providerServices = Array.isArray(providerData?.services) ? providerData.services : [];
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
            return allMilestones;
        }

        const projectLines = Array.isArray(projectData?.project_lines) ? projectData.project_lines : [];
        const filtered = allMilestones.filter((milestone: any) => {
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

            const line = projectLines.find((entry: any) => String(entry?.id) === String(lineId));
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

        return filtered.length > 0 ? filtered : allMilestones;
    };

    const projectBudgetAmount = (() => {
        if (project?.budget && typeof project.budget === 'object') {
            const amount = Number((project.budget as { amount?: unknown }).amount);
            return Number.isFinite(amount) ? amount : null;
        }

        const numeric = Number(project?.budget);
        return Number.isFinite(numeric) ? numeric : null;
    })();

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
                                    {formatDistanceToNow(new Date(project.created_at), {
                                        addSuffix: true,
                                        locale: dateLocale
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{t('client.project_requests.project.selected_providers', { count: project.providers?.length || 0 })}</span>
                            </div>
                        </div>
                    </div>
                    {Array.from(servicesMap).map((category: any, index: number) => (
                        <Badge key={index} className="bg-emerald-100 text-emerald-800 inline-flex whitespace-nowrap me-1">
                            {category.name}
                        </Badge>
                    ))}

                </div>
            </CardHeader>

            <CardContent>
                {/* Technologies */}
                {(project?.existing_services?.length > 0
                    || project?.custom_services?.length > 0) && (
                        <div className="mb-4">
                            <div className="text-sm font-medium mb-2">{t('client.project_requests.project.technologies')}:</div>
                            <div className="flex flex-wrap gap-1">
                                {project.existing_services.map((tech: any, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {tech.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                {/* Providers List */}
                <div>
                    <div className="text-sm font-medium mb-3">{t('client.project_requests.providers.title')}:</div>
                    <div className="space-y-3">
                        {project.providers?.map((provider: any) => {
                            const providerMilestones = getProviderMilestones(project, provider);
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
                                        {getStatusBadge(provider.status)}
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {t('client.project_requests.providers.allocated')}{' '}
                                            {provider.allocatedBudget != null ? (
                                                <PriceDisplay value={provider.allocatedBudget} />
                                            ) : (
                                                '-'
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {(provider.provider_response === 'PENDING') && (
                                    <Dialog
                                        open={proposeNewBudgetProviderId === provider.id}
                                        onOpenChange={(isOpen) => setProposeNewBudgetProviderId(isOpen ? provider.id : null)}
                                    >
                                        <DialogTrigger asChild>
                                            <Button variant="outline">{t('client.project_requests.budget.new_proposal')}</Button>
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
                                                    {provider.allocatedBudget != null ? (
                                                        <PriceDisplay value={provider.allocatedBudget} />
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
                                                        onResponse(project.id, 'NEW_PROPOSE', newBudget);
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
                                {(provider.provider_response === 'PENDING') && (
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
                                                        {provider.allocatedBudget != null ? (
                                                            <PriceDisplay value={provider.allocatedBudget} />
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleBudgetResponse(project.id, provider.id, 'ACCEPTED')}
                                                        disabled={responding === `${project.id}-${provider.id}` || provider.provider_response !== 'PENDING'}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        {t('client.project_requests.budget.approve')}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setProposeNewBudgetProviderId(provider.id)}
                                                        disabled={responding === `${project.id}-${provider.id}` || provider.provider_response !== 'PENDING'}
                                                    >
                                                        <Banknote className="w-4 h-4 mr-1" />
                                                        {t('client.project_requests.budget.propose_new')}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleBudgetResponse(project.id, provider.id, 'REJECTED')}
                                                        disabled={responding === `${project.id}-${provider.id}`}
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
                                {provider.respondedAt && (
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
                                                const milestoneStatus = String(milestone?.status ?? '').toUpperCase();
                                                const milestonePaymentStatus = String(milestone?.payment_status ?? milestone?.paymentStatus ?? 'PENDING').toUpperCase();
                                                const previousStatus = String(providerMilestones[index - 1]?.status ?? '').toUpperCase();
                                                const previousPaymentStatus = String(providerMilestones[index - 1]?.payment_status ?? providerMilestones[index - 1]?.paymentStatus ?? '').toUpperCase();
                                                const isPreviousMilestonePaid =
                                                    index === 0 ||
                                                    previousStatus === 'PAID' ||
                                                    previousPaymentStatus === 'PAID';

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
                                                                <PriceDisplay value={milestone.amount} />
                                                            </span>
                                                        </div>
                                                        <span className="ms-2">{getMilestonePaymentStatusBadge(milestonePaymentStatus)}</span>
                                                        {project.status === 'ACCEPTED' && milestonePaymentStatus === 'ESCROW' && isPreviousMilestonePaid && milestoneId && (
                                                            <span>
                                                                <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    onClick={() => handleMarkMilestoneAsComplete(project.id, milestoneId)}
                                                                    disabled={milestoneStatus !== 'PENDING'}
                                                                >
                                                                    {milestoneStatus === 'PENDING'
                                                                        ? t('client.project_requests.milestones.mark_complete')
                                                                        : milestoneStatus === 'PAID'
                                                                            ? t('client.project_requests.milestones.paid')
                                                                            : milestoneStatus === 'REJECTED'
                                                                                ? t('client.project_requests.milestones.rejected')
                                                                                : t('client.project_requests.milestones.pending')}
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
