"use client";

import { useEffect, useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/lib/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    Code,
    DollarSign,
    Eye,
    Globe,
    Loader2,
    MapPin,
    MessageSquare,
    Shield,
    Star,
    Target,
    User,
    XCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { ensureEcho } from '@/lib/echo';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ro } from 'date-fns/locale';
import { MuiIcon } from "@/components/MuiIcons";
import { PriceDisplay } from '@/components/PriceDisplay';
import RapydCheckoutButton from "@/components/RapydCheckoutButton";
import BriefCopilot from '@/components/projects/BriefCopilot';
import { AI_BRIEF_DRAFT_STORAGE_KEY, type AiBriefFormDraft } from '@/types/ai';



type ClientProjectRequestsProps = {
    withLayout?: boolean;
};

interface ContractClauses {
    category: string;
    identifier: string;
    priority: number;
    selection: string;
    text: string;
    title: string;
}

interface ContractMeta {
    client_country: string;
    client_country_code: string;
    client_legal_system: string;
    freelancer_country: string;
    freelancer_country_code: string;
    freelancer_legal_system: string;
}

interface ContractResponse {
    clauses: ContractClauses[];
    meta: ContractMeta[];
}

const createEmptyBriefDraft = (): AiBriefFormDraft => ({
    title: '',
    description: '',
    budget: '',
    budgetType: 'FIXED',
    deadline: '',
    technologies: [],
    team_structure: [],
});

