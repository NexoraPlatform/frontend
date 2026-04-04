"use client";

import React, { useState, useCallback, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/lib/navigation';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { enUS, ro } from 'date-fns/locale';
import { getDashboardHomeHref, getNewProjectHref } from '@/lib/dashboard-navigation';
import { AI_BRIEF_DRAFT_STORAGE_KEY, type AiBriefFormDraft } from '@/types/ai';
import { extractProjectContractIdCandidate } from '@/lib/contracts';
import {
    createEmptyBriefDraft,
    getMilestoneStatusBadge as buildMilestoneStatusBadge,
    getStatusBadge as buildStatusBadge,
    normalizeOptionalText,
    normalizePositiveBudget,
    normalizeStatusValue,
    readCachedProjectContractId,
    toFiniteNumber,
} from './_lib/client-project-requests-helpers';
import type {
    BudgetRejectionDialogState,
    ClientProjectRequestsProps,
    ContractDialogContext,
    MilestoneProposalResponseDialogState,
    ReplacementContext,
} from './_lib/client-project-requests-types';
import { useClearHighlightedMilestone } from './_hooks/use-clear-highlighted-milestone';
import { useClientProjectRequestsAccess } from './_hooks/use-client-project-requests-access';
import { useClientProjectRequestsRealtime } from './_hooks/use-client-project-requests-realtime';
import { ProjectRequestsBriefDraftSection } from './_components/project-requests-brief-draft-section';
import { ProjectRequestsDialogs } from './_components/project-requests-dialogs';
import { ProjectRequestsProjectList } from './_components/project-requests-project-list';

export default function ClientProjectRequests({ withLayout = true }: ClientProjectRequestsProps) {
    const { user, loading, userLoading, refreshUser } = useAuth();
    const locale = useLocale();
    const t = useTranslations();
    const dateLocale = locale?.toLowerCase().startsWith('en') ? enUS : ro;
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [responding, setResponding] = useState<string | null>(null);
    const [budgetRejectionDialog, setBudgetRejectionDialog] = useState<BudgetRejectionDialogState>(null);
    const [budgetRejectionReason, setBudgetRejectionReason] = useState('');
    const [budgetRejectionError, setBudgetRejectionError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const roleRefreshAttemptedRef = useRef(false);
    const [isRefreshingRole, setIsRefreshingRole] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null);
    const [releasingId, setReleasingId] = useState<string | null>(null);
    const [contractDialogContext, setContractDialogContext] = useState<ContractDialogContext>(null);
    const [openReplacementDialog, setOpenReplacementDialog] = useState(false);
    const [replacementContext, setReplacementContext] = useState<ReplacementContext>(null);
    const [replacementSuggestions, setReplacementSuggestions] = useState<any[]>([]);
    const [loadingReplacementSuggestions, setLoadingReplacementSuggestions] = useState(false);
    const [reassigningProviderId, setReassigningProviderId] = useState<string | null>(null);
    const [briefDraft, setBriefDraft] = useState<AiBriefFormDraft>(createEmptyBriefDraft);
    const [milestoneProposalResponseDialog, setMilestoneProposalResponseDialog] =
        useState<MilestoneProposalResponseDialogState>(null);
    const [milestoneProposalResponseReason, setMilestoneProposalResponseReason] = useState('');
    const [milestoneProposalResponseError, setMilestoneProposalResponseError] = useState<string | null>(null);
    const [highlightedMilestoneId, setHighlightedMilestoneId] = useState<string | null>(null);
    const roleSlugs = [
        ...(user?.role_slugs ?? []),
        ...((user?.roles ?? []).map((role: any) => role?.slug).filter(Boolean)),
    ]
        .map((slug) => String(slug).toLowerCase())
        .filter(Boolean);
    const focusedProjectId = searchParams.get('projectId');
    const isClientRole = roleSlugs.includes('client') || user?.role?.toLowerCase() === 'client';
    const hasRoleInfo = roleSlugs.length > 0 || Boolean(user?.role);
    const getMilestoneId = useCallback((milestone: any) => {
        return (
            milestone?.id ??
            milestone?.milestone_id ??
            milestone?.milestoneId ??
            milestone?.milestone_uuid ??
            milestone?.milestoneUuid ??
            milestone?.uuid ??
            null
        );
    }, []);
    const getProviderId = useCallback((value: any) => {
        const rawId = value?.id ?? value?.provider_id ?? value?.providerId ?? null;
        return rawId === null || rawId === undefined ? null : String(rawId);
    }, []);

    useClearHighlightedMilestone({
        highlightedMilestoneId,
        clearHighlightedMilestone: () => setHighlightedMilestoneId(null),
    });

    const applyProjectUpdate = useCallback((nextProject: any, options?: { highlightMilestoneId?: string | number | null }) => {
        if (!nextProject || typeof nextProject !== 'object') {
            return;
        }

        setProjects((current) =>
            current.map((entry) =>
                String(entry?.id ?? '') === String(nextProject?.id ?? '')
                    ? nextProject
                    : entry
            )
        );
        setSelectedProject((current: any | null) =>
            current && String(current?.id ?? '') === String(nextProject?.id ?? '')
                ? nextProject
                : current
        );

        if (options?.highlightMilestoneId !== null && options?.highlightMilestoneId !== undefined) {
            setHighlightedMilestoneId(String(options.highlightMilestoneId));
        }
    }, []);

    const getProjectMilestones = useCallback((project: any) => {
        if (!project) return [];

        const rootMilestones = Array.isArray(project.project_line_milestones)
            ? project.project_line_milestones
            : [];
        if (rootMilestones.length > 0) {
            return rootMilestones;
        }

        const lineMilestones = Array.isArray(project.project_lines)
            ? project.project_lines.flatMap((line: any) => {
                const lineId = line?.id;
                const lineServiceId = line?.service_id;
                const lineServiceName = line?.service_name;
                const lineMilestonesRaw = Array.isArray(line?.milestones) ? line.milestones : [];
                return lineMilestonesRaw.map((milestone: any) => ({
                    ...milestone,
                    project_line_id:
                        milestone?.project_line_id ??
                        milestone?.projectLineId ??
                        lineId,
                    service_id: milestone?.service_id ?? milestone?.serviceId ?? lineServiceId,
                    service_name: milestone?.service_name ?? milestone?.serviceName ?? lineServiceName,
                    assigned_provider_id:
                        milestone?.assigned_provider_id ??
                        milestone?.providerId ??
                        milestone?.provider_id ??
                        null,
                }));
            })
            : [];
        if (lineMilestones.length > 0) {
            return lineMilestones;
        }
        return [];
    }, []);

    const getProjectProviders = useCallback((project: any) => {
        if (!project) return [];

        const projectLines = Array.isArray(project?.project_lines) ? project.project_lines : [];
        const lineProviders = projectLines.flatMap((line: any) =>
            Array.isArray(line?.providers) ? line.providers : []
        );
        const milestones = getProjectMilestones(project);
        const milestoneProviders = milestones
            .map((milestone: any) => {
                const assignedProvider = (milestone?.assigned_provider && typeof milestone.assigned_provider === 'object')
                    ? milestone.assigned_provider
                    : null;
                const assignedProviderId =
                    getProviderId(assignedProvider) ??
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
                    provider_response: normalizeStatusValue(project?.status, 'PENDING') === 'PENDING' ? 'PENDING' : 'ACCEPTED',
                };
            })
            .filter((provider: any) => Boolean(provider));

        const providerMap = new Map<string, any>();
        const registerProvider = (providerCandidate: any) => {
            const providerId = getProviderId(providerCandidate);
            if (!providerId) return;
            const existing = providerMap.get(providerId) ?? { id: providerId };
            providerMap.set(providerId, {
                ...existing,
                ...providerCandidate,
                id: providerId,
            });
        };

        [
            ...milestoneProviders,
            ...lineProviders,
            ...(Array.isArray(project?.providers) ? project.providers : []),
            ...(Array.isArray(project?.selected_providers) ? project.selected_providers : []),
        ].forEach(registerProvider);

        return Array.from(providerMap.values()).map((provider: any) => {
            const fullName = String(provider?.name ?? '').trim();
            const [nameFirstPart = '', ...nameRestParts] = fullName ? fullName.split(/\s+/) : [];
            const inferredFirstName = nameFirstPart;
            const inferredLastName = nameRestParts.join(' ');

            return {
                ...provider,
                firstName:
                    provider?.firstName ??
                    provider?.first_name ??
                    inferredFirstName ??
                    'Provider',
                lastName:
                    provider?.lastName ??
                    provider?.last_name ??
                    inferredLastName ??
                    (inferredFirstName ? '' : `#${String(provider?.id ?? '')}`),
                providerBudgetProposalReason:
                    normalizeOptionalText(
                        provider?.providerBudgetProposalReason ??
                        provider?.provider_budget_proposal_reason ??
                        provider?.proposalReason ??
                        provider?.pivot?.provider_budget_proposal_reason ??
                        provider?.pivot?.proposalReason
                    ) ?? null,
                clientBudgetRejectionReason:
                    normalizeOptionalText(
                        provider?.clientBudgetRejectionReason ??
                        provider?.client_budget_rejection_reason ??
                        provider?.rejectionReason ??
                        provider?.pivot?.client_budget_rejection_reason ??
                        provider?.pivot?.rejectionReason
                    ) ?? null,
            };
        });
    }, [getProjectMilestones, getProviderId, normalizeOptionalText]);

    const getProviderMilestones = useCallback((project: any, provider: any) => {
        const providerId = getProviderId(provider);
        if (!providerId) {
            return [];
        }

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
                .filter((milestone: any, index: number) => {
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

        const allMilestones = getProjectMilestones(project);
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

        const projectLines = Array.isArray(project?.project_lines) ? project.project_lines : [];
        const providerLineIds = new Set(
            projectLines
                .filter((line: any) =>
                    Array.isArray(line?.providers) &&
                    line.providers.some((lineProvider: any) => getProviderId(lineProvider) === providerId)
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

        const providerServices = Array.isArray(provider?.services) ? provider.services : [];
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

        return sortAndDeduplicateMilestones(filtered);
    }, [getMilestoneId, getProjectMilestones, getProviderId]);

    const projectBudgetAmount = selectedProject?.budget?.amount != null
        ? Number(selectedProject.budget.amount)
        : null;
    const selectedMilestoneAmount = selectedMilestone?.amount != null
        ? Number(selectedMilestone.amount)
        : null;
    const selectedMilestoneId = getMilestoneId(selectedMilestone);
    const isMilestonePayment = selectedMilestone != null;
    const platformFeeBase = projectBudgetAmount != null
        ? Math.min(projectBudgetAmount * 0.10, 150)
        : null;
    const isFirstMilestone = (() => {
        if (!isMilestonePayment || !selectedProject || !selectedMilestoneId) return false;
        const allMilestones = getProjectMilestones(selectedProject);
        const selectedLineId = selectedMilestone?.project_line_id ?? selectedMilestone?.projectLineId;
        const scopedMilestones = selectedLineId !== null && selectedLineId !== undefined
            ? allMilestones.filter(
                (milestone: any) =>
                    String(milestone?.project_line_id ?? milestone?.projectLineId) === String(selectedLineId)
            )
            : allMilestones;
        const index = scopedMilestones.findIndex(
            (milestone: any) => String(getMilestoneId(milestone)) === String(selectedMilestoneId)
        );
        return index === 0;
    })();
    const displayedValueAmount = isMilestonePayment ? selectedMilestoneAmount : projectBudgetAmount;
    const displayedFeeAmount = isMilestonePayment
        ? (isFirstMilestone ? platformFeeBase : 0)
        : platformFeeBase;
    const displayedTotalAmount = displayedValueAmount != null && displayedFeeAmount != null
        ? displayedValueAmount + displayedFeeAmount
        : null;

    const parseTechnologies = useCallback((value: string) => {
        return Array.from(
            new Set(
                value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
            )
        );
    }, []);

    const handleCopilotApply = useCallback((draft: AiBriefFormDraft) => {
        setBriefDraft((prev) => ({
            ...prev,
            ...draft,
            title: draft.title || prev.title,
            description: draft.description || prev.description,
            budget: draft.budget || prev.budget,
            budgetType: draft.budgetType || prev.budgetType,
            deadline: draft.deadline || prev.deadline,
            technologies: draft.technologies.length > 0 ? draft.technologies : prev.technologies,
            team_structure: draft.team_structure ?? prev.team_structure,
        }));
        toast.success(t('client.project_requests.brief_copilot.apply_to_form'));
    }, [t]);

    const handleContinueToProjectForm = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(AI_BRIEF_DRAFT_STORAGE_KEY, JSON.stringify(briefDraft));
        }
        router.push('/projects/new?source=brief-copilot');
    }, [briefDraft, router]);

    const loadProjects = useCallback(async () => {
        try {
            const response = await apiClient.getClientProjectRequests();
            const projectsCollection = Array.isArray(response?.projects) ? response.projects : [];
            const prioritizedProjects = focusedProjectId
                ? [...projectsCollection].sort((a: any, b: any) => {
                    const aMatches = String(a?.id ?? '') === String(focusedProjectId) ? 1 : 0;
                    const bMatches = String(b?.id ?? '') === String(focusedProjectId) ? 1 : 0;
                    return bMatches - aMatches;
                })
                : projectsCollection;

            setProjects(prioritizedProjects);
        } catch (error: any) {
            console.error('Failed to load projects:', error);
            setProjects([]);
            toast.error(t('client.project_requests.errors.generic', { message: error?.message ?? 'Unknown error' }));
        } finally {
            setLoadingProjects(false);
        }
    }, [focusedProjectId, t]);

    useClientProjectRequestsRealtime({
        userId: user?.id,
        loadProjects,
    });

    useClientProjectRequestsAccess({
        user,
        userLoading,
        hasRoleInfo,
        isClientRole,
        withLayout,
        refreshUser,
        loadProjects,
        setIsRefreshingRole,
        roleRefreshAttemptedRef,
        replace: router.replace,
        dashboardHomeHref: getDashboardHomeHref(),
    });



    const handleBudgetResponse = useCallback(async (
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
    }, [applyProjectUpdate, locale, t]);

    const handleMilestoneProposalResponse = useCallback(async (
        projectId: string,
        proposalId: string,
        response: 'ACCEPTED' | 'REJECTED',
        reason?: string
    ) => {
        const requestKey = `${projectId}:${proposalId}:${response}`;
        setResponding(requestKey);
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
    }, [applyProjectUpdate, locale, t]);

    const openContractWorkspace = (project: any, options?: { autoGenerate?: boolean }) => {
        const projectId = String(project?.id ?? '');
        const initialContractId =
            extractProjectContractIdCandidate(project) ??
            readCachedProjectContractId(projectId);

        setContractDialogContext({
            projectId,
            projectTitle: project?.title ?? null,
            projectClientId: project?.client_id ?? project?.client?.id ?? null,
            initialContractId,
            autoGenerate: Boolean(options?.autoGenerate) && !initialContractId,
        });
    };

    const handleReleaseFunds = useCallback(async (projectId: string, milestoneId?: string) => {
        const releaseKey = milestoneId ? `milestone-${milestoneId}` : `project-${projectId}`;
        setReleasingId(releaseKey);
        try {
            const response = await apiClient.rapydReleasePayment(projectId, milestoneId, locale);
            toast.success(response?.message ?? t('client.project_requests.release.success'));
            await loadProjects();
        } catch (error: any) {
            const serverMessage = error.response?.data?.error || error.message || "A apărut o eroare necunoscută.";

            toast.error(t('client.project_requests.release.error', { message: serverMessage }));
        } finally {
            setReleasingId(null);
        }
    }, [loadProjects, locale, t]);

    const openReplacementSuggestionsForMilestone = useCallback(async (
        projectId: string,
        milestone: any,
        excludeProviderId?: string | null
    ) => {
        const milestoneId = getMilestoneId(milestone);
        if (milestoneId === null || milestoneId === undefined) {
            toast.error(t('client.project_requests.errors.generic', { message: 'Invalid milestone identifier.' }));
            return;
        }

        const milestoneIdText = String(milestoneId);
        setReplacementContext({
            projectId: String(projectId),
            milestoneId: milestoneIdText,
            milestoneTitle: String(milestone?.title ?? ''),
            ...(excludeProviderId ? { excludeProviderId: String(excludeProviderId) } : {}),
        });
        setOpenReplacementDialog(true);
        setLoadingReplacementSuggestions(true);
        setReplacementSuggestions([]);

        try {
            const response = await apiClient.getReplacementProviderSuggestions(projectId, {
                milestone_ids: [milestoneIdText],
                ...(excludeProviderId ? { exclude_provider_id: excludeProviderId } : {}),
                limit: 5,
            });

            const suggestionBuckets = Array.isArray(response?.replacement_suggestions)
                ? response.replacement_suggestions
                : [];
            const scopedBucket =
                suggestionBuckets.find((bucket: any) => {
                    const bucketMilestoneId =
                        bucket?.milestone_id ??
                        bucket?.project_line_milestone_id ??
                        null;
                    return bucketMilestoneId !== null && String(bucketMilestoneId) === milestoneIdText;
                }) ?? suggestionBuckets[0];
            const providers = Array.isArray(scopedBucket?.providers) ? scopedBucket.providers : [];
            setReplacementSuggestions(providers);
        } catch (error: any) {
            toast.error(t('client.project_requests.errors.generic', { message: error?.message ?? 'Unknown error' }));
            setReplacementSuggestions([]);
        } finally {
            setLoadingReplacementSuggestions(false);
        }
    }, [getMilestoneId, t]);

    const handleReassignMilestoneProvider = useCallback(async (providerId: string) => {
        if (!replacementContext) return;

        setReassigningProviderId(providerId);
        try {
            await apiClient.reassignProjectMilestones(replacementContext.projectId, {
                provider_id: providerId,
                milestone_ids: [replacementContext.milestoneId],
                language: locale,
            });
            await loadProjects();
            setOpenReplacementDialog(false);
            setReplacementContext(null);
            setReplacementSuggestions([]);
            toast.success('Milestone reassigned successfully.');
        } catch (error: any) {
            toast.error(t('client.project_requests.errors.generic', { message: error?.message ?? 'Unknown error' }));
        } finally {
            setReassigningProviderId(null);
        }
    }, [loadProjects, locale, replacementContext, t]);

    const getStatusBadge = useCallback(
        (status: string) => buildStatusBadge(status, t),
        [t]
    );

    const getMilestoneStatusBadge = useCallback(
        (status: string) => buildMilestoneStatusBadge(status, t),
        [t]
    );

    const handleCreateProject = useCallback(() => {
        router.push(getNewProjectHref());
    }, [router]);

    const openBudgetRejectionDialog = useCallback((projectId: string, providerId: string) => {
        setBudgetRejectionDialog({
            projectId,
            providerId,
        });
        setBudgetRejectionReason('');
        setBudgetRejectionError(null);
    }, []);

    const clearBudgetRejectionDialog = useCallback(() => {
        setBudgetRejectionDialog(null);
        setBudgetRejectionReason('');
        setBudgetRejectionError(null);
    }, []);

    const submitBudgetRejection = useCallback(() => {
        if (!budgetRejectionDialog) return;

        const trimmedReason = budgetRejectionReason.trim();
        if (!trimmedReason) {
            setBudgetRejectionError(
                t('client.project_requests.budget.reason_required_reject')
            );
            return;
        }

        setBudgetRejectionError(null);
        void (async () => {
            const success = await handleBudgetResponse(
                budgetRejectionDialog.projectId,
                budgetRejectionDialog.providerId,
                'REJECTED',
                trimmedReason
            );
            if (success) {
                setBudgetRejectionDialog(null);
                setBudgetRejectionReason('');
            }
        })();
    }, [budgetRejectionDialog, budgetRejectionReason, handleBudgetResponse, t]);

    const openMilestoneProposalResponseDialog = useCallback((projectId: string, proposalId: string) => {
        setMilestoneProposalResponseDialog({
            projectId,
            proposalId,
        });
        setMilestoneProposalResponseReason('');
        setMilestoneProposalResponseError(null);
    }, []);

    const clearMilestoneProposalResponseDialog = useCallback(() => {
        setMilestoneProposalResponseDialog(null);
        setMilestoneProposalResponseReason('');
        setMilestoneProposalResponseError(null);
    }, []);

    const submitMilestoneProposalRejection = useCallback(() => {
        if (!milestoneProposalResponseDialog) return;

        const trimmedReason = milestoneProposalResponseReason.trim();
        if (!trimmedReason) {
            setMilestoneProposalResponseError(
                t('client.project_requests.milestone_change_requests.reject_reason_required')
            );
            return;
        }

        setMilestoneProposalResponseError(null);
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
            }
        })();
    }, [
        handleMilestoneProposalResponse,
        milestoneProposalResponseDialog,
        milestoneProposalResponseReason,
        t,
    ]);

    const clearReplacementDialog = useCallback(() => {
        setReplacementContext(null);
        setReplacementSuggestions([]);
    }, []);

    const handleContractDialogOpenChange = useCallback((open: boolean) => {
        if (!open) {
            setContractDialogContext(null);
        }
    }, []);

    const loadingClassName = withLayout
        ? "min-h-screen bg-white dark:bg-[#070C14] flex flex-col items-center justify-center"
        : "py-16 flex flex-col items-center justify-center";

    if (loading || userLoading || loadingProjects || isRefreshingRole) {
        return (
            <div className={loadingClassName}>
                <Loader2 className="w-8 h-8 animate-spin text-[#1BC47D]" />
            </div>
        );
    }

    if (!user || (hasRoleInfo && !isClientRole)) {
        return null;
    }

    const containerClassName = withLayout
        ? "min-h-screen bg-white dark:bg-[#070C14]"
        : "bg-transparent";

    return (
        <div className={containerClassName}>
            {withLayout ? <Header /> : null}
            {withLayout ? <TrustoraThemeStyles /> : null}

            <section>
                <div className="container mx-auto px-4 py-12 lg:py-16">
                    <div className="max-w-3xl">
                        <Badge className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#0B1C2D] text-xs font-bold dark:bg-[#111B2D] dark:border-[#1E2A3D] dark:text-[#E6EDF3]">
                            <span className="text-[#1BC47D]">●</span> {t('client.project_requests.hero.badge')}
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('client.project_requests.hero.title')}
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-[#A3ADC2]">
                            {t('client.project_requests.hero.description')}
                        </p>
                    </div>
                </div>
            </section>

            <section className="bg-[#F5F7FA] dark:bg-[#0B1220]">
                <div className="container mx-auto px-4 pb-16 pt-10">
                    {withLayout ? (
                        <ProjectRequestsBriefDraftSection
                            briefDraft={briefDraft}
                            setBriefDraft={setBriefDraft}
                            parseTechnologies={parseTechnologies}
                            onContinueToProjectForm={handleContinueToProjectForm}
                            onCopilotApply={handleCopilotApply}
                            locale={locale}
                            t={t}
                        />
                    ) : null}

                    <ProjectRequestsProjectList
                        projects={projects}
                        withLayout={withLayout}
                        dateLocale={dateLocale}
                        locale={locale}
                        highlightedMilestoneId={highlightedMilestoneId}
                        releasingId={releasingId}
                        responding={responding}
                        t={t}
                        onCreateProject={handleCreateProject}
                        getProjectMilestones={getProjectMilestones}
                        getProjectProviders={getProjectProviders}
                        getProviderMilestones={getProviderMilestones}
                        getProviderId={getProviderId}
                        getMilestoneId={getMilestoneId}
                        getStatusBadge={getStatusBadge}
                        getMilestoneStatusBadge={getMilestoneStatusBadge}
                        openContractWorkspace={openContractWorkspace}
                        handleBudgetResponse={handleBudgetResponse}
                        openBudgetRejectionDialog={openBudgetRejectionDialog}
                        handleMilestoneProposalResponse={handleMilestoneProposalResponse}
                        openMilestoneProposalResponseDialog={openMilestoneProposalResponseDialog}
                        openReplacementSuggestionsForMilestone={openReplacementSuggestionsForMilestone}
                        handleReleaseFunds={handleReleaseFunds}
                    />
                </div>
            </section>

            {/*<Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>*/}
            {/*    <DialogContent className="max-w-md mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-0 overflow-hidden flex flex-col max-h-[90vh]">*/}
            {/*        <div className="bg-[#0B1C2D] p-6 text-white">*/}
            {/*            <div className="flex items-center space-x-3 mb-4">*/}
            {/*                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">*/}
            {/*                    <Shield className="w-6 h-6 text-[#1BC47D]" />*/}
            {/*                </div>*/}
            {/*                <div>*/}
            {/*                    <DialogTitle className="text-xl font-bold text-white">*/}
            {/*                        {t('client.project_requests.checkout.title')}*/}
            {/*                    </DialogTitle>*/}
            {/*                    <DialogDescription className="text-sm text-blue-100">*/}
            {/*                        {t('client.project_requests.checkout.description')}*/}
            {/*                    </DialogDescription>*/}
            {/*                </div>*/}
            {/*            </div>*/}

            {/*            <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">*/}
            {/*                <div className="flex items-center justify-between text-sm">*/}
            {/*                    <span className="text-blue-100">{t('client.project_requests.checkout.project_label')}</span>*/}
            {/*                    <span className="font-semibold">{selectedProject?.title}</span>*/}
            {/*                </div>*/}
            {/*                <div className="flex items-center justify-between text-sm mt-2">*/}
            {/*                    <span className="text-blue-100">{t('client.project_requests.checkout.project_value')}</span>*/}
            {/*                    <span className="font-bold text-lg">*/}
            {/*                        {displayedValueAmount != null ? (*/}
            {/*                            <PriceDisplay value={displayedValueAmount} />*/}
            {/*                        ) : (*/}
            {/*                            '-'*/}
            {/*                        )}*/}
            {/*                    </span>*/}
            {/*                </div>*/}
            {/*                <div className="flex items-center justify-between text-sm mt-2">*/}
            {/*                    <span className="text-blue-100">{t('client.project_requests.checkout.platform_fee')}</span>*/}
            {/*                    <span className="font-bold text-lg">*/}
            {/*                        {displayedFeeAmount != null ? (*/}
            {/*                            <PriceDisplay value={displayedFeeAmount} />*/}
            {/*                        ) : (*/}
            {/*                            '-'*/}
            {/*                        )}*/}
            {/*                    </span>*/}
            {/*                </div>*/}
            {/*                <div className="flex items-center justify-between text-sm mt-2">*/}
            {/*                    <span className="text-blue-100">{t('client.project_requests.checkout.total_value')}</span>*/}
            {/*                    <span className="font-bold text-lg">*/}
            {/*                        {displayedTotalAmount != null ? (*/}
            {/*                            <PriceDisplay value={displayedTotalAmount} />*/}
            {/*                        ) : (*/}
            {/*                            '-'*/}
            {/*                        )}*/}
            {/*                    </span>*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        </div>*/}

            {/*        <div className="p-6 space-y-6 overflow-y-auto flex-1">*/}
            {/*            <div className="text-center">*/}
            {/*                <h3 className="font-semibold text-lg mb-2 text-[#0B1C2D] dark:text-[#E6EDF3]">*/}
            {/*                    {t('client.project_requests.checkout.how_it_works.title')}*/}
            {/*                </h3>*/}
            {/*                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">*/}
            {/*                    <div className="text-center">*/}
            {/*                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 dark:bg-[rgba(27,196,125,0.12)]">*/}
            {/*                            <span className="font-bold text-[#1BC47D]">1</span>*/}
            {/*                        </div>*/}
            {/*                        <p className="text-slate-500 dark:text-[#A3ADC2]">{t('client.project_requests.checkout.how_it_works.step_1')}</p>*/}
            {/*                    </div>*/}
            {/*                    <div className="text-center">*/}
            {/*                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 dark:bg-[rgba(27,196,125,0.12)]">*/}
            {/*                            <span className="font-bold text-[#1BC47D]">2</span>*/}
            {/*                        </div>*/}
            {/*                        <p className="text-slate-500 dark:text-[#A3ADC2]">{t('client.project_requests.checkout.how_it_works.step_2')}</p>*/}
            {/*                    </div>*/}
            {/*                    <div className="text-center">*/}
            {/*                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 dark:bg-[rgba(27,196,125,0.12)]">*/}
            {/*                            <span className="font-bold text-[#1BC47D]">3</span>*/}
            {/*                        </div>*/}
            {/*                        <p className="text-slate-500 dark:text-[#A3ADC2]">{t('client.project_requests.checkout.how_it_works.step_3')}</p>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            </div>*/}

            {/*            <div className="bg-emerald-50 dark:bg-[rgba(27,196,125,0.1)] border border-emerald-100 dark:border-[#1E2A3D] rounded-lg p-4">*/}
            {/*                <div className="flex items-start space-x-3">*/}
            {/*                    <CheckCircle className="w-5 h-5 text-[#1BC47D] mt-0.5" />*/}
            {/*                    <div className="text-sm">*/}
            {/*                        <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3] mb-1">*/}
            {/*                            {t('client.project_requests.checkout.guarantee.title')}*/}
            {/*                        </div>*/}
            {/*                        <p className="text-slate-500 dark:text-[#A3ADC2]">*/}
            {/*                            {t('client.project_requests.checkout.guarantee.description')}*/}
            {/*                        </p>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            </div>*/}

            {/*            {clientSecret && (*/}
            {/*                <div className="min-h-[400px]"> /!* Oferim o înălțime minimă pentru a evita layout shift *!/*/}
            {/*                    <EmbeddedCheckoutProvider*/}
            {/*                        stripe={stripePromise}*/}
            {/*                        options={{ clientSecret, onComplete: handleCheckoutComplete }}*/}
            {/*                    >*/}
            {/*                        <EmbeddedCheckout className="w-full" />*/}
            {/*                    </EmbeddedCheckoutProvider>*/}
            {/*                </div>*/}
            {/*            )}*/}

            {/*             {errorMessage && (*/}
            {/*                <Alert variant="destructive">*/}
            {/*                    <AlertCircle className="h-4 w-4" />*/}
            {/*                    <AlertDescription>{errorMessage}</AlertDescription>*/}
            {/*                </Alert>*/}
            {/*            )}*/}

            {/*            {success && (*/}
            {/*                <Alert className="border-emerald-200 bg-emerald-50">*/}
            {/*                    <CheckCircle className="h-4 w-4 text-[#1BC47D]" />*/}
            {/*                    <AlertDescription className="text-emerald-800">*/}
            {/*                        {t('client.project_requests.checkout.success')}*/}
            {/*                    </AlertDescription>*/}
            {/*                </Alert>*/}
            {/*            )}*/}

            {/*            <div className="flex flex-col gap-3 sm:flex-row">*/}
            {/*                <Button*/}
            {/*                    type="button"*/}
            {/*                    variant="outline"*/}
            {/*                    onClick={() => setCheckoutDialogOpen(false)}*/}
            {/*                    className="px-6 border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"*/}
            {/*                >*/}
            {/*                    {t('client.project_requests.checkout.cancel')}*/}
            {/*                </Button>*/}
            {/*            </div>*/}

            {/*            <div className="text-xs text-center text-slate-500 dark:text-[#A3ADC2] pt-4 border-t border-slate-100 dark:border-[#1E2A3D]">*/}
            {/*                <div className="flex items-center justify-center space-x-4">*/}
            {/*                    <div className="flex items-center space-x-1">*/}
            {/*                        <Shield className="w-3 h-3" />*/}
            {/*                        <span>{t('client.project_requests.checkout.footer.ssl')}</span>*/}
            {/*                    </div>*/}
            {/*                    <div className="flex items-center space-x-1">*/}
            {/*                        <CheckCircle className="w-3 h-3" />*/}
            {/*                        <span>{t('client.project_requests.checkout.footer.pci')}</span>*/}
            {/*                    </div>*/}
            {/*                    <div className="flex items-center space-x-1">*/}
            {/*                        <Globe className="w-3 h-3" />*/}
            {/*                        <span>{t('client.project_requests.checkout.footer.stripe')}</span>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </DialogContent>*/}
            {/*</Dialog>*/}

            <ProjectRequestsDialogs
                t={t}
                locale={locale}
                replacementDialogOpen={openReplacementDialog}
                onReplacementDialogOpenChange={setOpenReplacementDialog}
                replacementContext={replacementContext}
                clearReplacementDialog={clearReplacementDialog}
                loadingReplacementSuggestions={loadingReplacementSuggestions}
                replacementSuggestions={replacementSuggestions}
                reassigningProviderId={reassigningProviderId}
                onReassignMilestoneProvider={(providerId) => {
                    void handleReassignMilestoneProvider(providerId);
                }}
                budgetRejectionDialog={budgetRejectionDialog}
                budgetRejectionReason={budgetRejectionReason}
                setBudgetRejectionReason={setBudgetRejectionReason}
                budgetRejectionError={budgetRejectionError}
                setBudgetRejectionError={setBudgetRejectionError}
                clearBudgetRejectionDialog={clearBudgetRejectionDialog}
                onSubmitBudgetRejection={submitBudgetRejection}
                milestoneProposalResponseDialog={milestoneProposalResponseDialog}
                milestoneProposalResponseReason={milestoneProposalResponseReason}
                setMilestoneProposalResponseReason={setMilestoneProposalResponseReason}
                milestoneProposalResponseError={milestoneProposalResponseError}
                setMilestoneProposalResponseError={setMilestoneProposalResponseError}
                clearMilestoneProposalResponseDialog={clearMilestoneProposalResponseDialog}
                onSubmitMilestoneProposalRejection={submitMilestoneProposalRejection}
                responding={responding}
                contractDialogContext={contractDialogContext}
                onContractDialogOpenChange={handleContractDialogOpenChange}
            />

            {withLayout ? <Footer /> : null}
        </div>
    );
}
