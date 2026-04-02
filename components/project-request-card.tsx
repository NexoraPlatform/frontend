"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    DollarSign,
    User,
    Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ro } from 'date-fns/locale';
import { useAuth } from "@/contexts/auth-context";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { formatDeadline } from '@/lib/projects';
import { Locale } from '@/types/locale';
import { PriceDisplay } from '@/components/PriceDisplay';
import { ProjectRequestCardProviderList } from '@/components/project-request-card/_components/project-request-card-provider-list';
import { ProjectRequestCardDialogs } from '@/components/project-request-card/_components/project-request-card-dialogs';
import { useProjectRequestCardHighlight } from '@/components/project-request-card/_hooks/use-project-request-card-highlight';
import {
    buildNormalizedProviders,
    getAssignedProviderMilestones,
    getNextMilestoneStatus,
    getStatusBadge,
    getProviderProjectLines,
    normalizeOptionalText,
    normalizeStatusValue,
    toFiniteNumber,
} from '@/components/project-request-card/_lib/project-request-card-helpers';
import type {
    MilestoneProposalDialogState,
    MilestoneProposalResponseDialogState,
    ProjectRequestCardProps,
} from '@/components/project-request-card/_lib/project-request-card-types';

export function ProjectRequestCard({ project: initialProject, onResponse, onRefresh }: ProjectRequestCardProps) {
    const { user, loading } = useAuth();
    const [project, setProject] = useState(initialProject);
    const [responding, setResponding] = useState<string | null>(null);
    const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);
    const locale = useLocale() as Locale;
    const t = useTranslations();
    const dateLocale = locale?.toLowerCase().startsWith('en') ? enUS : ro;
    const [proposeNewBudgetProviderId, setProposeNewBudgetProviderId] = useState<string | null>(null);
    const [newBudget, setNewBudget] = useState<number>(0);
    const [newBudgetReason, setNewBudgetReason] = useState('');
    const [newBudgetReasonError, setNewBudgetReasonError] = useState<string | null>(null);
    const [rejectBudgetProviderId, setRejectBudgetProviderId] = useState<string | null>(null);
    const [budgetRejectionReason, setBudgetRejectionReason] = useState('');
    const [budgetRejectionError, setBudgetRejectionError] = useState<string | null>(null);
    const [milestoneProposalDialog, setMilestoneProposalDialog] = useState<MilestoneProposalDialogState | null>(null);
    const [milestoneProposalError, setMilestoneProposalError] = useState<string | null>(null);
    const [milestoneProposalResponseDialog, setMilestoneProposalResponseDialog] = useState<MilestoneProposalResponseDialogState>(null);
    const [milestoneProposalResponseReason, setMilestoneProposalResponseReason] = useState('');
    const [milestoneProposalResponseError, setMilestoneProposalResponseError] = useState<string | null>(null);
    const [submittingMilestoneProposalKey, setSubmittingMilestoneProposalKey] = useState<string | null>(null);
    const [highlightedMilestoneId, setHighlightedMilestoneId] = useState<string | null>(null);

    useEffect(() => {
        setProject(initialProject);
    }, [initialProject]);

    useProjectRequestCardHighlight(highlightedMilestoneId, () => setHighlightedMilestoneId(null));

    const applyProjectUpdate = (nextProject: any, options?: { highlightMilestoneId?: string | number | null }) => {
        if (nextProject && typeof nextProject === 'object') {
            setProject(nextProject);
        }

        if (options?.highlightMilestoneId !== null && options?.highlightMilestoneId !== undefined) {
            setHighlightedMilestoneId(String(options.highlightMilestoneId));
        }
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
            const response = await apiClient.markProjectMilestone(projectId, {
                milestone: requestMilestoneId,
                language: locale,
                currency:
                    String(
                        project?.budget?.currency ??
                        project?.currency ??
                        'USD'
                    ).toUpperCase(),
                status: nextStatus,
            });
            applyProjectUpdate(
                response && typeof response === 'object'
                    ? (response as any)?.project ?? (response as any)?.data ?? response
                    : null
            );
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
        response: 'ACCEPTED' | 'REJECTED',
        reason?: string
    ) => {
        setResponding(`${projectId}-${providerId}`);
        try {
            const responsePayload = await apiClient.respondToBudgetProposal(
                projectId,
                providerId,
                {
                    response,
                    ...(response === 'REJECTED' && reason?.trim()
                        ? { reason: reason.trim() }
                        : {}),
                    },
                locale
            );
            applyProjectUpdate(responsePayload?.project);
            toast.success(
                response === 'ACCEPTED'
                    ? t('client.project_requests.budget.approved')
                    : t('client.project_requests.budget.rejected')
            );
            await onRefresh?.();
            return true;
        } catch (error: any) {
            const message =
                error?.response?.data?.message ??
                error?.message ??
                'Unknown error';
            toast.error(t('client.project_requests.errors.generic', { message }));
            return false;
        } finally {
            setResponding(null);
        }
    };

    const handleSubmitMilestoneProposal = async () => {
        if (!milestoneProposalDialog) {
            return;
        }

        const trimmedReason = milestoneProposalDialog.reason.trim();
        if (!trimmedReason) {
            setMilestoneProposalError(t('client.project_requests.milestone_change_requests.reason_required'));
            return;
        }

        if (milestoneProposalDialog.mode === 'ADD') {
            const trimmedTitle = milestoneProposalDialog.title.trim();
            const normalizedAmount = toFiniteNumber(milestoneProposalDialog.amount);
            if (!trimmedTitle) {
                setMilestoneProposalError(t('client.project_requests.milestone_change_requests.title_required'));
                return;
            }

            if (normalizedAmount === null) {
                setMilestoneProposalError(t('client.project_requests.milestone_change_requests.amount_required'));
                return;
            }
        }

        if (milestoneProposalDialog.mode === 'UPDATE') {
            const currentSnapshot = milestoneProposalDialog.currentSnapshot ?? {};
            const trimmedTitle = milestoneProposalDialog.title.trim();
            const trimmedDescription = milestoneProposalDialog.description.trim();
            const normalizedAmount = toFiniteNumber(milestoneProposalDialog.amount);
            const currentTitle = normalizeOptionalText(currentSnapshot?.title) ?? '';
            const currentDescription = normalizeOptionalText(currentSnapshot?.description) ?? '';
            const currentAmount = toFiniteNumber(currentSnapshot?.amount);

            const hasChanged =
                trimmedTitle !== currentTitle ||
                trimmedDescription !== currentDescription ||
                normalizedAmount !== currentAmount;

            if (!milestoneProposalDialog.milestoneId) {
                setMilestoneProposalError(t('client.project_requests.milestone_change_requests.invalid_milestone'));
                return;
            }

            if (!hasChanged) {
                setMilestoneProposalError(t('client.project_requests.milestone_change_requests.no_changes'));
                return;
            }
        }

        if (milestoneProposalDialog.mode === 'DELETE' && !milestoneProposalDialog.milestoneId) {
            setMilestoneProposalError(t('client.project_requests.milestone_change_requests.invalid_milestone'));
            return;
        }

        const proposalKey = [
            project?.id ?? '',
            milestoneProposalDialog.providerId,
            milestoneProposalDialog.mode,
            milestoneProposalDialog.milestoneId ?? milestoneProposalDialog.projectLineId,
        ].join(':');

        setSubmittingMilestoneProposalKey(proposalKey);
        try {
            const responsePayload = await apiClient.submitProjectMilestoneProposals(
                project.id,
                {
                    proposals: [
                        {
                            proposal_type: milestoneProposalDialog.mode,
                            project_line_id: milestoneProposalDialog.projectLineId,
                            ...(milestoneProposalDialog.milestoneId
                                ? { project_line_milestone_id: milestoneProposalDialog.milestoneId }
                                : {}),
                            ...(milestoneProposalDialog.title.trim()
                                ? { title: milestoneProposalDialog.title.trim() }
                                : {}),
                            ...(milestoneProposalDialog.description.trim()
                                ? { description: milestoneProposalDialog.description.trim() }
                                : {}),
                            ...(toFiniteNumber(milestoneProposalDialog.amount) !== null
                                ? { amount: toFiniteNumber(milestoneProposalDialog.amount) as number }
                                : {}),
                            reason: trimmedReason,
                        },
                    ],
                },
                locale
            );

            applyProjectUpdate(responsePayload?.project);
            toast.success(t('client.project_requests.milestone_change_requests.submitted'));
            setMilestoneProposalDialog(null);
            setMilestoneProposalError(null);
            await onRefresh?.();
        } catch (error: any) {
            const message =
                error?.response?.data?.message ??
                error?.message ??
                'Unknown error';
            toast.error(t('client.project_requests.errors.generic', { message }));
        } finally {
            setSubmittingMilestoneProposalKey(null);
        }
    };

    const handleMilestoneProposalResponse = async (
        projectId: string,
        proposalId: string,
        response: 'ACCEPTED' | 'REJECTED',
        reason?: string
    ) => {
        const requestKey = `${projectId}:${proposalId}:${response}`;
        setSubmittingMilestoneProposalKey(requestKey);
        try {
            const responsePayload = await apiClient.respondToProjectMilestoneProposal(
                projectId,
                proposalId,
                {
                    response,
                    ...(response === 'REJECTED' && reason?.trim() ? { reason: reason.trim() } : {}),
                },
                locale
            );
            const appliedMilestoneId =
                (responsePayload as { applied_milestone_id?: string | number | null })
                    ?.applied_milestone_id ?? null;

            applyProjectUpdate(responsePayload?.project, {
                highlightMilestoneId:
                    response === 'ACCEPTED'
                        ? appliedMilestoneId
                        : null,
            });
            toast.success(
                response === 'ACCEPTED'
                    ? t('client.project_requests.milestone_change_requests.accepted')
                    : t('client.project_requests.milestone_change_requests.rejected')
            );
            await onRefresh?.();
            return true;
        } catch (error: any) {
            const message =
                error?.response?.data?.message ??
                error?.message ??
                'Unknown error';
            toast.error(t('client.project_requests.errors.generic', { message }));
            return false;
        } finally {
            setSubmittingMilestoneProposalKey(null);
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
    const normalizedProviders = buildNormalizedProviders({
        project,
        projectLines,
        selectedProviders,
    });

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
    const currentUserId = user?.id != null ? String(user.id) : null;
    const currentProviderMilestones = currentUserId
        ? getAssignedProviderMilestones(project, { id: currentUserId })
        : [];
    const hasCurrentProviderWorkInProgress = currentProviderMilestones.some((milestone: any) => {
        const milestoneStatus = normalizeStatusValue(milestone?.status ?? '');
        return milestoneStatus === 'WORK_IN_PROGRESS' || milestoneStatus === 'IN_PROGRESS';
    });
    const projectStatusForDisplay =
        isProviderRole && !isClientRole && hasCurrentProviderWorkInProgress
            ? 'WORK_IN_PROGRESS'
            : project.status;

    const transactionNextStep = (next_step_url: string) => {
        window.open(next_step_url, '_blank');
    };

    const activeMilestoneProposalDialogProvider = milestoneProposalDialog
        ? normalizedProviders.find(
            (entry: any) => String(entry?.id ?? '') === String(milestoneProposalDialog.providerId)
        )
        : null;
    const milestoneProposalDialogLines = activeMilestoneProposalDialogProvider
        ? getProviderProjectLines(project, activeMilestoneProposalDialogProvider)
        : [];

    return (
        <>
        <Card
            key={project.id}
            className="border-2 transition-shadow"
            data-project-card-id={String(project.id)}
            id={`project-card-${project.id}`}
        >
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-xl mb-2">
                            {project.title}
                            <span className="ms-2">{getStatusBadge(projectStatusForDisplay, t)}</span>
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
                <ProjectRequestCardProviderList
                    project={project}
                    user={user}
                    existingServices={existingServices}
                    customServices={customServices}
                    normalizedProviders={normalizedProviders}
                    projectLines={projectLines}
                    dateLocale={dateLocale}
                    t={t}
                    isClientRole={isClientRole}
                    isProviderRole={isProviderRole}
                    responding={responding}
                    updatingMilestoneId={updatingMilestoneId}
                    proposeNewBudgetProviderId={proposeNewBudgetProviderId}
                    setProposeNewBudgetProviderId={setProposeNewBudgetProviderId}
                    newBudget={newBudget}
                    setNewBudget={setNewBudget}
                    newBudgetReason={newBudgetReason}
                    setNewBudgetReason={setNewBudgetReason}
                    newBudgetReasonError={newBudgetReasonError}
                    setNewBudgetReasonError={setNewBudgetReasonError}
                    rejectBudgetProviderId={rejectBudgetProviderId}
                    setRejectBudgetProviderId={setRejectBudgetProviderId}
                    budgetRejectionReason={budgetRejectionReason}
                    setBudgetRejectionReason={setBudgetRejectionReason}
                    budgetRejectionError={budgetRejectionError}
                    setBudgetRejectionError={setBudgetRejectionError}
                    setMilestoneProposalDialog={setMilestoneProposalDialog}
                    setMilestoneProposalError={setMilestoneProposalError}
                    setMilestoneProposalResponseDialog={setMilestoneProposalResponseDialog}
                    setMilestoneProposalResponseReason={setMilestoneProposalResponseReason}
                    setMilestoneProposalResponseError={setMilestoneProposalResponseError}
                    submittingMilestoneProposalKey={submittingMilestoneProposalKey}
                    highlightedMilestoneId={highlightedMilestoneId}
                    onResponse={onResponse}
                    handleBudgetResponse={handleBudgetResponse}
                    handleMilestoneProposalResponse={handleMilestoneProposalResponse}
                    handleMarkMilestoneStatus={handleMarkMilestoneStatus}
                    onOpenUrl={transactionNextStep}
                />
            </CardContent>
        </Card>
        <ProjectRequestCardDialogs
            projectId={project.id}
            milestoneProposalDialog={milestoneProposalDialog}
            setMilestoneProposalDialog={setMilestoneProposalDialog}
            milestoneProposalError={milestoneProposalError}
            setMilestoneProposalError={setMilestoneProposalError}
            milestoneProposalDialogLines={milestoneProposalDialogLines}
            onSubmitMilestoneProposal={() => {
                void handleSubmitMilestoneProposal();
            }}
            submittingMilestoneProposalKey={submittingMilestoneProposalKey}
            milestoneProposalResponseDialog={milestoneProposalResponseDialog}
            setMilestoneProposalResponseDialog={setMilestoneProposalResponseDialog}
            milestoneProposalResponseReason={milestoneProposalResponseReason}
            setMilestoneProposalResponseReason={setMilestoneProposalResponseReason}
            milestoneProposalResponseError={milestoneProposalResponseError}
            setMilestoneProposalResponseError={setMilestoneProposalResponseError}
            onRejectMilestoneProposalResponse={(reason) => {
                if (!milestoneProposalResponseDialog) {
                    return Promise.resolve(false);
                }

                return handleMilestoneProposalResponse(
                    milestoneProposalResponseDialog.projectId,
                    milestoneProposalResponseDialog.proposalId,
                    'REJECTED',
                    reason
                );
            }}
            t={t}
        />
        </>
    );
}