export default function ClientProjectRequests({ withLayout = true }: ClientProjectRequestsProps) {
    const { user, loading, userLoading } = useAuth();
    const locale = useLocale();
    const t = useTranslations();
    const dateLocale = locale?.toLowerCase().startsWith('en') ? enUS : ro;
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [responding, setResponding] = useState<string | null>(null);
    const router = useRouter();
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null);
    const [releasingId, setReleasingId] = useState<string | null>(null);
    const [contractResponse, setContractResponse] = useState<ContractResponse | null>(null);
    const [openContractDialog, setOpenContractDialog] = useState(false);
    const [openReplacementDialog, setOpenReplacementDialog] = useState(false);
    const [replacementContext, setReplacementContext] = useState<{
        projectId: string;
        milestoneId: string;
        milestoneTitle: string;
        excludeProviderId?: string;
    } | null>(null);
    const [replacementSuggestions, setReplacementSuggestions] = useState<any[]>([]);
    const [loadingReplacementSuggestions, setLoadingReplacementSuggestions] = useState(false);
    const [reassigningProviderId, setReassigningProviderId] = useState<string | null>(null);
    const [briefDraft, setBriefDraft] = useState<AiBriefFormDraft>(createEmptyBriefDraft);
    const roleSlugs = [
        ...(user?.role_slugs ?? []),
        ...((user?.roles ?? []).map((role: any) => role?.slug).filter(Boolean)),
    ]
        .map((slug) => String(slug).toLowerCase())
        .filter(Boolean);
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
    const normalizeStatusValue = (value: unknown, fallback = '') =>
        String(value ?? fallback).trim().toUpperCase();
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
    const normalizePositiveBudget = (value: unknown): number | null => {
        const numeric = toFiniteNumber(value);
        if (numeric === null || numeric <= 0) return null;
        return numeric;
    };

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
            };
        });
    }, [getProjectMilestones, getProviderId]);

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

            setProjects(response.projects || []);
        } catch (error: any) {
            console.error('Failed to load projects:', error);
            setProjects([]);
            toast.error(t('client.project_requests.errors.generic', { message: error?.message ?? 'Unknown error' }));
        } finally {
            setLoadingProjects(false);
        }
    }, [t]);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;
        let channel:
            | {
                notification: (callback: (notification: any) => void) => void;
                stopListening: (event: string) => void;
            }
            | null = null;

        const handler = (notification: {
            type?: string;
            data?: {
                type?: string;
                projectId?: string | number;
                milestoneId?: string | number;
                milestone_id?: string | number;
                payload?: {
                    projectId?: string | number;
                    milestoneId?: string | number;
                    milestone_id?: string | number;
                    status?: string;
                };
            };
            projectId?: string | number;
            milestoneId?: string | number;
            milestone_id?: string | number;
            payload?: {
                projectId?: string | number;
                milestoneId?: string | number;
                milestone_id?: string | number;
                status?: string;
            };
        }) => {
            const rawType = String(notification?.type ?? '').toLowerCase();
            const declaredType = String(notification?.data?.type ?? '').toLowerCase();
            const isBudgetAcceptedByProvider =
                declaredType === 'budget.accepted.by_provider' ||
                rawType.includes('provideracceptedclientbudget');
            const projectId =
                notification?.data?.projectId ??
                notification?.projectId ??
                notification?.data?.payload?.projectId ??
                notification?.payload?.projectId;
            const milestoneId =
                notification?.data?.milestoneId ??
                notification?.data?.milestone_id ??
                notification?.milestoneId ??
                notification?.milestone_id ??
                notification?.data?.payload?.milestoneId ??
                notification?.data?.payload?.milestone_id ??
                notification?.payload?.milestoneId ??
                notification?.payload?.milestone_id;
            const payloadStatus = String(
                notification?.data?.payload?.status ??
                notification?.payload?.status ??
                ''
            ).toUpperCase();
            const hasProjectContext = Boolean(projectId || milestoneId);
            const isProjectEvent =
                declaredType.startsWith('project.') ||
                declaredType.startsWith('budget.') ||
                declaredType.startsWith('milestone.') ||
                declaredType.includes('milestone');
            const isProjectStatusUpdatedEvent =
                declaredType === 'project.status.updated' ||
                rawType.includes('projectstatusupdated');
            const isProviderFinishedNotification =
                isProjectStatusUpdatedEvent && payloadStatus === 'FINISHED';
            const isRapydProjectEvent =
                declaredType.startsWith('rapyd.') && hasProjectContext;
            const isFallbackProjectEvent = !declaredType && hasProjectContext;

            if (
                !isProjectEvent &&
                !isProjectStatusUpdatedEvent &&
                !isProviderFinishedNotification &&
                !isBudgetAcceptedByProvider &&
                !isRapydProjectEvent &&
                !isFallbackProjectEvent
            ) return;
            loadProjects();
        };

        void (async () => {
            const echo = await ensureEcho();
            if (!echo || cancelled) return;
            const privateChannel = echo.private(`App.Models.User.${user.id}`);
            channel = privateChannel;
            privateChannel.notification(handler);
        })();

        return () => {
            cancelled = true;
            channel?.stopListening('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated');
        };
    }, [user?.id, loadProjects]);



    useEffect(() => {
        if (userLoading) return;

        if (!user) {
            // router.push('/auth/signin');
            return;
        }

        if (hasRoleInfo && !isClientRole) {
            if (withLayout) {
                router.push('/dashboard');
            }
            return;
        }

        loadProjects();
    }, [user, userLoading, router, loadProjects, hasRoleInfo, isClientRole, withLayout]);



    const handleBudgetResponse = useCallback(async (
        projectId: string,
        providerId: string,
        response: 'ACCEPTED' | 'REJECTED'
    ) => {
        setResponding(`${projectId}-${providerId}`);
        try {
            await apiClient.respondToBudgetProposal(
                projectId,
                providerId,
                {
                    response,
                    ...(response === 'REJECTED'
                        ? { reason: 'Budget proposal rejected by client' }
                        : {}),
                },
                locale
            );
            await loadProjects();
            toast.success(
                response === 'ACCEPTED'
                    ? t('client.project_requests.budget.approved')
                    : t('client.project_requests.budget.rejected')
            );
        } catch (error: any) {
            toast.error(t('client.project_requests.errors.generic', { message: error.message }));
        } finally {
            setResponding(null);
        }
    }, [loadProjects, locale, t]);

    const generateContract = async (projectId: string, clientId: string, providerId: string) => {
        const response = await apiClient.generateProjectContract(projectId, clientId, providerId);
        setContractResponse(response);
        setOpenContractDialog(true);
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

    const getStatusBadge = (status: string) => {
        const normalizedStatus = normalizeStatusValue(status);
        switch (normalizedStatus) {
            case 'PENDING':
                return (
                    <Badge className="bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.pending')}
                    </Badge>
                );
            case 'WORK_IN_PROGRESS':
                return (
                    <Badge className="bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:border-sky-500/30">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.work_in_progress')}
                    </Badge>
                );
            case 'AWAITING_BUDGET_APPROVAL':
                return (
                    <Badge className="bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.awaiting_budget_approval')}
                    </Badge>
                );
            case 'ACCEPTED':
                return (
                    <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.accepted')}
                    </Badge>
                );
            case 'REJECTED':
                return (
                    <Badge className="bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-500/30">
                        <XCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.rejected')}
                    </Badge>
                );
            case 'NEW_PROPOSE':
            case 'PROPOSED':
                return (
                    <Badge className="bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:border-sky-500/30">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.budget_proposed')}
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

    const loadingClassName = withLayout
        ? "min-h-screen bg-white dark:bg-[#070C14] flex flex-col items-center justify-center"
        : "py-16 flex flex-col items-center justify-center";

    if (loading || userLoading || loadingProjects) {
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
                        <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
                            <Card className="glass-card border-transparent shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-[#0B1C2D] dark:text-[#E6EDF3]">
                                    {t('client.project_requests.brief_copilot.draft.title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('client.project_requests.brief_copilot.draft.description')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="brief-draft-title">
                                        {t('client.project_requests.brief_copilot.draft.project_title')}
                                    </Label>
                                    <Input
                                        id="brief-draft-title"
                                        value={briefDraft.title}
                                        onChange={(event) =>
                                            setBriefDraft((prev) => ({ ...prev, title: event.target.value }))
                                        }
                                        placeholder={t('client.project_requests.brief_copilot.draft.project_title_placeholder')}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="brief-draft-description">
                                        {t('client.project_requests.brief_copilot.draft.project_description')}
                                    </Label>
                                    <Textarea
                                        id="brief-draft-description"
                                        value={briefDraft.description}
                                        onChange={(event) =>
                                            setBriefDraft((prev) => ({ ...prev, description: event.target.value }))
                                        }
                                        rows={5}
                                        placeholder={t('client.project_requests.brief_copilot.draft.project_description_placeholder')}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="brief-draft-budget">
                                            {t('client.project_requests.brief_copilot.draft.budget')}
                                        </Label>
                                        <Input
                                            id="brief-draft-budget"
                                            value={briefDraft.budget}
                                            type="number"
                                            onChange={(event) =>
                                                setBriefDraft((prev) => ({ ...prev, budget: event.target.value }))
                                            }
                                            placeholder={t('client.project_requests.brief_copilot.draft.budget_placeholder')}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="brief-draft-technologies">
                                            {t('client.project_requests.brief_copilot.draft.technologies')}
                                        </Label>
                                        <Input
                                            id="brief-draft-technologies"
                                            value={briefDraft.technologies.join(', ')}
                                            onChange={(event) =>
                                                setBriefDraft((prev) => ({
                                                    ...prev,
                                                    technologies: parseTechnologies(event.target.value),
                                                }))
                                            }
                                            placeholder={t('client.project_requests.brief_copilot.draft.technologies_placeholder')}
                                        />
                                    </div>
                                </div>

                                {briefDraft.team_structure && briefDraft.team_structure.length > 0 ? (
                                    <div className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                                            {t('client.project_requests.brief_copilot.team_title')}
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {briefDraft.team_structure.map((member, index) => (
                                                <div
                                                    key={`${member.role}-${index}`}
                                                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-[#1E2A3D] dark:bg-[#0F1827]"
                                                >
                                                    <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                        {member.role}
                                                        {member.count ? ` × ${member.count}` : ''}
                                                    </div>
                                                    {member.estimated_cost !== undefined ? (
                                                        <div className="text-emerald-700 dark:text-emerald-300">
                                                            <PriceDisplay value={member.estimated_cost} />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                                        {t('client.project_requests.brief_copilot.draft.empty')}
                                    </p>
                                )}

                                <Button type="button" onClick={handleContinueToProjectForm} className="w-full btn-primary">
                                    {t('client.project_requests.brief_copilot.draft.open_form')}
                                </Button>
                            </CardContent>
                        </Card>

                            <BriefCopilot locale={locale} onApply={handleCopilotApply} />
                        </div>
                    ) : null}

                    <div className={withLayout ? "mt-8" : ""}>
                        {projects.length === 0 ? (
                            <Card className="glass-card border-transparent shadow-sm">
                                <CardContent className="text-center py-12">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-[rgba(27,196,125,0.12)] flex items-center justify-center mx-auto mb-4">
                                        <Target className="w-8 h-8 text-[#1BC47D]" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2 text-[#0B1C2D] dark:text-[#E6EDF3]">
                                        {t('client.project_requests.empty.title')}
                                    </h3>
                                    <p className="text-slate-500 dark:text-[#A3ADC2] mb-6">
                                        {t('client.project_requests.empty.description')}
                                    </p>
                                    <Button onClick={() => router.push('/projects/new')} className="btn-primary">
                                        <Target className="w-4 h-4 mr-2" />
                                        {t('client.project_requests.empty.cta')}
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                            {projects.map((project) => {
                                const hasAnyMilestones = getProjectMilestones(project).length > 0;
                                const canReleaseFull = !hasAnyMilestones && project.status === 'FINISHED';
                                const projectProviders = getProjectProviders(project);
                                const existingServices = Array.isArray(project?.existing_services) ? project.existing_services : [];
                                const customServices = Array.isArray(project?.custom_services) ? project.custom_services : [];
                                const serviceCategories = Array.from(
                                    new Map(
                                        existingServices
                                            .map((service: any) => service?.category)
                                            .filter((category: any) => Boolean(category?.id ?? category?.name))
                                            .map((category: any) => [String(category?.id ?? category?.name), category])
                                    ).values()
                                );

                                return (
                                    <Card key={project.id} className="glass-card border-transparent shadow-sm">
                                        <CardHeader className="space-y-4">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div>
                                                    <CardTitle className="text-2xl text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                        {project.title}
                                                    </CardTitle>
                                                    <CardDescription className="mt-2 text-slate-500 dark:text-[#A3ADC2] line-clamp-2">
                                                        {project.description}
                                                    </CardDescription>
                                                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500 dark:text-[#A3ADC2]">
                                                        <div className="flex items-center gap-1">
                                                            <DollarSign className="w-4 h-4 text-[#1BC47D]" />
                                                            <span>
                                                                {t('client.project_requests.project.total_budget')}{' '}
                                                                {project.budget.amount != null ? (
                                                                    <PriceDisplay value={project.budget.amount} />
                                                                ) : (
                                                                    '-'
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4 text-[#1BC47D]" />
                                                            <span>
                                                                {t('client.project_requests.project.created')} {formatDistanceToNow(new Date(project.created_at), {
                                                                    addSuffix: true,
                                                                    locale: dateLocale
                                                                })}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <User className="w-4 h-4 text-[#1BC47D]" />
                                                            <span>{t('client.project_requests.project.selected_providers', { count: projectProviders.length || 0 })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {serviceCategories.map((category: any) => (
                                                        <Badge
                                                            key={String(category?.id ?? category?.name)}
                                                            className="bg-emerald-50 text-[#0B1C2D] border border-emerald-100 dark:bg-[rgba(27,196,125,0.12)] dark:text-[#E6EDF3] dark:border-[#1E2A3D]"
                                                        >
                                                            {category.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-6">
                                            {(existingServices.length > 0 || customServices.length > 0) && (
                                                    <div className="rounded-xl border border-slate-100 bg-white/80 px-4 py-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                                                        <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3] mb-2">
                                                            {t('client.project_requests.project.technologies')}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {existingServices.map((tech: any, index: number) => (
                                                                <Badge
                                                                    key={index}
                                                                    variant="outline"
                                                                    className="text-xs border-slate-200 text-slate-600 dark:border-[#1E2A3D] dark:text-[#A3ADC2]"
                                                                >
                                                                    <Code className="w-3 h-3 mr-1 text-[#1BC47D]" />
                                                                    {tech.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                            <div>
                                                <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3] mb-3">
                                                    {t('client.project_requests.providers.title')}
                                                </div>
                                                <div className="space-y-3">
                                                    {projectProviders.map((provider: any) => {
                                                        const providerMilestones = getProviderMilestones(project, provider);
                                                        const providerId = getProviderId(provider);
                                                        const milestoneStatusFor = (entry: any) =>
                                                            normalizeStatusValue(entry?.status, '');
                                                        const milestonePaymentStatusFor = (entry: any) => {
                                                            const explicitStatus = normalizeStatusValue(
                                                                entry?.payment_status ?? entry?.paymentStatus,
                                                                ''
                                                            );
                                                            if (explicitStatus) {
                                                                return explicitStatus;
                                                            }

                                                            const fallbackStatus = normalizeStatusValue(entry?.status, 'PENDING');
                                                            if (fallbackStatus === 'REJECTED') return 'REJECTED';
                                                            if (
                                                                fallbackStatus === 'ESCROW' ||
                                                                fallbackStatus === 'BLOCKED' ||
                                                                fallbackStatus.includes('ESCROW') ||
                                                                fallbackStatus.includes('BLOCK')
                                                            ) {
                                                                return 'ESCROW';
                                                            }
                                                            if (fallbackStatus === 'PAID' || fallbackStatus === 'RELEASED') {
                                                                return 'PAID';
                                                            }
                                                            return 'PENDING';
                                                        };
                                                        const isPendingPaymentStatus = (entry: any) =>
                                                            milestonePaymentStatusFor(entry).startsWith('PENDING');
                                                        const milestoneBudgetStatusFor = (entry: any) =>
                                                            normalizeStatusValue(
                                                                entry?.budget_status ??
                                                                entry?.budgetStatus ??
                                                                '',
                                                                ''
                                                            );
                                                        const providerMilestoneBudgetStatuses = providerMilestones
                                                            .map((entry: any) => milestoneBudgetStatusFor(entry))
                                                            .filter(Boolean);
                                                        const providerLineBudgetStatuses = (Array.isArray(project?.project_lines)
                                                            ? project.project_lines
                                                            : []
                                                        )
                                                            .filter((line: any) => {
                                                                const lineProviders = Array.isArray(line?.providers) ? line.providers : [];
                                                                const hasDirectProviderMatch = lineProviders.some(
                                                                    (lineProvider: any) => getProviderId(lineProvider) === providerId
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
                                                                    return assignedProviderId !== null && String(assignedProviderId) === providerId;
                                                                });
                                                            })
                                                            .map((line: any) =>
                                                                normalizeStatusValue(
                                                                    line?.budget_status ?? line?.budgetStatus ?? '',
                                                                    ''
                                                                )
                                                            )
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
                                                            return normalizeStatusValue(
                                                                provider?.budget_status ?? provider?.budgetStatus ?? 'PENDING',
                                                                'PENDING'
                                                            );
                                                        })();
                                                        const isMilestoneBudgetApproved = (entry: any) => {
                                                            const milestoneBudgetStatus = milestoneBudgetStatusFor(entry);
                                                            if (milestoneBudgetStatus) {
                                                                return milestoneBudgetStatus === 'ACCEPTED';
                                                            }
                                                            return providerBudgetStatus === 'ACCEPTED';
                                                        };
                                                        const getAssignedProviderIdForMilestone = (entry: any) =>
                                                            entry?.assigned_provider_id ??
                                                            entry?.assignedProviderId ??
                                                            entry?.providerId ??
                                                            entry?.provider_id ??
                                                            null;
                                                        const isMilestoneOwnedByCurrentProvider = (entry: any) => {
                                                            if (!providerId) return false;
                                                            const assignedProviderId = getAssignedProviderIdForMilestone(entry);
                                                            if (assignedProviderId === null || assignedProviderId === undefined || String(assignedProviderId) === '') {
                                                                return true;
                                                            }
                                                            return String(assignedProviderId) === providerId;
                                                        };
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
                                                        const providerOwnedMilestones = providerMilestones.filter(isMilestoneOwnedByCurrentProvider);
                                                        const nextSecurizableMilestone = (() => {
                                                            for (let milestoneIndex = 0; milestoneIndex < providerOwnedMilestones.length; milestoneIndex += 1) {
                                                                const currentMilestone = providerOwnedMilestones[milestoneIndex];
                                                                const currentStatus = milestoneStatusFor(currentMilestone);
                                                                const isStatusEligibleForSecurePayment = currentStatus === 'PENDING';
                                                                if (
                                                                    !isStatusEligibleForSecurePayment ||
                                                                    !isPendingPaymentStatus(currentMilestone) ||
                                                                    !isMilestoneBudgetApproved(currentMilestone)
                                                                ) {
                                                                    continue;
                                                                }

                                                                if (milestoneIndex === 0) {
                                                                    return currentMilestone;
                                                                }

                                                                const previousMilestone = providerOwnedMilestones[milestoneIndex - 1];
                                                                if (isMilestonePaidStatus(previousMilestone)) {
                                                                    return currentMilestone;
                                                                }

                                                                return null;
                                                            }
                                                            return null;
                                                        })();
                                                        const rawNextSecurizableMilestoneId = nextSecurizableMilestone
                                                            ? getMilestoneId(nextSecurizableMilestone)
                                                            : null;
                                                        const nextSecurizableMilestoneId =
                                                            rawNextSecurizableMilestoneId !== null && rawNextSecurizableMilestoneId !== undefined
                                                                ? String(rawNextSecurizableMilestoneId)
                                                                : null;
                                                        const providerDisplayStatus = providerBudgetStatus;
                                                        const providerAllocatedBudget = (() => {
                                                            const directBudget = normalizePositiveBudget(
                                                                provider?.allocatedBudget ??
                                                                provider?.allocated_budget ??
                                                                provider?.pivot?.allocated_budget
                                                            );
                                                            if (directBudget !== null) {
                                                                return directBudget;
                                                            }

                                                            const milestonesTotal = providerOwnedMilestones.reduce((sum: number, milestone: any) => {
                                                                const amount = toFiniteNumber(milestone?.amount);
                                                                if (amount === null || amount <= 0) return sum;
                                                                return sum + amount;
                                                            }, 0);

                                                            return milestonesTotal > 0 ? milestonesTotal : null;
                                                        })();
                                                        const providerMilestonesProposedTotal = providerOwnedMilestones.reduce((sum: number, milestone: any) => {
                                                            const proposedAmount = normalizePositiveBudget(
                                                                milestone?.proposed_amount ??
                                                                milestone?.proposedAmount
                                                            );
                                                            if (proposedAmount === null) return sum;
                                                            return sum + proposedAmount;
                                                        }, 0);
                                                        const providerProposedBudget =
                                                            normalizePositiveBudget(
                                                                provider?.proposedBudget ??
                                                                provider?.proposed_budget ??
                                                                provider?.pivot?.provider_budgets
                                                            ) ??
                                                            (providerMilestonesProposedTotal > 0
                                                                ? providerMilestonesProposedTotal
                                                                : null);

                                                        return (
                                                            <div
                                                                key={provider.id}
                                                                className="border border-slate-100 rounded-xl p-4 bg-white/70 dark:border-[#1E2A3D] dark:bg-[#0B1220]"
                                                            >
                                                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                                    <div className="flex items-start gap-3">
                                                                        <Avatar className="w-11 h-11">
                                                                            <AvatarImage src={provider.avatar} />
                                                                            <AvatarFallback>
                                                                                {provider.firstName?.[0]}{provider.lastName?.[0]}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                                                {provider.firstName} {provider.lastName}
                                                                            </div>
                                                                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                                                                <div className="flex items-center gap-1">
                                                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                                                    <span>{provider.rating || 0}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <MapPin className="w-3 h-3 text-[#1BC47D]" />
                                                                                    <span>{provider.location || t('client.project_requests.providers.location_fallback')}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mt-2">
                                                                                {provider.services?.length > 0 && provider.services.map((service: any, index: number) => (
                                                                                    <Badge
                                                                                        key={index}
                                                                                        variant="outline"
                                                                                        className="text-xs border-slate-200 "
                                                                                    >
                                                                                        <MuiIcon icon={service.categoryIcon} size={20} className="mr-1" />
                                                                                        {service.name}
                                                                                    </Badge>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-left lg:text-right">
                                                                        {getStatusBadge(providerDisplayStatus)}
                                                                        <div className="text-sm text-slate-500 dark:text-[#A3ADC2] mt-2">
                                                                            {t('client.project_requests.providers.allocated')}{' '}
                                                                            {providerAllocatedBudget != null ? (
                                                                                <PriceDisplay value={providerAllocatedBudget} />
                                                                            ) : (
                                                                                '-'
                                                                            )}
                                                                        </div>
                                                                        {project.status === 'ACCEPTED' && (
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => generateContract(project.id, project.client_id, provider.id)}
                                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                                            >
                                                                                Contract
                                                                            </Button>
                                                                        )}
                                                                        <div>

                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {providerBudgetStatus === 'PROPOSED' && (
                                                                    <Alert className="mt-4 border-emerald-200 bg-emerald-50 dark:border-[#1E2A3D] dark:bg-[rgba(27,196,125,0.1)]">
                                                                        <DollarSign className="h-4 w-4 text-[#1BC47D]" />
                                                                        <AlertDescription>
                                                                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                                                                <div>
                                                                                    <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                                                        {t('client.project_requests.budget.new_proposal')}
                                                                                    </div>
                                                                                    <div className="text-lg font-bold text-[#1BC47D]">
                                                                                        {providerProposedBudget != null ? (
                                                                                            <PriceDisplay value={providerProposedBudget} />
                                                                                        ) : (
                                                                                            '-'
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                                                                                        {t('client.project_requests.budget.original')}{' '}
                                                                                        {providerAllocatedBudget != null ? (
                                                                                            <PriceDisplay value={providerAllocatedBudget} />
                                                                                        ) : (
                                                                                            '-'
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        onClick={() => {
                                                                                            handleBudgetResponse(
                                                                                                project.id,
                                                                                                provider.id,
                                                                                                'ACCEPTED'
                                                                                            );
                                                                                        }}
                                                                                        disabled={responding === `${project.id}-${provider.id}` || providerBudgetStatus !== 'PROPOSED'}
                                                                                        className="btn-primary"
                                                                                    >
                                                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                                                        {t('client.project_requests.budget.approve')}
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() => {
                                                                                            handleBudgetResponse(
                                                                                                project.id,
                                                                                                provider.id,
                                                                                                'REJECTED'
                                                                                            );
                                                                                        }}
                                                                                        disabled={responding === `${project.id}-${provider.id}` || providerBudgetStatus !== 'PROPOSED'}
                                                                                        className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"
                                                                                    >
                                                                                        <XCircle className="w-4 h-4 mr-1" />
                                                                                        {t('client.project_requests.budget.reject')}
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </AlertDescription>
                                                                    </Alert>
                                                                )}

                                                                {provider.respondedAt && (
                                                                    <div className="mt-3 text-xs text-slate-400 dark:text-[#A3ADC2]">
                                                                        {t('client.project_requests.providers.response_received')} {formatDistanceToNow(new Date(provider.respondedAt), {
                                                                            addSuffix: true,
                                                                            locale: dateLocale
                                                                        })}
                                                                    </div>
                                                                )}

                                                                <div className="space-y-2 mt-2">
                                                                    {providerOwnedMilestones.map((milestone: any, index: number) => {
                                                                        const milestoneId = getMilestoneId(milestone);
                                                                        const milestoneStatus = milestoneStatusFor(milestone);
                                                                        const milestonePaymentStatus = milestonePaymentStatusFor(milestone);
                                                                        const hasMilestoneExceededEscrowPhase = isMilestoneBeyondEscrowPhase(milestone);
                                                                        const milestoneIdKey =
                                                                            milestoneId !== null && milestoneId !== undefined
                                                                                ? String(milestoneId)
                                                                                : null;
                                                                        const assignedProviderIdForMilestone = getAssignedProviderIdForMilestone(milestone);
                                                                        const isMilestoneUnassigned =
                                                                            assignedProviderIdForMilestone === null ||
                                                                            assignedProviderIdForMilestone === undefined ||
                                                                            String(assignedProviderIdForMilestone) === '';

                                                                        // 1. Logica pentru Release (existentă)
                                                                        const canReleaseMilestone =
                                                                            (milestoneStatus === 'FINISHED' || milestoneStatus === 'COMPLETED') &&
                                                                            milestoneId;

                                                                        // 2. Logica pentru Secure Payment (sequential per provider)
                                                                        // Se poate securiza doar următorul milestone PENDING al providerului,
                                                                        // iar acesta devine eligibil după finalizarea milestone-ului anterior.
                                                                        const showSecurePaymentBtn =
                                                                            !hasMilestoneExceededEscrowPhase &&
                                                                            isPendingPaymentStatus(milestone) &&
                                                                            isMilestoneBudgetApproved(milestone) &&
                                                                            milestoneIdKey !== null &&
                                                                            nextSecurizableMilestoneId !== null &&
                                                                            milestoneIdKey === nextSecurizableMilestoneId;
                                                                        const showDisabledSecurePaymentBtn =
                                                                            (isPendingPaymentStatus(milestone) || hasMilestoneExceededEscrowPhase) && !showSecurePaymentBtn;
                                                                        const milestoneBudgetStatus =
                                                                            milestoneBudgetStatusFor(milestone) || providerBudgetStatus;
                                                                        const milestoneProposedAmount = toFiniteNumber(
                                                                            milestone?.proposed_amount ??
                                                                            milestone?.proposedAmount
                                                                        );

                                                                        return (
                                                                            <div
                                                                                key={milestoneId ?? index}
                                                                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border p-4 text-sm transition-colors
    ${milestoneStatus === 'PENDING' ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800" : ""}
    ${(milestoneStatus === 'WORK_IN_PROGRESS' || milestoneStatus === 'IN_PROGRESS') ? "bg-sky-50 border-sky-200 dark:bg-sky-900/10 dark:border-sky-800" : ""}
    ${(milestoneStatus === 'FINISHED' || milestoneStatus === 'COMPLETED') ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800" : ""}
    ${(milestoneStatus === 'PAID' || milestonePaymentStatus === 'PAID') ? "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800" : ""}
    ${milestoneStatus === 'REJECTED' ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800" : ""}
`}
                                                                            >
                                                                                {/* Partea Stângă: Detalii Milestone */}
                                                                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 dark:text-slate-200">
                                                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                                                        {index + 1}. {milestone.title}
                                                                                    </span>
                                                                                    <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
                                                                                    <span className="font-medium text-slate-600 dark:text-slate-400">
                                                                                        {t('client.project_requests.providers.milestone_budget')}{' '}
                                                                                        <PriceDisplay value={milestone.amount} />
                                                                                        {milestoneBudgetStatus === 'PROPOSED' && milestoneProposedAmount != null ? (
                                                                                            <span className="ml-2 text-blue-700 dark:text-blue-300">
                                                                                                {'->'} <PriceDisplay value={milestoneProposedAmount} />
                                                                                            </span>
                                                                                        ) : null}
                                                                                    </span>
                                                                                </div>

                                                                                {/* Partea Dreaptă: Status + Butoane */}
                                                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                                                    <div className="flex gap-2">
                                                                                        {getMilestoneStatusBadge(milestoneStatus)}
                                                                                    </div>

                                                                                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                                                        {isMilestoneUnassigned && milestoneIdKey !== null && (
                                                                                            <Button
                                                                                                size="sm"
                                                                                                variant="outline"
                                                                                                className="w-full sm:w-auto"
                                                                                                onClick={() =>
                                                                                                    openReplacementSuggestionsForMilestone(
                                                                                                        String(project.id),
                                                                                                        milestone,
                                                                                                        providerId
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                {t('client.project_requests.actions.find_replacement')}
                                                                                            </Button>
                                                                                        )}
                                                                                        {/* BUTON RELEASE FUNDS */}
                                                                                        {canReleaseMilestone && (
                                                                                            <Button
                                                                                                size="sm"
                                                                                                onClick={() => handleReleaseFunds(project.id, String(milestoneId))}
                                                                                                disabled={releasingId === `milestone-${milestoneId}`}
                                                                                                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                                                            >
                                                                                                {releasingId === `milestone-${milestoneId}` ? (
                                                                                                    <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> ...</>
                                                                                                ) : (
                                                                                                    <><CheckCircle className="w-3.5 h-3.5 mr-2" /> {t('client.project_requests.release.button')}</>
                                                                                                )}
                                                                                            </Button>
                                                                                        )}

                                                                                        {/* BUTON SECURE FUNDS (Rapyd) */}
                                                                                        {showSecurePaymentBtn && (
                                                                                            <div className="flex-1 sm:flex-none">
                                                                                                <RapydCheckoutButton
                                                                                                    project={project}
                                                                                                    milestone={milestone}
                                                                                                    countryCode="RO"
                                                                                                    onSuccess={() => window.location.reload()}
                                                                                                />
                                                                                            </div>
                                                                                        )}
                                                                                        {showDisabledSecurePaymentBtn && (
                                                                                            <div className="flex-1 sm:flex-none">
                                                                                                <Button
                                                                                                    size="sm"
                                                                                                    disabled
                                                                                                    className="w-full sm:w-auto"
                                                                                                >
                                                                                                    <Shield className="w-3.5 h-3.5 mr-2" />
                                                                                                    {t('client.project_requests.actions.secure_payment')}
                                                                                                </Button>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pt-4 border-t border-slate-100 dark:border-[#1E2A3D]">
                                                {/*{!project?.milestones && project.paymentStatus !== 'ESCROW' && (<Button*/}
                                                {/*    onClick={() => openCheckout(project, null, null)}*/}
                                                {/*    className="btn-primary w-full lg:w-auto px-6 py-6 text-base font-semibold"*/}
                                                {/*    size="lg"*/}
                                                {/*>*/}
                                                {/*    <Shield className="w-5 h-5 mr-2" />*/}
                                                {/*    {t('client.project_requests.actions.secure_payment')}*/}
                                                {/*</Button>)}*/}
                                                {(String(project.paymentStatus ?? project.payment_status ?? '').toUpperCase() === 'ESCROW') && canReleaseFull && (
                                                    <Button
                                                        onClick={() => handleReleaseFunds(project.id)}
                                                        className="btn-primary w-full lg:w-auto px-6 py-6 text-base font-semibold"
                                                        size="lg"
                                                        disabled={releasingId === `project-${project.id}`}
                                                    >
                                                        {releasingId === `project-${project.id}` ? (
                                                            <>
                                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                                {t('client.project_requests.release.processing')}
                                                            </>
                                                        ) : (
                                                            t('client.project_requests.release.button')
                                                        )}
                                                    </Button>
                                                )}
                                                <div className="flex flex-col gap-2 sm:flex-row">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        {t('client.project_requests.actions.view_details')}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"
                                                    >
                                                        <MessageSquare className="w-4 h-4 mr-2" />
                                                        {t('client.project_requests.actions.messages')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            </div>
                        )}
                    </div>
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

            <Dialog
                open={openReplacementDialog}
                onOpenChange={(open) => {
                    setOpenReplacementDialog(open);
                    if (!open) {
                        setReplacementContext(null);
                        setReplacementSuggestions([]);
                    }
                }}
            >
                <DialogContent className="max-w-2xl mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-6">
                    <div className="space-y-4">
                        <div>
                            <DialogTitle className="text-xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                {t('client.project_requests.replacement.title')}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                                {replacementContext?.milestoneTitle || t('client.project_requests.replacement.no_milestone')}
                            </DialogDescription>
                        </div>

                        {loadingReplacementSuggestions ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="w-5 h-5 animate-spin text-[#1BC47D]" />
                            </div>
                        ) : replacementSuggestions.length === 0 ? (
                            <div className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                                {t('client.project_requests.replacement.no_suggestions')}
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[55vh] overflow-y-auto">
                                {replacementSuggestions.map((candidate: any) => {
                                    const candidateId = String(candidate?.id ?? '');
                                    return (
                                        <div
                                            key={candidateId}
                                            className="rounded-xl border border-slate-200 dark:border-[#1E2A3D] p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={candidate?.avatar} />
                                                    <AvatarFallback>
                                                        {candidate?.firstName?.[0]}{candidate?.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                        {candidate?.name || `${candidate?.firstName ?? ''} ${candidate?.lastName ?? ''}`.trim()}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-[#A3ADC2]">
                                                        {candidate?.profile?.location || t('client.project_requests.providers.location_fallback')}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="btn-primary"
                                                disabled={reassigningProviderId === candidateId}
                                                onClick={() => handleReassignMilestoneProvider(candidateId)}
                                            >
                                                {reassigningProviderId === candidateId ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : null}
                                                {t('client.project_requests.replacement.assign')}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={openContractDialog} onOpenChange={setOpenContractDialog}>
                <DialogContent className="max-w-3xl mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-0 overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="bg-[#0B1C2D] p-6 text-white">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-[#1BC47D]" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-white">
                                    Contract
                                </DialogTitle>
                                <DialogDescription className="text-sm text-blue-100">
                                    Contractul pentru proiect x
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                            <div className="flex items-center flex-col justify-between text-sm mt-2 max-h-[70vh] overflow-y-auto">
                                {contractResponse?.clauses?.map((clause: any, idx: any) => (
                                    <div key={idx} className="mb-6">
                                        <h3 className="font-bold text-gray-700 text-sm mb-1">{clause.title}</h3>
                                        <p className="text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                                            {clause.text}
                                        </p>
                                        {/*                          <span className="text-xs text-green-600 font-mono">*/}
                                        {/*  [Engine Logic: {clause.logic_source}]*/}
                                        {/*</span>*/}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {withLayout ? <Footer /> : null}
        </div>
    );
}
