import { formatDistanceToNow, type Locale } from 'date-fns';
import {
    Calendar,
    CheckCircle,
    Code,
    DollarSign,
    Loader2,
    MapPin,
    Shield,
    Star,
    User,
    XCircle,
} from 'lucide-react';

import { MuiIcon } from '@/components/MuiIcons';
import { PriceDisplay } from '@/components/PriceDisplay';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    getProjectMilestoneChangeRequestsForMilestone,
    getProjectMilestoneChangeRequestsForProvider,
} from '@/lib/milestone-change-requests';

import {
    normalizePositiveBudget,
    normalizeStatusValue,
    normalizeOptionalText,
    openProjectRequestsNextStep,
    renderEscrowStatusControl,
    toFiniteNumber,
} from '../_lib/client-project-requests-helpers';
import type { ProjectRequestsTranslator } from '../_lib/client-project-requests-types';
import { ProjectRequestsEmptyState } from './project-requests-empty-state';

type ProjectRequestsProjectListProps = {
    projects: any[];
    withLayout: boolean;
    dateLocale: Locale;
    locale: string;
    highlightedMilestoneId: string | null;
    releasingId: string | null;
    responding: string | null;
    t: ProjectRequestsTranslator;
    onCreateProject: () => void;
    getProjectMilestones: (project: any) => any[];
    getProjectProviders: (project: any) => any[];
    getProviderMilestones: (project: any, provider: any) => any[];
    getProviderId: (provider: any) => string | null;
    getMilestoneId: (milestone: any) => string | number | null;
    getStatusBadge: (status: string) => React.ReactNode;
    getMilestoneStatusBadge: (status: string) => React.ReactNode;
    openContractWorkspace: (project: any, options?: { autoGenerate?: boolean }) => void;
    handleBudgetResponse: (
        projectId: string,
        providerId: string,
        response: 'ACCEPTED' | 'REJECTED',
        reason?: string
    ) => Promise<boolean>;
    openBudgetRejectionDialog: (projectId: string, providerId: string) => void;
    handleMilestoneProposalResponse: (
        projectId: string,
        proposalId: string,
        response: 'ACCEPTED' | 'REJECTED',
        reason?: string
    ) => Promise<boolean>;
    openMilestoneProposalResponseDialog: (projectId: string, proposalId: string) => void;
    openReplacementSuggestionsForMilestone: (
        projectId: string,
        milestone: any,
        excludeProviderId?: string | null
    ) => void | Promise<void>;
    handleReleaseFunds: (projectId: string, milestoneId?: string) => void | Promise<void>;
};

type ProjectRequestsProjectCardProps = Omit<
    ProjectRequestsProjectListProps,
    'projects' | 'onCreateProject' | 'withLayout'
> & {
    project: any;
};

type ProjectRequestsProviderCardProps = {
    project: any;
    provider: any;
    dateLocale: Locale;
    locale: string;
    highlightedMilestoneId: string | null;
    releasingId: string | null;
    responding: string | null;
    t: ProjectRequestsTranslator;
    getProviderMilestones: (project: any, provider: any) => any[];
    getProviderId: (provider: any) => string | null;
    getMilestoneId: (milestone: any) => string | number | null;
    getStatusBadge: (status: string) => React.ReactNode;
    getMilestoneStatusBadge: (status: string) => React.ReactNode;
    openContractWorkspace: (project: any, options?: { autoGenerate?: boolean }) => void;
    handleBudgetResponse: (
        projectId: string,
        providerId: string,
        response: 'ACCEPTED' | 'REJECTED',
        reason?: string
    ) => Promise<boolean>;
    openBudgetRejectionDialog: (projectId: string, providerId: string) => void;
    handleMilestoneProposalResponse: (
        projectId: string,
        proposalId: string,
        response: 'ACCEPTED' | 'REJECTED',
        reason?: string
    ) => Promise<boolean>;
    openMilestoneProposalResponseDialog: (projectId: string, proposalId: string) => void;
    openReplacementSuggestionsForMilestone: (
        projectId: string,
        milestone: any,
        excludeProviderId?: string | null
    ) => void | Promise<void>;
    handleReleaseFunds: (projectId: string, milestoneId?: string) => void | Promise<void>;
};

