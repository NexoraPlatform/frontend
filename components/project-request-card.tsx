"use client";

import React, { useEffect, useState } from 'react';
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
    Shield,
    Plus,
    Pencil,
    Trash2
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
    DialogTitle,
    DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { useRouter } from '@/lib/navigation';
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { formatDeadline } from '@/lib/projects';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Locale } from '@/types/locale';
import { PriceDisplay } from '@/components/PriceDisplay';
import {
    getProjectLineForMilestone,
    getProjectMilestoneChangeRequestsForMilestone,
    getProjectMilestoneChangeRequestsForProvider,
} from '@/lib/milestone-change-requests';

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
const normalizeOptionalText = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

type MilestoneProposalDialogState = {
    mode: 'ADD' | 'UPDATE' | 'DELETE';
    providerId: string;
    projectLineId: string;
    milestoneId: string | null;
    title: string;
    description: string;
    amount: string;
    reason: string;
    serviceName: string;
    milestoneTitle: string;
    currentSnapshot: any | null;
};

const createMilestoneProposalDialogState = (
    config: Partial<MilestoneProposalDialogState> & Pick<MilestoneProposalDialogState, 'mode' | 'providerId' | 'projectLineId'>
): MilestoneProposalDialogState => ({
    mode: config.mode,
    providerId: config.providerId,
    projectLineId: config.projectLineId,
    milestoneId: config.milestoneId ?? null,
    title: config.title ?? '',
    description: config.description ?? '',
    amount: config.amount ?? '',
    reason: config.reason ?? '',
    serviceName: config.serviceName ?? '',
    milestoneTitle: config.milestoneTitle ?? '',
    currentSnapshot: config.currentSnapshot ?? null,
});

