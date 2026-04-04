import React from 'react';
import { CheckCircle, Clock, DollarSign, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type {
    MilestoneProposalDialogState,
    ProjectRequestCardTranslator,
} from './project-request-card-types';

export const toFiniteNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
};

export const normalizeStatusValue = (value: unknown): string =>
    String(value ?? '').trim().toUpperCase();

export const normalizePositiveBudget = (value: unknown): number | null => {
    const numeric = toFiniteNumber(value);
    if (numeric === null || numeric <= 0) return null;
    return numeric;
};

export const normalizeOptionalText = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

export const createMilestoneProposalDialogState = (
    config: Partial<MilestoneProposalDialogState> &
        Pick<MilestoneProposalDialogState, 'mode' | 'providerId' | 'projectLineId'>
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

export const getNextMilestoneStatus = (
    status: string
): 'work_in_progress' | 'finished' | null => {
    const normalized = normalizeStatusValue(status);
    if (normalized === 'PENDING' || normalized === 'ESCROW' || normalized === 'BLOCKED') {
        return 'work_in_progress';
    }
    if (normalized === 'WORK_IN_PROGRESS' || normalized === 'IN_PROGRESS') {
        return 'finished';
    }
    return null;
};

export const getStatusBadge = (status: string, t: ProjectRequestCardTranslator) => {
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

export const getBudgetStatusBadge = (status: string) => {
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

export const getMilestonePaymentStatusBadge = (
    status: string,
    t: ProjectRequestCardTranslator
) => {
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

export const getMilestoneStatusBadge = (
    status: string,
    t: ProjectRequestCardTranslator
) => {
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

export const isMilestonePaymentSecuredStatus = (status: string) => {
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

export const isMilestonePaymentSettledStatus = (status: string) => {
    const normalized = normalizeStatusValue(status);
    return normalized === 'PAID' || normalized === 'RELEASED';
};

export const isPendingMilestonePaymentStatus = (status: string) => {
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

export const hasMilestoneEscrowOrPaymentReference = (entry: any) => {
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

export const getMilestoneId = (milestone: any) =>
    milestone?.id ??
    milestone?.milestone_id ??
    milestone?.milestoneId ??
    milestone?.milestone_uuid ??
    milestone?.milestoneUuid ??
    milestone?.uuid ??
    null;

export const resolveProviderId = (value: any): string | null => {
    const rawId = value?.id ?? value?.provider_id ?? value?.providerId ?? null;
    return rawId === null || rawId === undefined ? null : String(rawId);
};

export const collectIdentityValues = (source: any): string[] => {
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
                .filter(
                    (value) =>
                        value !== null &&
                        value !== undefined &&
                        String(value).trim() !== ''
                )
                .map((value) => String(value))
        )
    );
};

export const deriveProviderServicesFromProjectLines = (
    projectLines: any[],
    providerId: string
) => {
    const services = projectLines.flatMap((line: any) => {
        const lineProviders = Array.isArray(line?.providers) ? line.providers : [];
        const isProviderAssignedToLine = lineProviders.some(
            (lineProvider: any) => resolveProviderId(lineProvider) === providerId
        );
        if (!isProviderAssignedToLine) return [];

        const lineServiceId = line?.service_id ?? null;
        const lineServiceName = String(line?.service_name ?? '').trim();
        if (!lineServiceName) return [];

        return [
            {
                id: lineServiceId,
                name: lineServiceName,
                categoryIcon: undefined,
            },
        ];
    });

    const deduplicated = new Map<
        string,
        { id?: unknown; name: string; categoryIcon?: string }
    >();
    services.forEach((service: { id?: unknown; name: string; categoryIcon?: string }) => {
        const key = `${String(service.id ?? '')}:${service.name.toLowerCase()}`;
        if (!deduplicated.has(key)) {
            deduplicated.set(key, service);
        }
    });

    return Array.from(deduplicated.values());
};

export const normalizeProviderForCard = ({
    project,
    projectLines,
    providerRaw,
    selectedProvidersById,
}: {
    project: any;
    projectLines: any[];
    providerRaw: any;
    selectedProvidersById: Map<string, any>;
}) => {
    const providerId = resolveProviderId(providerRaw);
    if (!providerId) return null;

    const selectedProvider = selectedProvidersById.get(providerId) ?? null;
    const rawName = String(providerRaw?.name ?? selectedProvider?.name ?? '').trim();
    const [nameFirstPart = '', ...nameRestParts] = rawName ? rawName.split(/\s+/) : [];
    const inferredFirstName = nameFirstPart;
    const inferredLastName = nameRestParts.join(' ');
    const projectStatus = normalizeStatusValue(project?.status ?? '');
    const inferredProviderResponse =
        projectStatus === 'PENDING' ? 'PENDING' : projectStatus ? 'ACCEPTED' : '';
    const providerResponse =
        normalizeStatusValue(
            providerRaw?.provider_response ??
                providerRaw?.pivotResponse ??
                providerRaw?.pivot?.provider_response ??
                selectedProvider?.provider_response ??
                selectedProvider?.pivot?.provider_response
        ) || inferredProviderResponse;
    const providerStatus =
        normalizeStatusValue(
            providerRaw?.status ?? providerResponse ?? selectedProvider?.status
        ) || 'PENDING';
    const services =
        Array.isArray(providerRaw?.services) && providerRaw.services.length > 0
            ? providerRaw.services
            : deriveProviderServicesFromProjectLines(projectLines, providerId);
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

export const buildNormalizedProviders = ({
    project,
    projectLines,
    selectedProviders,
}: {
    project: any;
    projectLines: any[];
    selectedProviders: any[];
}) => {
    const projectLineMilestonesForProviders = Array.isArray(project?.project_line_milestones)
        ? project.project_line_milestones
        : projectLines.flatMap((line: any) =>
              (Array.isArray(line?.milestones) ? line.milestones : []).map(
                  (milestone: any) => ({
                      ...milestone,
                      project_line_id:
                          milestone?.project_line_id ?? milestone?.projectLineId ?? line?.id,
                      service_id:
                          milestone?.service_id ?? milestone?.serviceId ?? line?.service_id,
                      service_name:
                          milestone?.service_name ??
                          milestone?.serviceName ??
                          line?.service_name,
                  })
              )
          );
    const providersFromProjectLines = projectLines.flatMap((line: any) =>
        Array.isArray(line?.providers) ? line.providers : []
    );
    const providersFromMilestones = projectLineMilestonesForProviders
        .map((milestone: any) => {
            const assignedProvider =
                milestone?.assigned_provider && typeof milestone.assigned_provider === 'object'
                    ? milestone.assigned_provider
                    : null;
            const assignedProviderId =
                resolveProviderId(assignedProvider) ??
                (milestone?.assigned_provider_id != null
                    ? String(milestone.assigned_provider_id)
                    : null) ??
                (milestone?.assignedProviderId != null
                    ? String(milestone.assignedProviderId)
                    : null) ??
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
                provider_response:
                    normalizeStatusValue(project?.status ?? '') === 'PENDING'
                        ? 'PENDING'
                        : 'ACCEPTED',
            };
        })
        .filter((provider: any) => Boolean(provider));
    const selectedProvidersById: Map<string, any> = new Map(
        selectedProviders
            .map((provider: any): [string, any] => [String(provider?.id), provider])
            .filter((entry: [string, any]) => entry[0] !== 'undefined' && entry[0] !== 'null')
    );

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

    return Array.from(providersListRawMap.values())
        .map((provider: any) =>
            normalizeProviderForCard({
                project,
                projectLines,
                providerRaw: provider,
                selectedProvidersById,
            })
        )
        .filter((provider: any) => Boolean(provider));
};

export const getProjectMilestones = (projectData: any) => {
    const rootMilestones = Array.isArray(projectData?.project_line_milestones)
        ? projectData.project_line_milestones
        : [];
    if (rootMilestones.length > 0) {
        return rootMilestones;
    }

    const lineMilestones = Array.isArray(projectData?.project_lines)
        ? projectData.project_lines.flatMap((line: any) =>
              (Array.isArray(line?.milestones) ? line.milestones : []).map(
                  (milestone: any) => ({
                      ...milestone,
                      project_line_id:
                          milestone?.project_line_id ?? milestone?.projectLineId ?? line?.id,
                      service_id:
                          milestone?.service_id ?? milestone?.serviceId ?? line?.service_id,
                      service_name:
                          milestone?.service_name ??
                          milestone?.serviceName ??
                          line?.service_name,
                      assigned_provider_id:
                          milestone?.assigned_provider_id ??
                          milestone?.providerId ??
                          milestone?.provider_id ??
                          null,
                  })
              )
          )
        : [];
    if (lineMilestones.length > 0) {
        return lineMilestones;
    }
    return [];
};

export const getProviderMilestones = (projectData: any, providerData: any) => {
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
        return (
            assignedProviderId === null ||
            assignedProviderId === undefined ||
            String(assignedProviderId) === ''
        );
    };

    const projectLinesForFiltering = Array.isArray(projectData?.project_lines)
        ? projectData.project_lines
        : [];
    const providerLineIds = new Set(
        projectLinesForFiltering
            .filter(
                (line: any) =>
                    Array.isArray(line?.providers) &&
                    line.providers.some(
                        (lineProvider: any) => resolveProviderId(lineProvider) === providerId
                    )
            )
            .map((line: any) => String(line?.id))
            .filter(Boolean)
    );

    const explicitlyAssignedMilestones = allMilestones.filter((milestone: any) => {
        const assignedProviderId = getAssignedProviderId(milestone);
        return (
            assignedProviderId !== null &&
            assignedProviderId !== undefined &&
            String(assignedProviderId) === providerId
        );
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
            : deriveProviderServicesFromProjectLines(projectLinesForFiltering, providerId);
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
        if (
            milestoneServiceId !== null &&
            milestoneServiceId !== undefined &&
            providerServiceIds.has(String(milestoneServiceId))
        ) {
            return true;
        }

        const milestoneServiceName = String(milestone?.service_name ?? '')
            .trim()
            .toLowerCase();
        if (milestoneServiceName && providerServiceNames.has(milestoneServiceName)) {
            return true;
        }

        const lineId = milestone?.project_line_id ?? milestone?.projectLineId;
        if (lineId === null || lineId === undefined) {
            return false;
        }

        const line = projectLinesForFiltering.find(
            (entry: any) => String(entry?.id) === String(lineId)
        );
        if (!line) {
            return false;
        }

        const lineServiceId = line?.service_id;
        if (
            lineServiceId !== null &&
            lineServiceId !== undefined &&
            providerServiceIds.has(String(lineServiceId))
        ) {
            return true;
        }

        const lineServiceName = String(line?.service_name ?? '').trim().toLowerCase();
        return Boolean(lineServiceName && providerServiceNames.has(lineServiceName));
    });

    return sortAndDeduplicateMilestones(filtered);
};

export const getAssignedProviderMilestones = (projectData: any, providerData: any) => {
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
        return (
            assignedProviderId !== null &&
            assignedProviderId !== undefined &&
            String(assignedProviderId) === providerId
        );
    });

    const seenIds = new Set<string>();
    return [...providerMilestones]
        .sort((a: any, b: any) => {
            const lineOrderA = toSortableNumber(a?.project_line_id ?? a?.projectLineId);
            const lineOrderB = toSortableNumber(b?.project_line_id ?? b?.projectLineId);
            if (lineOrderA !== lineOrderB) return lineOrderA - lineOrderB;

            const sequenceOrderA = toSortableNumber(
                a?.sequence ?? a?.order ?? a?.order_index ?? a?.orderIndex ?? a?.position
            );
            const sequenceOrderB = toSortableNumber(
                b?.sequence ?? b?.order ?? b?.order_index ?? b?.orderIndex ?? b?.position
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

export const getProviderProjectLines = (projectData: any, providerData: any) => {
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

type RenderEscrowStatusControlArgs = {
    statusValue: unknown;
    nextStepUrl: string | null | undefined;
    audience: 'provider' | 'client';
    t: ProjectRequestCardTranslator;
    onOpenUrl?: (url: string) => void;
};

export const renderEscrowStatusControl = ({
    statusValue,
    nextStepUrl,
    audience,
    t,
    onOpenUrl,
}: RenderEscrowStatusControlArgs) => {
    const status = normalizeStatusValue(statusValue);
    if (!status) {
        return null;
    }

    const badgeClassName =
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium';

    const renderBadge = (label: string, className: string) => (
        <Badge className={`${badgeClassName} ${className}`}>{label}</Badge>
    );

    const openUrl = () => {
        if (nextStepUrl && onOpenUrl) {
            onOpenUrl(nextStepUrl);
        }
    };

    switch (status) {
        case 'PENDING':
            if (nextStepUrl && onOpenUrl) {
                return (
                    <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        onClick={openUrl}
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
            if (audience === 'client' && nextStepUrl && onOpenUrl) {
                return (
                    <Button
                        size="sm"
                        className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
                        onClick={openUrl}
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
            if (nextStepUrl && onOpenUrl) {
                return (
                    <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                        onClick={openUrl}
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