export function ProjectRequestsProjectList({
    projects,
    withLayout,
    onCreateProject,
    ...rest
}: ProjectRequestsProjectListProps) {
    return (
        <div className={withLayout ? 'mt-8' : ''}>
            {projects.length === 0 ? (
                <ProjectRequestsEmptyState t={rest.t} onCreateProject={onCreateProject} />
            ) : (
                <div className="space-y-6">
                    {projects.map((project) => (
                        <ProjectRequestsProjectCard
                            key={String(project?.id)}
                            project={project}
                            {...rest}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function ProjectRequestsProjectCard({
    project,
    dateLocale,
    releasingId,
    t,
    getProjectMilestones,
    getProjectProviders,
    getProviderMilestones,
    getProviderId,
    getMilestoneId,
    getStatusBadge,
    getMilestoneStatusBadge,
    openContractWorkspace,
    handleBudgetResponse,
    openBudgetRejectionDialog,
    handleMilestoneProposalResponse,
    openMilestoneProposalResponseDialog,
    openReplacementSuggestionsForMilestone,
    handleReleaseFunds,
    highlightedMilestoneId,
    responding,
}: ProjectRequestsProjectCardProps) {
    const hasAnyMilestones = getProjectMilestones(project).length > 0;
    const canReleaseFull = !hasAnyMilestones && project.status === 'FINISHED';
    const projectProviders = getProjectProviders(project);
    const existingServices = Array.isArray(project?.existing_services)
        ? project.existing_services
        : [];
    const customServices = Array.isArray(project?.custom_services)
        ? project.custom_services
        : [];
    const serviceCategories = Array.from(
        new Map(
            existingServices
                .map((service: any) => service?.category)
                .filter((category: any) => Boolean(category?.id ?? category?.name))
                .map((category: any) => [String(category?.id ?? category?.name), category])
        ).values()
    );

    return (
        <Card
            className="glass-card border-transparent shadow-sm transition-shadow"
            data-project-card-id={String(project.id)}
            id={`project-card-${project.id}`}
        >
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
                                    {t('client.project_requests.project.created')}{' '}
                                    {formatDistanceToNow(new Date(project.created_at), {
                                        addSuffix: true,
                                        locale: dateLocale,
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <User className="w-4 h-4 text-[#1BC47D]" />
                                <span>
                                    {t('client.project_requests.project.selected_providers', {
                                        count: projectProviders.length || 0,
                                    })}
                                </span>
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
                        {projectProviders.map((provider: any) => (
                            <ProjectRequestsProviderCard
                                key={String(provider?.id)}
                                project={project}
                                provider={provider}
                                dateLocale={dateLocale}
                                locale={''}
                                highlightedMilestoneId={highlightedMilestoneId}
                                releasingId={releasingId}
                                responding={responding}
                                t={t}
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
                        ))}
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
                    {String(project.paymentStatus ?? project.payment_status ?? '').toUpperCase() ===
                        'ESCROW' && canReleaseFull ? (
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
                    ) : null}
                    {/*<div className="flex flex-col gap-2 sm:flex-row">*/}
                    {/*    <Button*/}
                    {/*        variant="outline"*/}
                    {/*        size="sm"*/}
                    {/*        className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"*/}
                    {/*    >*/}
                    {/*        <Eye className="w-4 h-4 mr-2" />*/}
                    {/*        {t('client.project_requests.actions.view_details')}*/}
                    {/*    </Button>*/}
                    {/*    <Button*/}
                    {/*        variant="outline"*/}
                    {/*        size="sm"*/}
                    {/*        className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"*/}
                    {/*    >*/}
                    {/*        <MessageSquare className="w-4 h-4 mr-2" />*/}
                    {/*        {t('client.project_requests.actions.messages')}*/}
                    {/*    </Button>*/}
                    {/*</div>*/}
                </div>
            </CardContent>
        </Card>
    );
}

function ProjectRequestsProviderCard({
    project,
    provider,
    dateLocale,
    highlightedMilestoneId,
    releasingId,
    responding,
    t,
    getProviderMilestones,
    getProviderId,
    getMilestoneId,
    getStatusBadge,
    getMilestoneStatusBadge,
    openContractWorkspace,
    handleBudgetResponse,
    openBudgetRejectionDialog,
    handleMilestoneProposalResponse,
    openMilestoneProposalResponseDialog,
    openReplacementSuggestionsForMilestone,
    handleReleaseFunds,
}: ProjectRequestsProviderCardProps) {
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
    const providerLineBudgetStatuses = (
        Array.isArray(project?.project_lines)
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
    const providerBudgetProposalReason =
        normalizeOptionalText(
            provider?.providerBudgetProposalReason ??
                provider?.provider_budget_proposal_reason ??
                provider?.proposalReason ??
                provider?.pivot?.provider_budget_proposal_reason ??
                provider?.pivot?.proposalReason
        );
    const clientBudgetRejectionReason =
        normalizeOptionalText(
            provider?.clientBudgetRejectionReason ??
                provider?.client_budget_rejection_reason ??
                provider?.rejectionReason ??
                provider?.pivot?.client_budget_rejection_reason ??
                provider?.pivot?.rejectionReason
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
        providerEscrowTransaction?.client_next_step ??
        providerEscrowTransaction?.clientNextStep ??
        null;
    const providerEscrowTransactionId = normalizeOptionalText(
        providerEscrowTransaction?.escrow_transaction_id ??
            providerEscrowTransaction?.escrowTransactionId
    );
    const providerEscrowPaymentUrl = providerEscrowTransactionId
        ? `https://www.escrow-sandbox.com/transactions/${providerEscrowTransactionId}/payment`
        : null;
    const providerEscrowStatus = normalizeStatusValue(
        providerEscrowTransaction?.client_transaction_status ??
            providerEscrowTransaction?.clientTransactionStatus ??
            '',
        ''
    );
    const providerMilestoneChangeRequests =
        getProjectMilestoneChangeRequestsForProvider(
            project,
            provider?.id
        );
    const standaloneMilestoneChangeRequests =
        providerMilestoneChangeRequests.filter(
            (proposal) =>
                (proposal?.project_line_milestone_id === null ||
                    proposal?.project_line_milestone_id === undefined) &&
                (proposal?.current_snapshot?.id === null ||
                    proposal?.current_snapshot?.id === undefined)
        );

    return (
        <div className="border border-slate-100 rounded-xl p-4 bg-white/70 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                    <Avatar className="w-11 h-11">
                        <AvatarImage src={provider.avatar} />
                        <AvatarFallback>
                            {provider.firstName?.[0]}
                            {provider.lastName?.[0]}
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
                                <span>
                                    {provider.location ||
                                        t('client.project_requests.providers.location_fallback')}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mt-2">
                            {provider.services?.length > 0 &&
                                provider.services.map((service: any, index: number) => (
                                    <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs border-slate-200 "
                                    >
                                        <MuiIcon
                                            icon={service.categoryIcon}
                                            size={20}
                                            className="mr-1"
                                        />
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
                            <>
                                <PriceDisplay value={providerAllocatedBudget} />
                                {providerEscrowStatus ? (
                                    <div className="mt-2">
                                        {renderEscrowStatusControl({
                                            statusValue: providerEscrowStatus,
                                            nextStepUrl: providerTransactionNextStep,
                                            audience: 'client',
                                            t,
                                        })}
                                    </div>
                                ) : null}
                            </>
                        ) : (
                            '-'
                        )}
                    </div>
                    {project.status === 'ACCEPTED' && (
                        <Button
                            size="sm"
                            onClick={() =>
                                openContractWorkspace(project, {
                                    autoGenerate: true,
                                })
                            }
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                            Contract
                        </Button>
                    )}
                    <div></div>
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
                                {providerBudgetProposalReason ? (
                                    <div className="mt-2 text-sm text-slate-600 dark:text-[#C7D2E3]">
                                        <span className="font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                            {t('client.project_requests.budget.provider_reason')}{' '}
                                        </span>
                                        {providerBudgetProposalReason}
                                    </div>
                                ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        void handleBudgetResponse(
                                            project.id,
                                            provider.id,
                                            'ACCEPTED'
                                        );
                                    }}
                                    disabled={
                                        responding === `${project.id}-${provider.id}` ||
                                        providerBudgetStatus !== 'PROPOSED'
                                    }
                                    className="btn-primary"
                                >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {t('client.project_requests.budget.approve')}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        openBudgetRejectionDialog(
                                            String(project.id),
                                            String(provider.id)
                                        );
                                    }}
                                    disabled={
                                        responding === `${project.id}-${provider.id}` ||
                                        providerBudgetStatus !== 'PROPOSED'
                                    }
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

            {providerBudgetStatus === 'REJECTED' && clientBudgetRejectionReason ? (
                <Alert className="mt-4 border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
                    <AlertDescription>
                        <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('client.project_requests.budget.rejected')}
                        </div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-[#C7D2E3]">
                            <span className="font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                {t('client.project_requests.budget.client_rejection_reason')}{' '}
                            </span>
                            {clientBudgetRejectionReason}
                        </div>
                    </AlertDescription>
                </Alert>
            ) : null}

            {provider.respondedAt && (
                <div className="mt-3 text-xs text-slate-400 dark:text-[#A3ADC2]">
                    {t('client.project_requests.providers.response_received')}{' '}
                    {formatDistanceToNow(new Date(provider.respondedAt), {
                        addSuffix: true,
                        locale: dateLocale,
                    })}
                </div>
            )}

            <div className="space-y-2 mt-2">
                {standaloneMilestoneChangeRequests.length > 0 ? (
                    <div className="space-y-2">
                        {standaloneMilestoneChangeRequests.map((proposal: any) => {
                            const proposalId = proposal?.id != null ? String(proposal.id) : '';
                            const proposalStatus = normalizeStatusValue(proposal?.status ?? 'PENDING');
                            const proposalType = normalizeStatusValue(proposal?.proposal_type ?? '');

                            return (
                                <div
                                    key={proposalId || `${proposalType}-${proposal?.created_at ?? Math.random()}`}
                                    className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]"
                                >
                                    <div className="font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                        {proposal?.title ??
                                            t('client.project_requests.milestone_change_requests.proposed_new')}
                                    </div>
                                    <div className="mt-1 text-slate-600 dark:text-[#C7D2E3]">
                                        <span className="font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                            {t('client.project_requests.milestone_change_requests.reason')}:{' '}
                                        </span>
                                        {proposal?.reason || '-'}
                                    </div>
                                    <div className="mt-2 rounded-md border border-slate-200/80 bg-white/80 p-2 text-xs text-slate-600 dark:border-[#1E2A3D] dark:bg-[#111B2D] dark:text-[#C7D2E3]">
                                        <div className="font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                            {t('client.project_requests.milestone_change_requests.proposed_new')}
                                        </div>
                                        <div className="mt-1">
                                            {proposal?.title ??
                                                t('client.project_requests.milestone_change_requests.untitled')}
                                        </div>
                                        {proposal?.description ? (
                                            <div className="mt-1">{proposal.description}</div>
                                        ) : null}
                                        {toFiniteNumber(proposal?.amount) != null ? (
                                            <div className="mt-1">
                                                <span className="font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                    {t('client.project_requests.milestone_change_requests.amount')}:{' '}
                                                </span>
                                                <PriceDisplay value={toFiniteNumber(proposal?.amount) ?? 0} />
                                            </div>
                                        ) : null}
                                    </div>
                                    {proposalStatus === 'PENDING' ? (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                className="btn-primary"
                                                onClick={() => {
                                                    void handleMilestoneProposalResponse(
                                                        String(project.id),
                                                        proposalId,
                                                        'ACCEPTED'
                                                    );
                                                }}
                                                disabled={
                                                    !proposalId ||
                                                    responding === `${project.id}:${proposalId}:ACCEPTED`
                                                }
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                {t('client.project_requests.milestone_change_requests.accept')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"
                                                onClick={() => {
                                                    openMilestoneProposalResponseDialog(
                                                        String(project.id),
                                                        proposalId
                                                    );
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
                    const canReleaseMilestone =
                        (milestoneStatus === 'FINISHED' || milestoneStatus === 'COMPLETED') &&
                        milestoneId;
                    const showSecurePaymentBtn =
                        providerEscrowStatus === 'AWAITING_PAYMENT' &&
                        Boolean(providerEscrowPaymentUrl) &&
                        !hasMilestoneExceededEscrowPhase &&
                        isPendingPaymentStatus(milestone) &&
                        isMilestoneBudgetApproved(milestone) &&
                        milestoneIdKey !== null &&
                        nextSecurizableMilestoneId !== null &&
                        milestoneIdKey === nextSecurizableMilestoneId;
                    const showDisabledSecurePaymentBtn =
                        (isPendingPaymentStatus(milestone) || hasMilestoneExceededEscrowPhase) &&
                        !showSecurePaymentBtn;
                    const milestoneBudgetStatus =
                        milestoneBudgetStatusFor(milestone) || providerBudgetStatus;
                    const milestoneProposedAmount = toFiniteNumber(
                        milestone?.proposed_amount ??
                            milestone?.proposedAmount
                    );
                    const milestoneChangeRequests =
                        milestoneId != null
                            ? getProjectMilestoneChangeRequestsForMilestone(
                                  project,
                                  milestoneId
                              ).filter(
                                  (proposal) =>
                                      String(proposal?.provider_id ?? '') ===
                                      String(provider?.id ?? '')
                              )
                            : [];

                    return (
                        <div
                            key={milestoneId ?? index}
                            data-project-milestone-id={
                                milestoneId != null ? String(milestoneId) : undefined
                            }
                            id={
                                milestoneId != null
                                    ? `project-milestone-${String(milestoneId)}`
                                    : undefined
                            }
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border p-4 text-sm transition-colors
${highlightedMilestoneId && milestoneIdKey === highlightedMilestoneId ? 'ring-2 ring-emerald-200 border-emerald-400 dark:ring-emerald-500/30' : ''}
${milestoneStatus === 'PENDING' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800' : ''}
${milestoneStatus === 'WORK_IN_PROGRESS' || milestoneStatus === 'IN_PROGRESS' ? 'bg-sky-50 border-sky-200 dark:bg-sky-900/10 dark:border-sky-800' : ''}
${milestoneStatus === 'FINISHED' || milestoneStatus === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800' : ''}
${milestoneStatus === 'PAID' || milestonePaymentStatus === 'PAID' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800' : ''}
${milestoneStatus === 'REJECTED' ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800' : ''}
`}
                        >
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 dark:text-slate-200">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {index + 1}. {milestone.title}
                                </span>
                                <span className="hidden sm:inline text-slate-300 dark:text-slate-600">
                                    |
                                </span>
                                <span className="font-medium text-slate-600 dark:text-slate-400">
                                    {t('client.project_requests.providers.milestone_budget')}{' '}
                                    <PriceDisplay value={milestone.amount} />
                                    {milestoneBudgetStatus === 'PROPOSED' &&
                                    milestoneProposedAmount != null ? (
                                        <span className="ml-2 text-blue-700 dark:text-blue-300">
                                            {'->'} <PriceDisplay value={milestoneProposedAmount} />
                                        </span>
                                    ) : null}
                                </span>
                                {milestoneChangeRequests.length > 0 ? (
                                    <div className="mt-2 w-full space-y-2">
                                        {milestoneChangeRequests.map((proposal: any) => {
                                            const proposalId = proposal?.id != null ? String(proposal.id) : '';
                                            const proposalStatus = normalizeStatusValue(proposal?.status ?? 'PENDING');
                                            const proposalType = normalizeStatusValue(proposal?.proposal_type ?? '');

                                            return (
                                                <div
                                                    key={String(proposal?.id ?? `${proposal?.proposal_type}-${proposal?.created_at}`)}
                                                    className="rounded-md border border-slate-200/80 bg-white/80 p-2 text-xs text-slate-600 dark:border-[#1E2A3D] dark:bg-[#111B2D] dark:text-[#C7D2E3]"
                                                >
                                                    {(proposalType === 'UPDATE' || proposalType === 'DELETE') &&
                                                    proposal?.current_snapshot ? (
                                                        <div className="mb-2 rounded-md border border-dashed border-slate-200 bg-slate-50/80 p-2 dark:border-[#243246] dark:bg-[#0B1220]">
                                                            <div className="font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                                {t('client.project_requests.milestone_change_requests.before')}
                                                            </div>
                                                            <div className="mt-1">
                                                                {proposal?.current_snapshot?.title ??
                                                                    proposal?.milestone_title ??
                                                                    t('client.project_requests.milestone_change_requests.untitled')}
                                                            </div>
                                                            {proposal?.current_snapshot?.description ? (
                                                                <div className="mt-1">
                                                                    {proposal.current_snapshot.description}
                                                                </div>
                                                            ) : null}
                                                            {toFiniteNumber(proposal?.current_snapshot?.amount) != null ? (
                                                                <div className="mt-1">
                                                                    <span className="font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                                        {t('client.project_requests.milestone_change_requests.amount')}:{' '}
                                                                    </span>
                                                                    <PriceDisplay value={toFiniteNumber(proposal?.current_snapshot?.amount) ?? 0} />
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    ) : null}
                                                    {proposalType !== 'DELETE' ? (
                                                        <div className="mb-2 rounded-md border border-slate-200 bg-slate-50/80 p-2 dark:border-[#243246] dark:bg-[#0B1220]">
                                                            <div className="font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                                {proposalType === 'ADD'
                                                                    ? t('client.project_requests.milestone_change_requests.proposed_new')
                                                                    : t('client.project_requests.milestone_change_requests.proposed_changes')}
                                                            </div>
                                                            <div className="mt-1">
                                                                {proposal?.title ??
                                                                    proposal?.milestone_title ??
                                                                    t('client.project_requests.milestone_change_requests.untitled')}
                                                            </div>
                                                            {proposal?.description ? (
                                                                <div className="mt-1">
                                                                    {proposal.description}
                                                                </div>
                                                            ) : null}
                                                            {toFiniteNumber(proposal?.amount) != null ? (
                                                                <div className="mt-1">
                                                                    <span className="font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                                        {t('client.project_requests.milestone_change_requests.amount')}:{' '}
                                                                    </span>
                                                                    <PriceDisplay value={toFiniteNumber(proposal?.amount) ?? 0} />
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    ) : null}
                                                    <span className="font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
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
                                                    {proposalStatus === 'PENDING' ? (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="btn-primary"
                                                                onClick={() => {
                                                                    void handleMilestoneProposalResponse(
                                                                        String(project.id),
                                                                        proposalId,
                                                                        'ACCEPTED'
                                                                    );
                                                                }}
                                                                disabled={
                                                                    !proposalId ||
                                                                    responding === `${project.id}:${proposalId}:ACCEPTED`
                                                                }
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                                {t('client.project_requests.milestone_change_requests.accept')}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"
                                                                onClick={() => {
                                                                    openMilestoneProposalResponseDialog(
                                                                        String(project.id),
                                                                        proposalId
                                                                    );
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
                            </div>

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
                                    {canReleaseMilestone && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleReleaseFunds(project.id, String(milestoneId))}
                                            disabled={releasingId === `milestone-${milestoneId}`}
                                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                        >
                                            {releasingId === `milestone-${milestoneId}` ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> ...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-3.5 h-3.5 mr-2" />{' '}
                                                    {t('client.project_requests.release.button')}
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {showSecurePaymentBtn && (
                                        <div className="flex-1 sm:flex-none">
                                            <Button
                                                size="sm"
                                                className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
                                                onClick={() => {
                                                    if (providerEscrowPaymentUrl) {
                                                        openProjectRequestsNextStep(providerEscrowPaymentUrl);
                                                    }
                                                }}
                                            >
                                                <Shield className="w-3.5 h-3.5 mr-2" />
                                                {t('client.project_requests.actions.secure_payment')}
                                            </Button>
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
}