export function ProjectRequestCard({ project: initialProject, onResponse, onRefresh }: ProjectRequestCardProps) {
    const { user, loading } = useAuth();
    const [project, setProject] = useState(initialProject);
    const [responding, setResponding] = useState<string | null>(null);
    const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);
    const router = useRouter();
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
    const [milestoneProposalResponseDialog, setMilestoneProposalResponseDialog] = useState<{
        proposalId: string;
        projectId: string;
        proposalType: string;
    } | null>(null);
    const [milestoneProposalResponseReason, setMilestoneProposalResponseReason] = useState('');
    const [milestoneProposalResponseError, setMilestoneProposalResponseError] = useState<string | null>(null);
    const [submittingMilestoneProposalKey, setSubmittingMilestoneProposalKey] = useState<string | null>(null);
    const [highlightedMilestoneId, setHighlightedMilestoneId] = useState<string | null>(null);

    useEffect(() => {
        setProject(initialProject);
    }, [initialProject]);

    useEffect(() => {
        if (!highlightedMilestoneId) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setHighlightedMilestoneId(null);
        }, 5000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [highlightedMilestoneId]);



    const getNextMilestoneStatus = (status: string): 'work_in_progress' | 'finished' | null => {
        const normalized = normalizeStatusValue(status);
        if (normalized === 'PENDING' || normalized === 'ESCROW' || normalized === 'BLOCKED') return 'work_in_progress';
        if (normalized === 'WORK_IN_PROGRESS' || normalized === 'IN_PROGRESS') return 'finished';
        return null;
    };

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

    const getBudgetStatusBadge = (status: string) => {
        const normalizedStatus = normalizeStatusValue(status);
        switch (normalizedStatus) {
            case 'PENDING':
                return <Badge className="bg-yellow-100 text-yellow-800">Budget pending</Badge>;
            case 'PROPOSED':
                return <Badge className="bg-blue-100 text-blue-800">Budget proposed</Badge>;
            case 'ACCEPTED':
                return <Badge className="bg-green-100 text-green-800">Budget accepted</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-100 text-red-800">Budget rejected</Badge>;
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
            case 'BLOCKED':
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

    const isMilestonePaymentSecuredStatus = (status: string) => {
        const normalized = normalizeStatusValue(status);
        if (!normalized) return false;
        return (
            normalized === 'ESCROW' ||
            normalized.includes('ESCROW') ||
            normalized === 'BLOCKED' ||
            normalized.includes('BLOCK') ||
            normalized === 'PAID' ||
            normalized === 'RELEASED' ||
            normalized.includes('RELEASE')
        );
    };

    const isMilestonePaymentSettledStatus = (status: string) => {
        const normalized = normalizeStatusValue(status);
        return (
            normalized === 'PAID' ||
            normalized === 'RELEASED'
        );
    };

    const isPendingMilestonePaymentStatus = (status: string) => {
        const normalized = normalizeStatusValue(status);
        if (!normalized) return true;
        if (normalized === 'PENDING') return true;

        if (normalized.startsWith('PENDING')) {
            return (
                !normalized.includes('ESCROW') &&
                !normalized.includes('BLOCK') &&
                !normalized.includes('PAID') &&
                !normalized.includes('RELEASE')
            );
        }

        return false;
    };

    const hasMilestoneEscrowOrPaymentReference = (entry: any) => {
        const escrowReference =
            entry?.escrow_id ??
            entry?.escrowId ??
            entry?.escrow_reference ??
            entry?.escrowReference ??
            null;
        const paymentReference =
            entry?.payment_id ??
            entry?.paymentId ??
            entry?.rapyd_payment_id ??
            entry?.rapydPaymentId ??
            null;

        return Boolean(escrowReference || paymentReference);
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
        const rawName = String(providerRaw?.name ?? selectedProvider?.name ?? '').trim();
        const [nameFirstPart = '', ...nameRestParts] = rawName ? rawName.split(/\s+/) : [];
        const inferredFirstName = nameFirstPart;
        const inferredLastName = nameRestParts.join(' ');
        const projectStatus = normalizeStatusValue(project?.status ?? '');
        const inferredProviderResponse =
            projectStatus === 'PENDING'
                ? 'PENDING'
                : projectStatus
                    ? 'ACCEPTED'
                    : '';
        const providerResponse = normalizeStatusValue(
            providerRaw?.provider_response ??
            providerRaw?.pivotResponse ??
            providerRaw?.pivot?.provider_response ??
            selectedProvider?.provider_response ??
            selectedProvider?.pivot?.provider_response
        ) || inferredProviderResponse;
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
            firstName:
                providerRaw?.firstName ??
                providerRaw?.first_name ??
                selectedProvider?.firstName ??
                inferredFirstName ??
                'Provider',
            lastName:
                providerRaw?.lastName ??
                providerRaw?.last_name ??
                selectedProvider?.lastName ??
                inferredLastName ??
                (inferredFirstName ? '' : `#${providerId}`),
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
            allocatedBudget,
            proposedBudget,
            providerBudgetProposalReason:
                normalizeOptionalText(
                    providerRaw?.providerBudgetProposalReason ??
                    providerRaw?.provider_budget_proposal_reason ??
                    providerRaw?.proposalReason ??
                    providerRaw?.pivot?.provider_budget_proposal_reason ??
                    providerRaw?.pivot?.proposalReason
                ) ?? null,
            clientBudgetRejectionReason:
                normalizeOptionalText(
                    providerRaw?.clientBudgetRejectionReason ??
                    providerRaw?.client_budget_rejection_reason ??
                    providerRaw?.rejectionReason ??
                    providerRaw?.pivot?.client_budget_rejection_reason ??
                    providerRaw?.pivot?.rejectionReason
                ) ?? null,
            respondedAt:
                providerRaw?.respondedAt ??
                providerRaw?.responded_at ??
                providerRaw?.pivot?.updated_at ??
                selectedProvider?.pivot?.updated_at ??
                null,
        };
    };

    const projectLineMilestonesForProviders = Array.isArray(project?.project_line_milestones)
        ? project.project_line_milestones
        : projectLines.flatMap((line: any) =>
            (Array.isArray(line?.milestones) ? line.milestones : []).map((milestone: any) => ({
                ...milestone,
                project_line_id: milestone?.project_line_id ?? milestone?.projectLineId ?? line?.id,
                service_id: milestone?.service_id ?? milestone?.serviceId ?? line?.service_id,
                service_name: milestone?.service_name ?? milestone?.serviceName ?? line?.service_name,
            }))
        );
    const providersFromProjectLines = projectLines.flatMap((line: any) =>
        Array.isArray(line?.providers) ? line.providers : []
    );
    const providersFromMilestones = projectLineMilestonesForProviders
        .map((milestone: any) => {
            const assignedProvider = (milestone?.assigned_provider && typeof milestone.assigned_provider === 'object')
                ? milestone.assigned_provider
                : null;
            const assignedProviderId =
                resolveProviderId(assignedProvider) ??
                (milestone?.assigned_provider_id != null ? String(milestone.assigned_provider_id) : null) ??
                (milestone?.assignedProviderId != null ? String(milestone.assignedProviderId) : null) ??
                (milestone?.provider_id != null ? String(milestone.provider_id) : null) ??
                (milestone?.providerId != null ? String(milestone.providerId) : null);
            if (!assignedProviderId) return null;

            if (assignedProvider) {
                return {
                    ...assignedProvider,
                    id: assignedProviderId,
                };
            }

            return {
                id: assignedProviderId,
                provider_response: normalizeStatusValue(project?.status ?? '') === 'PENDING' ? 'PENDING' : 'ACCEPTED',
            };
        })
        .filter((provider: any) => Boolean(provider));
    const providersListRawMap = new Map<string, any>();
    const registerProviderCandidate = (providerCandidate: any) => {
        const providerId = resolveProviderId(providerCandidate);
        if (!providerId) return;
        const existing = providersListRawMap.get(providerId) ?? { id: providerId };
        providersListRawMap.set(providerId, {
            ...existing,
            ...providerCandidate,
            id: providerId,
        });
    };
    [
        ...providersFromMilestones,
        ...providersFromProjectLines,
        ...(Array.isArray(project?.providers) ? project.providers : []),
        ...selectedProviders,
    ].forEach(registerProviderCandidate);
    const providersListRaw = Array.from(providersListRawMap.values());
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
        return [];
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

        const mergedPrimaryMilestones = [
            ...explicitlyAssignedMilestones,
            ...unassignedMilestonesFromProviderLines,
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

    const getAssignedProviderMilestones = (projectData: any, providerData: any) => {
        const providerId = resolveProviderId(providerData);
        if (!providerId) return [];

        const toSortableNumber = (value: unknown) => {
            if (value === null || value === undefined || value === '') {
                return Number.MAX_SAFE_INTEGER;
            }
            const numeric = Number(value);
            return Number.isFinite(numeric) ? numeric : Number.MAX_SAFE_INTEGER;
        };

        const allMilestones = getProjectMilestones(projectData);
        const providerMilestones = allMilestones.filter((milestone: any) => {
            const assignedProviderId =
                milestone?.assigned_provider_id ??
                milestone?.assignedProviderId ??
                milestone?.provider_id ??
                milestone?.providerId ??
                null;
            return assignedProviderId !== null && assignedProviderId !== undefined && String(assignedProviderId) === providerId;
        });

        const seenIds = new Set<string>();
        return [...providerMilestones]
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
                if (seenIds.has(key)) return false;
                seenIds.add(key);
                return true;
            });
    };

    const getProviderProjectLines = (projectData: any, providerData: any) => {
        const providerId = resolveProviderId(providerData);
        if (!providerId) {
            return [];
        }

        const projectLinesForProvider = Array.isArray(projectData?.project_lines)
            ? projectData.project_lines
            : [];

        return projectLinesForProvider.filter((line: any) => {
            const lineProviders = Array.isArray(line?.providers) ? line.providers : [];
            const hasDirectProviderMatch = lineProviders.some(
                (lineProvider: any) => resolveProviderId(lineProvider) === providerId
            );
            if (hasDirectProviderMatch) {
                return true;
            }

            const lineMilestones = Array.isArray(line?.milestones) ? line.milestones : [];
            return lineMilestones.some((lineMilestone: any) => {
                const assignedProviderId =
                    lineMilestone?.assigned_provider_id ??
                    lineMilestone?.assignedProviderId ??
                    lineMilestone?.provider_id ??
                    lineMilestone?.providerId ??
                    null;
                return assignedProviderId !== null && String(assignedProviderId) === providerId;
            });
        });
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

    const transactionNextStep = ((next_step_url: string) => {
        window.open(next_step_url, '_blank');
    });

    const renderEscrowStatusControl = (
        statusValue: unknown,
        nextStepUrl: string | null | undefined,
        audience: 'provider' | 'client'
    ) => {
        const status = normalizeStatusValue(statusValue);
        if (!status) {
            return null;
        }

        const badgeClassName =
            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium";

        const renderBadge = (label: string, className: string) => (
            <Badge className={`${badgeClassName} ${className}`}>{label}</Badge>
        );

        switch (status) {
            case 'PENDING':
                if (nextStepUrl) {
                    return (
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            onClick={() => transactionNextStep(nextStepUrl)}
                        >
                            {t('client.project_requests.escrow.approve')}
                        </Button>
                    );
                }
                return renderBadge(
                    t('client.project_requests.escrow.approve'),
                    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                );
            case 'AWAITING_PAYMENT':
                if (audience === 'client' && nextStepUrl) {
                    return (
                        <Button
                            size="sm"
                            className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
                            onClick={() => transactionNextStep(nextStepUrl)}
                        >
                            {t('client.project_requests.escrow.pay')}
                        </Button>
                    );
                }
                return renderBadge(
                    t('client.project_requests.escrow.awaiting_payment'),
                    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                );
            case 'FUNDED':
                return renderBadge(
                    t('client.project_requests.escrow.funded'),
                    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                );
            case 'ACTION_REQUIRED':
                if (nextStepUrl) {
                    return (
                        <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                            onClick={() => transactionNextStep(nextStepUrl)}
                        >
                            {t('client.project_requests.escrow.action_required')}
                        </Button>
                    );
                }
                return renderBadge(
                    t('client.project_requests.escrow.action_required'),
                    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200'
                );
            case 'DELIVERED':
                return renderBadge(
                    t('client.project_requests.escrow.delivered'),
                    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200'
                );
            case 'REJECTED':
                return renderBadge(
                    t('client.project_requests.escrow.rejected'),
                    'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
                );
            case 'REVISION_REQUIRED':
                return renderBadge(
                    t('client.project_requests.escrow.revision_required'),
                    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200'
                );
            case 'APPROVED':
                return renderBadge(
                    t('client.project_requests.escrow.approved'),
                    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                );
            case 'IN_PROGRESS':
                return renderBadge(
                    t('client.project_requests.escrow.in_progress'),
                    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200'
                );
            case 'CANCELLED':
                return renderBadge(
                    t('client.project_requests.escrow.cancelled'),
                    'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-200'
                );
            case 'COMPLETED':
                return renderBadge(
                    t('client.project_requests.escrow.completed'),
                    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                );
            default:
                return null;
        }
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
                            <span className="ms-2">{getStatusBadge(projectStatusForDisplay)}</span>
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
                            const collectIdentityValues = (source: any): string[] => {
                                if (!source || typeof source !== 'object') return [];
                                const rawValues = [
                                    source?.id,
                                    source?.user_id,
                                    source?.userId,
                                    source?.provider_id,
                                    source?.providerId,
                                    source?.profile_id,
                                    source?.profileId,
                                    source?.pivot?.provider_id,
                                    source?.pivot?.providerId,
                                    source?.pivot?.user_id,
                                    source?.pivot?.userId,
                                    source?.profile?.id,
                                    source?.profile?.user_id,
                                    source?.profile?.userId,
                                ];

                                return Array.from(
                                    new Set(
                                        rawValues
                                            .filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
                                            .map((value) => String(value))
                                    )
                                );
                            };
                            const providerIdentityValues = collectIdentityValues(provider);
                            const currentUserIdentityValues = collectIdentityValues(user);
                            const isCurrentUserProvider =
                                providerIdentityValues.some((value) => currentUserIdentityValues.includes(value)) ||
                                (isProviderRole && !isClientRole && normalizedProviders.length === 1);
                            const providerMilestones =
                                isProviderRole && !isClientRole && isCurrentUserProvider
                                    ? getAssignedProviderMilestones(project, provider)
                                    : getProviderMilestones(project, provider);
                            const providerMilestonesTotal = providerMilestones.reduce((sum: number, milestone: any) => {
                                return sum + (toFiniteNumber(milestone?.amount) ?? 0);
                            }, 0);
                            const providerBudgetBase =
                                provider.allocatedBudget != null
                                    ? provider.allocatedBudget
                                    : providerMilestonesTotal > 0
                                        ? providerMilestonesTotal
                                        : null;
                            const providerMilestonesProposedTotal = providerMilestones.reduce((sum: number, milestone: any) => {
                                const proposedAmount = normalizePositiveBudget(
                                    milestone?.proposed_amount ??
                                    milestone?.proposedAmount
                                );
                                if (proposedAmount === null) return sum;
                                return sum + proposedAmount;
                            }, 0);
                            const providerProposedBudget =
                                provider.proposedBudget != null
                                    ? provider.proposedBudget
                                    : providerMilestonesProposedTotal > 0
                                        ? providerMilestonesProposedTotal
                                        : null;
                            const providerBudgetProposalReason = normalizeOptionalText(
                                provider?.providerBudgetProposalReason ??
                                provider?.provider_budget_proposal_reason ??
                                provider?.proposalReason ??
                                provider?.pivot?.provider_budget_proposal_reason ??
                                provider?.pivot?.proposalReason
                            );
                            const clientBudgetRejectionReason = normalizeOptionalText(
                                provider?.clientBudgetRejectionReason ??
                                provider?.client_budget_rejection_reason ??
                                provider?.rejectionReason ??
                                provider?.pivot?.client_budget_rejection_reason ??
                                provider?.pivot?.rejectionReason
                            );
                            const milestoneBudgetStatusFor = (entry: any) =>
                                normalizeStatusValue(entry?.budget_status ?? entry?.budgetStatus ?? '');
                            const providerMilestoneBudgetStatuses = providerMilestones
                                .map((entry: any) => milestoneBudgetStatusFor(entry))
                                .filter(Boolean);
                            const providerLineBudgetStatuses = projectLines
                                .filter((line: any) => {
                                    const lineProviders = Array.isArray(line?.providers) ? line.providers : [];
                                    const hasDirectProviderMatch = lineProviders.some(
                                        (lineProvider: any) => resolveProviderId(lineProvider) === String(provider.id)
                                    );
                                    if (hasDirectProviderMatch) return true;

                                    const lineMilestones = Array.isArray(line?.milestones) ? line.milestones : [];
                                    return lineMilestones.some((lineMilestone: any) => {
                                        const assignedProviderId =
                                            lineMilestone?.assigned_provider_id ??
                                            lineMilestone?.assignedProviderId ??
                                            lineMilestone?.provider_id ??
                                            lineMilestone?.providerId ??
                                            null;
                                        return assignedProviderId !== null && String(assignedProviderId) === String(provider.id);
                                    });
                                })
                                .map((line: any) => normalizeStatusValue(line?.budget_status ?? line?.budgetStatus ?? ''))
                                .filter(Boolean);
                            const providerBudgetStatus = (() => {
                                if (providerMilestoneBudgetStatuses.includes('PROPOSED')) return 'PROPOSED';
                                if (providerMilestoneBudgetStatuses.includes('REJECTED')) return 'REJECTED';
                                if (
                                    providerMilestoneBudgetStatuses.length > 0 &&
                                    providerMilestoneBudgetStatuses.every((status: string) => status === 'ACCEPTED')
                                ) {
                                    return 'ACCEPTED';
                                }
                                if (providerLineBudgetStatuses.includes('PROPOSED')) return 'PROPOSED';
                                if (providerLineBudgetStatuses.includes('REJECTED')) return 'REJECTED';
                                if (
                                    providerLineBudgetStatuses.length > 0 &&
                                    providerLineBudgetStatuses.every((status: string) => status === 'ACCEPTED')
                                ) {
                                    return 'ACCEPTED';
                                }
                                const explicitProviderBudgetStatus = normalizeStatusValue(
                                    provider?.budget_status ?? provider?.budgetStatus ?? ''
                                );
                                return explicitProviderBudgetStatus || 'PENDING';
                            })();
                            const providerResponseStatus = normalizeStatusValue(
                                provider?.provider_response ??
                                provider?.providerResponse ??
                                provider?.status ??
                                project?.status ??
                                ''
                            );
                            const providerEscrowTransaction = Array.isArray(project?.escrow_transactions)
                                ? project.escrow_transactions.find((transaction: any) => {
                                    const transactionProviderId =
                                        transaction?.provider_id ??
                                        transaction?.providerId ??
                                        null;

                                    return (
                                        transactionProviderId !== null &&
                                        transactionProviderId !== undefined &&
                                        String(transactionProviderId) === String(provider.id)
                                    );
                                }) ?? null
                                : null;
                            const providerTransactionNextStep =
                                providerEscrowTransaction?.provider_next_step ??
                                providerEscrowTransaction?.providerNextStep ??
                                null;
                            const clientEscrowStatus = normalizeStatusValue(
                                providerEscrowTransaction?.client_transaction_status ??
                                providerEscrowTransaction?.clientTransactionStatus ??
                                ''
                            );
                            const clientEscrowTransactionId = normalizeOptionalText(
                                providerEscrowTransaction?.escrow_transaction_id ??
                                providerEscrowTransaction?.escrowTransactionId
                            );
                            const clientEscrowPaymentUrl = clientEscrowTransactionId
                                ? `https://www.escrow-sandbox.com/transactions/${clientEscrowTransactionId}/payment`
                                : null;
                            const providerEscrowStatus = normalizeStatusValue(
                                providerEscrowTransaction?.provider_transaction_status ??
                                providerEscrowTransaction?.providerTransactionStatus ??
                                ''
                            );
                            const isProjectFullyApprovedForProvider =
                                providerResponseStatus === 'ACCEPTED' &&
                                providerBudgetStatus === 'ACCEPTED';
                            const canClientManageBudgetProposal =
                                isClientRole && providerBudgetStatus === 'PROPOSED';
                            const canProviderRespondToProject =
                                isProviderRole &&
                                isCurrentUserProvider &&
                                (providerBudgetStatus === 'PENDING' || providerBudgetStatus === 'REJECTED');
                            const canProviderManageMilestoneChanges =
                                isProviderRole &&
                                isCurrentUserProvider &&
                                !isProjectFullyApprovedForProvider;
                            const canClientRespondToMilestoneChanges = isClientRole;
                            const providerProjectLines = getProviderProjectLines(project, provider);
                            const providerMilestoneChangeRequests = getProjectMilestoneChangeRequestsForProvider(
                                project,
                                provider?.id
                            );
                            const standaloneMilestoneChangeRequests = providerMilestoneChangeRequests.filter(
                                (proposal) =>
                                    (proposal?.project_line_milestone_id === null ||
                                        proposal?.project_line_milestone_id === undefined) &&
                                    (proposal?.current_snapshot?.id === null ||
                                        proposal?.current_snapshot?.id === undefined)
                            );
                            const milestoneStatusFor = (entry: any) => normalizeStatusValue(entry?.status ?? '');
                            const milestonePaymentStatusFor = (entry: any) => {
                                const explicitStatus = normalizeStatusValue(
                                    entry?.payment_status ??
                                    entry?.paymentStatus ??
                                    ''
                                );
                                if (explicitStatus) return explicitStatus;

                                const fallbackStatus = normalizeStatusValue(entry?.status ?? '');
                                if (!fallbackStatus) return 'PENDING';
                                if (fallbackStatus === 'REJECTED') return 'REJECTED';
                                if (isMilestonePaymentSecuredStatus(fallbackStatus)) return fallbackStatus;
                                if (isPendingMilestonePaymentStatus(fallbackStatus)) return fallbackStatus;
                                return 'PENDING';
                            };
                            const isPendingPaymentStatus = (entry: any) =>
                                isPendingMilestonePaymentStatus(milestonePaymentStatusFor(entry)) &&
                                !isMilestonePaymentSecuredStatus(milestonePaymentStatusFor(entry)) &&
                                !isMilestonePaymentSettledStatus(milestoneStatusFor(entry)) &&
                                !hasMilestoneEscrowOrPaymentReference(entry);
                            const isMilestoneBudgetApproved = (entry: any) => {
                                const milestoneBudgetStatus = milestoneBudgetStatusFor(entry);
                                if (milestoneBudgetStatus) {
                                    return milestoneBudgetStatus === 'ACCEPTED';
                                }
                                return providerBudgetStatus === 'ACCEPTED';
                            };
                            const providerDisplayStatus = providerBudgetStatus;
                            const isMilestoneBeyondEscrowPhase = (entry: any) => {
                                const status = milestoneStatusFor(entry);
                                return (
                                    status === 'WORK_IN_PROGRESS' ||
                                    status === 'IN_PROGRESS' ||
                                    status === 'FINISHED' ||
                                    status === 'COMPLETED' ||
                                    status === 'PAID'
                                );
                            };
                            const isMilestonePaidStatus = (entry: any) => {
                                const status = milestoneStatusFor(entry);
                                return status === 'PAID';
                            };
                            const firstPendingIndex = providerMilestones.findIndex((milestone: any) => {
                                const status = milestoneStatusFor(milestone);
                                const isStatusEligibleForSecurePayment = status === 'PENDING';
                                return (
                                    isStatusEligibleForSecurePayment &&
                                    isPendingPaymentStatus(milestone) &&
                                    isMilestoneBudgetApproved(milestone)
                                );
                            }
                            );
                            const previousPendingMilestone =
                                firstPendingIndex > 0 ? providerMilestones[firstPendingIndex - 1] : null;
                            const canAdvanceToNextPendingMilestone =
                                firstPendingIndex === 0 ||
                                (previousPendingMilestone != null && isMilestonePaidStatus(previousPendingMilestone));
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
                                        {getBudgetStatusBadge(providerDisplayStatus)}
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {t('client.project_requests.providers.allocated')}{' '}
                                            {providerBudgetBase != null ? (
                                                <>
                                                    <PriceDisplay value={providerBudgetBase} />
                                                    {providerEscrowStatus ? (
                                                        <div className="mt-2 flex justify-end">
                                                            {renderEscrowStatusControl(
                                                                providerEscrowStatus,
                                                                providerTransactionNextStep,
                                                                'provider'
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </>
                                            ) : (
                                                '-'
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {canProviderRespondToProject && (
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        {providerBudgetStatus === 'PENDING' ? (
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    onResponse(String(project.id), { response: 'ACCEPTED' })
                                                }
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                {t('client.project_requests.budget.approve')}
                                            </Button>
                                        ) : null}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                        onClick={() => {
                                            setNewBudget(providerBudgetBase ?? 0);
                                            setNewBudgetReason('');
                                            setNewBudgetReasonError(null);
                                            setProposeNewBudgetProviderId(provider.id);
                                        }}
                                    >
                                        <Banknote className="w-4 h-4 mr-1" />
                                            {providerBudgetStatus === 'REJECTED'
                                                ? t('client.project_requests.budget.propose_new')
                                                : t('client.project_requests.budget.propose_new')}
                                        </Button>
                                        {providerBudgetStatus === 'PENDING' ? (
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
                                        ) : null}
                                    </div>
                                )}

                                {canProviderRespondToProject && (
                                    <Dialog
                                        open={proposeNewBudgetProviderId === provider.id}
                                        onOpenChange={(isOpen) => {
                                            if (isOpen) {
                                                setNewBudget(providerBudgetBase ?? 0);
                                                setNewBudgetReason('');
                                                setNewBudgetReasonError(null);
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
                                                <div className="mt-3">
                                                    <div className="mb-2 text-sm font-medium">
                                                        {t('client.project_requests.budget.reason_label')}
                                                    </div>
                                                    <Textarea
                                                        value={newBudgetReason}
                                                        onChange={(event) => {
                                                            setNewBudgetReason(event.target.value);
                                                            if (newBudgetReasonError) {
                                                                setNewBudgetReasonError(null);
                                                            }
                                                        }}
                                                        placeholder={t('client.project_requests.budget.reason_placeholder_new_proposal')}
                                                        rows={4}
                                                    />
                                                    {newBudgetReasonError ? (
                                                        <p className="mt-2 text-sm text-red-600 dark:text-red-300">
                                                            {newBudgetReasonError}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline">{t('client.project_requests.budget.cancel')}</Button>
                                                </DialogClose>
                                                <Button
                                                    variant="default"
                                                    onClick={() => {
                                                        const trimmedReason = newBudgetReason.trim();
                                                        if (!trimmedReason) {
                                                            setNewBudgetReasonError(
                                                                t('client.project_requests.budget.reason_required_new_propose')
                                                            );
                                                            return;
                                                        }

                                                        onResponse(String(project.id), {
                                                            response: 'NEW_PROPOSE',
                                                            proposedBudget: newBudget,
                                                            reason: trimmedReason,
                                                        });
                                                        setProposeNewBudgetProviderId(null);
                                                        setNewBudgetReason('');
                                                        setNewBudgetReasonError(null);
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
                                                        {providerProposedBudget != null ? (
                                                            <PriceDisplay value={providerProposedBudget} />
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
                                                    {providerBudgetProposalReason ? (
                                                        <div className="mt-2 text-sm text-muted-foreground">
                                                            <span className="font-medium text-foreground">
                                                                {t('client.project_requests.budget.provider_reason')}{' '}
                                                            </span>
                                                            {providerBudgetProposalReason}
                                                        </div>
                                                    ) : null}
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            handleBudgetResponse(
                                                                String(project.id),
                                                                String(provider.id),
                                                                'ACCEPTED'
                                                            );
                                                        }}
                                                        disabled={
                                                            responding === `${project.id}-${provider.id}` ||
                                                            providerBudgetStatus !== 'PROPOSED'
                                                        }
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        {t('client.project_requests.budget.approve')}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                            setRejectBudgetProviderId(String(provider.id));
                                                            setBudgetRejectionReason('');
                                                            setBudgetRejectionError(null);
                                                        }}
                                                        disabled={responding === `${project.id}-${provider.id}` || providerBudgetStatus !== 'PROPOSED'}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        {t('client.project_requests.budget.reject')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {providerBudgetStatus === 'REJECTED' && clientBudgetRejectionReason ? (
                                    <Alert className="mt-3 border-red-200 bg-red-50/70 dark:border-red-500/30 dark:bg-red-500/10">
                                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
                                        <AlertDescription>
                                            <div className="font-medium">
                                                {t('client.project_requests.budget.rejected')}
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">
                                                    {t('client.project_requests.budget.client_rejection_reason')}{' '}
                                                </span>
                                                {clientBudgetRejectionReason}
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                ) : null}

                                {canClientManageBudgetProposal && (
                                    <Dialog
                                        open={rejectBudgetProviderId === String(provider.id)}
                                        onOpenChange={(isOpen) => {
                                            setRejectBudgetProviderId(isOpen ? String(provider.id) : null);
                                            setBudgetRejectionReason('');
                                            setBudgetRejectionError(null);
                                        }}
                                    >
                                        <DialogContent className="max-w-xl">
                                            <DialogHeader>
                                                <DialogTitle>{t('client.project_requests.budget.reject_proposal_title')}</DialogTitle>
                                                <DialogDescription>
                                                    {t('client.project_requests.budget.reject_proposal_description')}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-2">
                                                <div className="text-sm font-medium">
                                                    {t('client.project_requests.budget.reason_label')}
                                                </div>
                                                <Textarea
                                                    value={budgetRejectionReason}
                                                    onChange={(event) => {
                                                        setBudgetRejectionReason(event.target.value);
                                                        if (budgetRejectionError) {
                                                            setBudgetRejectionError(null);
                                                        }
                                                    }}
                                                    placeholder={t('client.project_requests.budget.reason_placeholder_rejection')}
                                                    rows={4}
                                                />
                                                {budgetRejectionError ? (
                                                    <p className="text-sm text-red-600 dark:text-red-300">
                                                        {budgetRejectionError}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline">
                                                        {t('client.project_requests.budget.cancel')}
                                                    </Button>
                                                </DialogClose>
                                                <Button
                                                    variant="destructive"
                                                    disabled={responding === `${project.id}-${provider.id}`}
                                                    onClick={() => {
                                                        const trimmedReason = budgetRejectionReason.trim();
                                                        if (!trimmedReason) {
                                                            setBudgetRejectionError(
                                                                t('client.project_requests.budget.reason_required_reject')
                                                            );
                                                            return;
                                                        }

                                                        void (async () => {
                                                            const success = await handleBudgetResponse(
                                                                String(project.id),
                                                                String(provider.id),
                                                                'REJECTED',
                                                                trimmedReason
                                                            );
                                                            if (success) {
                                                                setRejectBudgetProviderId(null);
                                                                setBudgetRejectionReason('');
                                                                setBudgetRejectionError(null);
                                                            }
                                                        })();
                                                    }}
                                                >
                                                    {responding === `${project.id}-${provider.id}` ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : null}
                                                    {t('client.project_requests.budget.submit_rejection')}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
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
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div className="text-sm font-medium">
                                                {t('client.project_requests.milestones.title')}
                                            </div>
                                            {canProviderManageMilestoneChanges && providerProjectLines.length > 0 ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const defaultLine = providerProjectLines[0];
                                                        setMilestoneProposalDialog(
                                                            createMilestoneProposalDialogState({
                                                                mode: 'ADD',
                                                                providerId: String(provider.id),
                                                                projectLineId: String(defaultLine?.id ?? ''),
                                                                serviceName: String(
                                                                    defaultLine?.service_name ?? defaultLine?.title ?? ''
                                                                ),
                                                            })
                                                        );
                                                        setMilestoneProposalError(null);
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    {t('client.project_requests.milestone_change_requests.add_action')}
                                                </Button>
                                            ) : null}
                                        </div>
                                        {standaloneMilestoneChangeRequests.length > 0 ? (
                                            <div className="mb-3 space-y-2">
                                                {standaloneMilestoneChangeRequests.map((proposal: any) => {
                                                    const proposalId = proposal?.id != null ? String(proposal.id) : '';
                                                    const proposalStatus = normalizeStatusValue(proposal?.status ?? 'PENDING');
                                                    const proposalType = normalizeStatusValue(proposal?.proposal_type ?? '');

                                                    return (
                                                        <div
                                                            key={proposalId || `${proposalType}-${proposal?.created_at ?? Math.random()}`}
                                                            className="rounded-md border border-slate-200 bg-slate-50/60 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]"
                                                        >
                                                            <div className="font-medium text-slate-700 dark:text-slate-200">
                                                                {proposal?.title ??
                                                                    t('client.project_requests.milestone_change_requests.proposed_new')}
                                                            </div>
                                                            <div className="mt-1 text-muted-foreground">
                                                                <span className="font-medium text-foreground">
                                                                    {t('client.project_requests.milestone_change_requests.reason')}:{' '}
                                                                </span>
                                                                {proposal?.reason || '-'}
                                                            </div>
                                                            {canClientRespondToMilestoneChanges && proposalStatus === 'PENDING' ? (
                                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            void handleMilestoneProposalResponse(
                                                                                String(project.id),
                                                                                proposalId,
                                                                                'ACCEPTED'
                                                                            );
                                                                        }}
                                                                        disabled={
                                                                            !proposalId ||
                                                                            submittingMilestoneProposalKey ===
                                                                                `${project.id}:${proposalId}:ACCEPTED`
                                                                        }
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                                        {t('client.project_requests.milestone_change_requests.accept')}
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => {
                                                                            setMilestoneProposalResponseDialog({
                                                                                projectId: String(project.id),
                                                                                proposalId,
                                                                                proposalType,
                                                                            });
                                                                            setMilestoneProposalResponseReason('');
                                                                            setMilestoneProposalResponseError(null);
                                                                        }}
                                                                        disabled={!proposalId}
                                                                    >
                                                                        <XCircle className="w-4 h-4 mr-1" />
                                                                        {t('client.project_requests.milestone_change_requests.reject')}
                                                                    </Button>
                                                                </div>
                                                            ) : null}
                                                            {proposalStatus === 'REJECTED' && proposal?.client_reason ? (
                                                                <div className="mt-2 text-sm text-red-600 dark:text-red-300">
                                                                    <span className="font-medium">
                                                                        {t('client.project_requests.milestone_change_requests.client_reason')}:{' '}
                                                                    </span>
                                                                    {proposal.client_reason}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : null}

                                        <div className="space-y-2">
                                            {providerMilestones.map((milestone: any, index: number) => {
                                                const milestoneId = getMilestoneId(milestone);
                                                const milestoneStatus = milestoneStatusFor(milestone);
                                                const milestonePaymentStatus = milestonePaymentStatusFor(milestone);
                                                const hasMilestoneExceededEscrowPhase = isMilestoneBeyondEscrowPhase(milestone);
                                                const canSecureThisMilestone =
                                                    isClientRole &&
                                                    clientEscrowStatus === 'AWAITING_PAYMENT' &&
                                                    Boolean(clientEscrowPaymentUrl) &&
                                                    !hasMilestoneExceededEscrowPhase &&
                                                    isPendingPaymentStatus(milestone) &&
                                                    isMilestoneBudgetApproved(milestone) &&
                                                    milestoneId !== null &&
                                                    milestoneId !== undefined &&
                                                    index === securizablePendingIndex;
                                                const showDisabledSecurePaymentButton =
                                                    isClientRole &&
                                                    (isPendingPaymentStatus(milestone) || hasMilestoneExceededEscrowPhase) &&
                                                    !canSecureThisMilestone;
                                                const nextMilestoneStatus = getNextMilestoneStatus(milestoneStatus);
                                                const milestoneBudgetStatus =
                                                    milestoneBudgetStatusFor(milestone) || providerBudgetStatus;
                                                const assignedProviderIdForMilestone =
                                                    milestone?.assigned_provider_id ??
                                                    milestone?.assignedProviderId ??
                                                    milestone?.provider_id ??
                                                    milestone?.providerId ??
                                                    null;
                                                const providerIdForCard = String(provider?.id ?? '');
                                                const isMilestoneAssignedToCardProvider =
                                                    assignedProviderIdForMilestone !== null &&
                                                    assignedProviderIdForMilestone !== undefined &&
                                                    String(assignedProviderIdForMilestone) === providerIdForCard;
                                                const canAdvanceMilestoneStatus =
                                                    (() => {
                                                        if (
                                                            !isProviderRole ||
                                                            !isCurrentUserProvider ||
                                                            !isMilestoneAssignedToCardProvider ||
                                                            !milestoneId ||
                                                            nextMilestoneStatus === null
                                                        ) {
                                                            return false;
                                                        }

                                                        const normalizedMilestoneStatus = normalizeStatusValue(milestoneStatus);
                                                        const isTerminatedMilestone =
                                                            normalizedMilestoneStatus === 'FINISHED' ||
                                                            normalizedMilestoneStatus === 'COMPLETED' ||
                                                            normalizedMilestoneStatus === 'PAID' ||
                                                            normalizedMilestoneStatus === 'REJECTED';
                                                        if (isTerminatedMilestone) {
                                                            return false;
                                                        }

                                                        if (nextMilestoneStatus === 'work_in_progress') {
                                                            return (
                                                                isMilestonePaymentSecuredStatus(milestonePaymentStatus) ||
                                                                normalizedMilestoneStatus === 'ESCROW' ||
                                                                normalizedMilestoneStatus === 'BLOCKED'
                                                            );
                                                        }

                                                        return nextMilestoneStatus === 'finished';
                                                    })();
                                                const milestoneProposedAmount = toFiniteNumber(
                                                    milestone?.proposed_amount ?? milestone?.proposedAmount
                                                );
                                                const isMilestoneUpdating =
                                                    milestoneId !== null &&
                                                    milestoneId !== undefined &&
                                                    updatingMilestoneId === String(milestoneId);
                                                const milestoneChangeRequests = milestoneId != null
                                                    ? getProjectMilestoneChangeRequestsForMilestone(project, milestoneId).filter(
                                                        (proposal) => String(proposal?.provider_id ?? '') === String(provider?.id ?? '')
                                                    )
                                                    : [];
                                                const projectLineForMilestone = getProjectLineForMilestone(project, milestone);
                                                const canProviderEditMilestone =
                                                    canProviderManageMilestoneChanges &&
                                                    milestoneId != null &&
                                                    isMilestoneAssignedToCardProvider;

                                                return (
                                                    <div
                                                        key={milestoneId ?? index}
                                                        data-project-milestone-id={milestoneId != null ? String(milestoneId) : undefined}
                                                        id={milestoneId != null ? `project-milestone-${String(milestoneId)}` : undefined}
                                                        className={`flex items-center justify-between rounded-md border p-2 text-sm gap-2 ${
                                                            highlightedMilestoneId && milestoneId != null && String(milestoneId) === highlightedMilestoneId
                                                                ? 'border-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-500/30'
                                                                : ''
                                                        } ${(milestoneStatus === 'PAID' || milestonePaymentStatus === 'PAID') ? 'bg-green-300' : ''}`}
                                                    >
                                                        <div className="flex items-center justify-between gap-6">
                                                            <span className="block">
                                                                <div>{milestone.title}</div>
                                                                <div className="text-sm text-muted-foreground line-clamp-2">{milestone.description}</div>
                                                                {milestoneChangeRequests.length > 0 ? (
                                                                    <div className="mt-2 space-y-2">
                                                                        {milestoneChangeRequests.map((proposal: any) => {
                                                                            const proposalId = proposal?.id != null ? String(proposal.id) : '';
                                                                            const proposalStatus = normalizeStatusValue(proposal?.status ?? 'PENDING');
                                                                            const proposalType = normalizeStatusValue(proposal?.proposal_type ?? '');

                                                                            return (
                                                                                <div
                                                                                    key={String(proposal?.id ?? `${proposal?.proposal_type}-${proposal?.created_at}`)}
                                                                                    className="rounded-md border border-slate-200/80 bg-white/80 p-2 text-xs text-muted-foreground dark:border-[#1E2A3D] dark:bg-[#111B2D]"
                                                                                >
                                                                                    <span className="font-medium text-foreground">
                                                                                        {t('client.project_requests.milestone_change_requests.reason')}:{' '}
                                                                                    </span>
                                                                                    {proposal?.reason || '-'}
                                                                                    {proposalStatus === 'REJECTED' && proposal?.client_reason ? (
                                                                                        <div className="mt-1 text-red-600 dark:text-red-300">
                                                                                            <span className="font-medium">
                                                                                                {t('client.project_requests.milestone_change_requests.client_reason')}:{' '}
                                                                                            </span>
                                                                                            {proposal.client_reason}
                                                                                        </div>
                                                                                    ) : null}
                                                                                    {canClientRespondToMilestoneChanges && proposalStatus === 'PENDING' ? (
                                                                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                                            <Button
                                                                                                size="sm"
                                                                                                onClick={() => {
                                                                                                    void handleMilestoneProposalResponse(
                                                                                                        String(project.id),
                                                                                                        proposalId,
                                                                                                        'ACCEPTED'
                                                                                                    );
                                                                                                }}
                                                                                                disabled={
                                                                                                    !proposalId ||
                                                                                                    submittingMilestoneProposalKey ===
                                                                                                        `${project.id}:${proposalId}:ACCEPTED`
                                                                                                }
                                                                                            >
                                                                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                                                                {t('client.project_requests.milestone_change_requests.accept')}
                                                                                            </Button>
                                                                                            <Button
                                                                                                size="sm"
                                                                                                variant="destructive"
                                                                                                onClick={() => {
                                                                                                    setMilestoneProposalResponseDialog({
                                                                                                        projectId: String(project.id),
                                                                                                        proposalId,
                                                                                                        proposalType,
                                                                                                    });
                                                                                                    setMilestoneProposalResponseReason('');
                                                                                                    setMilestoneProposalResponseError(null);
                                                                                                }}
                                                                                                disabled={!proposalId}
                                                                                            >
                                                                                                <XCircle className="w-4 h-4 mr-1" />
                                                                                                {t('client.project_requests.milestone_change_requests.reject')}
                                                                                            </Button>
                                                                                        </div>
                                                                                    ) : null}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : null}
                                                            </span>
                                                            <span>/</span>
                                                            <span className="font-medium">
                                                                {t('client.project_requests.providers.milestone_budget')}{' '}
                                                                <PriceDisplay value={toFiniteNumber(milestone.amount) ?? 0} />
                                                                {milestoneBudgetStatus === 'PROPOSED' && milestoneProposedAmount != null ? (
                                                                    <span className="ml-2 text-blue-700">
                                                                        {'->'} <PriceDisplay value={milestoneProposedAmount} />
                                                                    </span>
                                                                ) : null}
                                                            </span>
                                                        </div>
                                                        <div className="ms-2 flex items-center gap-2">
                                                            {getMilestoneStatusBadge(milestoneStatus)}
                                                        </div>
                                                        {canProviderEditMilestone ? (
                                                            <span className="flex items-center gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setMilestoneProposalDialog(
                                                                            createMilestoneProposalDialogState({
                                                                                mode: 'UPDATE',
                                                                                providerId: String(provider.id),
                                                                                projectLineId: String(
                                                                                    projectLineForMilestone?.id ??
                                                                                        milestone?.project_line_id ??
                                                                                        milestone?.projectLineId ??
                                                                                        ''
                                                                                ),
                                                                                milestoneId: String(milestoneId),
                                                                                title: String(milestone?.title ?? ''),
                                                                                description: String(milestone?.description ?? ''),
                                                                                amount:
                                                                                    toFiniteNumber(milestone?.amount) != null
                                                                                        ? String(toFiniteNumber(milestone?.amount))
                                                                                        : '',
                                                                                reason: '',
                                                                                serviceName: String(
                                                                                    projectLineForMilestone?.service_name ??
                                                                                        milestone?.service_name ??
                                                                                        ''
                                                                                ),
                                                                                milestoneTitle: String(milestone?.title ?? ''),
                                                                                currentSnapshot: milestone,
                                                                            })
                                                                        );
                                                                        setMilestoneProposalError(null);
                                                                    }}
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5 mr-1" />
                                                                    {t('client.project_requests.milestone_change_requests.edit_action')}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setMilestoneProposalDialog(
                                                                            createMilestoneProposalDialogState({
                                                                                mode: 'DELETE',
                                                                                providerId: String(provider.id),
                                                                                projectLineId: String(
                                                                                    projectLineForMilestone?.id ??
                                                                                        milestone?.project_line_id ??
                                                                                        milestone?.projectLineId ??
                                                                                        ''
                                                                                ),
                                                                                milestoneId: String(milestoneId),
                                                                                title: String(milestone?.title ?? ''),
                                                                                description: String(milestone?.description ?? ''),
                                                                                amount:
                                                                                    toFiniteNumber(milestone?.amount) != null
                                                                                        ? String(toFiniteNumber(milestone?.amount))
                                                                                        : '',
                                                                                reason: '',
                                                                                serviceName: String(
                                                                                    projectLineForMilestone?.service_name ??
                                                                                        milestone?.service_name ??
                                                                                        ''
                                                                                ),
                                                                                milestoneTitle: String(milestone?.title ?? ''),
                                                                                currentSnapshot: milestone,
                                                                            })
                                                                        );
                                                                        setMilestoneProposalError(null);
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                                    {t('client.project_requests.milestone_change_requests.delete_action')}
                                                                </Button>
                                                            </span>
                                                        ) : null}
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
                                                                    {nextMilestoneStatus === 'work_in_progress'
                                                                        ? t('client.project_requests.milestones.start_work')
                                                                        : nextMilestoneStatus === 'finished'
                                                                            ? t('client.project_requests.milestones.mark_finished')
                                                                            : t('client.project_requests.milestones.finished')}
                                                                </Button>
                                                            </span>
                                                        )}
                                                        {canSecureThisMilestone && (
                                                            <span>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
                                                                    onClick={() => {
                                                                        if (clientEscrowPaymentUrl) {
                                                                            transactionNextStep(clientEscrowPaymentUrl);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Shield className="w-3.5 h-3.5 mr-2" />
                                                                    {t('client.project_requests.actions.secure_payment')}
                                                                </Button>
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
                {/*<div className="flex space-x-3 mt-6 pt-4 border-t">*/}

                {/*    <Button*/}
                {/*        variant="outline"*/}
                {/*        size="sm"*/}
                {/*        onClick={() => router.push(`/projects/${project.slug ?? project.id}`)}*/}
                {/*        disabled={!project?.slug && !project?.id}*/}
                {/*    >*/}
                {/*        <Eye className="w-4 h-4 mr-2" />*/}
                {/*        {t('client.project_requests.actions.view_details')}*/}
                {/*    </Button>*/}
                {/*    <Button variant="outline" size="sm">*/}
                {/*        <MessageSquare className="w-4 h-4 mr-2" />*/}
                {/*        {t('client.project_requests.actions.messages')}*/}
                {/*    </Button>*/}
                {/*</div>*/}
            </CardContent>
        </Card>

        <Dialog
            open={Boolean(milestoneProposalDialog)}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setMilestoneProposalDialog(null);
                    setMilestoneProposalError(null);
                }
            }}
        >
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {milestoneProposalDialog?.mode === 'ADD'
                            ? t('client.project_requests.milestone_change_requests.add_title')
                            : milestoneProposalDialog?.mode === 'UPDATE'
                                ? t('client.project_requests.milestone_change_requests.update_title')
                                : t('client.project_requests.milestone_change_requests.delete_title')}
                    </DialogTitle>
                    <DialogDescription>
                        {milestoneProposalDialog?.mode === 'ADD'
                            ? t('client.project_requests.milestone_change_requests.add_description')
                            : milestoneProposalDialog?.mode === 'UPDATE'
                                ? t('client.project_requests.milestone_change_requests.update_description')
                                : t('client.project_requests.milestone_change_requests.delete_description')}
                    </DialogDescription>
                </DialogHeader>

                {milestoneProposalDialog ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor={`milestone-proposal-line-${project.id}`}>
                                {t('client.project_requests.milestone_change_requests.service_label')}
                            </Label>
                            <select
                                id={`milestone-proposal-line-${project.id}`}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={milestoneProposalDialog.projectLineId}
                                onChange={(event) => {
                                    const selectedLine = milestoneProposalDialogLines.find(
                                        (line: any) => String(line?.id ?? '') === event.target.value
                                    );
                                    setMilestoneProposalDialog({
                                        ...milestoneProposalDialog,
                                        projectLineId: event.target.value,
                                        serviceName: String(
                                            selectedLine?.service_name ?? selectedLine?.title ?? ''
                                        ),
                                    });
                                    if (milestoneProposalError) {
                                        setMilestoneProposalError(null);
                                    }
                                }}
                                disabled={milestoneProposalDialog.mode !== 'ADD'}
                            >
                                {milestoneProposalDialogLines.map((line: any) => (
                                    <option key={String(line?.id ?? '')} value={String(line?.id ?? '')}>
                                        {line?.service_name ?? line?.title ?? '-'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {milestoneProposalDialog.mode !== 'DELETE' ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor={`milestone-proposal-title-${project.id}`}>
                                        {t('client.project_requests.milestone_change_requests.title_label')}
                                    </Label>
                                    <Input
                                        id={`milestone-proposal-title-${project.id}`}
                                        value={milestoneProposalDialog.title}
                                        onChange={(event) => {
                                            setMilestoneProposalDialog({
                                                ...milestoneProposalDialog,
                                                title: event.target.value,
                                            });
                                            if (milestoneProposalError) {
                                                setMilestoneProposalError(null);
                                            }
                                        }}
                                        placeholder={t('client.project_requests.milestone_change_requests.title_placeholder')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`milestone-proposal-description-${project.id}`}>
                                        {t('client.project_requests.milestone_change_requests.description_label')}
                                    </Label>
                                    <Textarea
                                        id={`milestone-proposal-description-${project.id}`}
                                        rows={3}
                                        value={milestoneProposalDialog.description}
                                        onChange={(event) => {
                                            setMilestoneProposalDialog({
                                                ...milestoneProposalDialog,
                                                description: event.target.value,
                                            });
                                            if (milestoneProposalError) {
                                                setMilestoneProposalError(null);
                                            }
                                        }}
                                        placeholder={t('client.project_requests.milestone_change_requests.description_placeholder')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`milestone-proposal-amount-${project.id}`}>
                                        {t('client.project_requests.milestone_change_requests.amount')}
                                    </Label>
                                    <Input
                                        id={`milestone-proposal-amount-${project.id}`}
                                        type="number"
                                        min="0"
                                        value={milestoneProposalDialog.amount}
                                        onChange={(event) => {
                                            setMilestoneProposalDialog({
                                                ...milestoneProposalDialog,
                                                amount: event.target.value,
                                            });
                                            if (milestoneProposalError) {
                                                setMilestoneProposalError(null);
                                            }
                                        }}
                                        placeholder="0"
                                    />
                                </div>
                            </>
                        ) : (
                            <Alert>
                                <Trash2 className="h-4 w-4" />
                                <AlertDescription>
                                    {t('client.project_requests.milestone_change_requests.delete_confirm', {
                                        milestone:
                                            milestoneProposalDialog.milestoneTitle ||
                                            milestoneProposalDialog.title ||
                                            t('client.project_requests.milestone_change_requests.untitled'),
                                    })}
                                </AlertDescription>
                            </Alert>
                        )}

                        {milestoneProposalDialog.currentSnapshot &&
                        milestoneProposalDialog.mode !== 'ADD' ? (
                            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50/60 p-3 text-sm dark:border-[#2A3952] dark:bg-[#111B2D]">
                                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {t('client.project_requests.milestone_change_requests.before')}
                                </div>
                                <div className="font-medium">
                                    {milestoneProposalDialog.currentSnapshot?.title ??
                                        milestoneProposalDialog.milestoneTitle ??
                                        t('client.project_requests.milestone_change_requests.untitled')}
                                </div>
                                {milestoneProposalDialog.currentSnapshot?.description ? (
                                    <div className="text-muted-foreground">
                                        {milestoneProposalDialog.currentSnapshot.description}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            <Label htmlFor={`milestone-proposal-reason-${project.id}`}>
                                {t('client.project_requests.milestone_change_requests.reason')}
                            </Label>
                            <Textarea
                                id={`milestone-proposal-reason-${project.id}`}
                                rows={4}
                                value={milestoneProposalDialog.reason}
                                onChange={(event) => {
                                    setMilestoneProposalDialog({
                                        ...milestoneProposalDialog,
                                        reason: event.target.value,
                                    });
                                    if (milestoneProposalError) {
                                        setMilestoneProposalError(null);
                                    }
                                }}
                                placeholder={t('client.project_requests.milestone_change_requests.reason_placeholder')}
                            />
                        </div>

                        {milestoneProposalError ? (
                            <p className="text-sm text-red-600 dark:text-red-300">
                                {milestoneProposalError}
                            </p>
                        ) : null}
                    </div>
                ) : null}

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">
                            {t('client.project_requests.budget.cancel')}
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={() => {
                            void handleSubmitMilestoneProposal();
                        }}
                        disabled={
                            !milestoneProposalDialog ||
                            submittingMilestoneProposalKey ===
                                [
                                    project?.id ?? '',
                                    milestoneProposalDialog.providerId,
                                    milestoneProposalDialog.mode,
                                    milestoneProposalDialog.milestoneId ?? milestoneProposalDialog.projectLineId,
                                ].join(':')
                        }
                    >
                        {submittingMilestoneProposalKey ===
                        (milestoneProposalDialog
                            ? [
                                  project?.id ?? '',
                                  milestoneProposalDialog.providerId,
                                  milestoneProposalDialog.mode,
                                  milestoneProposalDialog.milestoneId ??
                                      milestoneProposalDialog.projectLineId,
                              ].join(':')
                            : '') ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        {t('client.project_requests.milestone_change_requests.submit')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog
            open={Boolean(milestoneProposalResponseDialog)}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setMilestoneProposalResponseDialog(null);
                    setMilestoneProposalResponseReason('');
                    setMilestoneProposalResponseError(null);
                }
            }}
        >
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {t('client.project_requests.milestone_change_requests.reject_title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('client.project_requests.milestone_change_requests.reject_description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    <Label htmlFor={`milestone-proposal-response-reason-${project.id}`}>
                        {t('client.project_requests.milestone_change_requests.client_reason')}
                    </Label>
                    <Textarea
                        id={`milestone-proposal-response-reason-${project.id}`}
                        rows={4}
                        value={milestoneProposalResponseReason}
                        onChange={(event) => {
                            setMilestoneProposalResponseReason(event.target.value);
                            if (milestoneProposalResponseError) {
                                setMilestoneProposalResponseError(null);
                            }
                        }}
                        placeholder={t('client.project_requests.milestone_change_requests.reject_reason_placeholder')}
                    />
                    {milestoneProposalResponseError ? (
                        <p className="text-sm text-red-600 dark:text-red-300">
                            {milestoneProposalResponseError}
                        </p>
                    ) : null}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">
                            {t('client.project_requests.budget.cancel')}
                        </Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            const trimmedReason = milestoneProposalResponseReason.trim();
                            if (!trimmedReason) {
                                setMilestoneProposalResponseError(
                                    t('client.project_requests.milestone_change_requests.reject_reason_required')
                                );
                                return;
                            }

                            if (!milestoneProposalResponseDialog) {
                                return;
                            }

                            void (async () => {
                                const success = await handleMilestoneProposalResponse(
                                    milestoneProposalResponseDialog.projectId,
                                    milestoneProposalResponseDialog.proposalId,
                                    'REJECTED',
                                    trimmedReason
                                );

                                if (success) {
                                    setMilestoneProposalResponseDialog(null);
                                    setMilestoneProposalResponseReason('');
                                    setMilestoneProposalResponseError(null);
                                }
                            })();
                        }}
                        disabled={
                            !milestoneProposalResponseDialog ||
                            submittingMilestoneProposalKey ===
                                `${milestoneProposalResponseDialog.projectId}:${milestoneProposalResponseDialog.proposalId}:REJECTED`
                        }
                    >
                        {submittingMilestoneProposalKey ===
                        `${milestoneProposalResponseDialog?.projectId}:${milestoneProposalResponseDialog?.proposalId}:REJECTED` ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        {t('client.project_requests.milestone_change_requests.submit_reject')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
