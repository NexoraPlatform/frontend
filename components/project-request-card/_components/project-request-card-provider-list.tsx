import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
    Banknote,
    CheckCircle,
    DollarSign,
    Loader2,
    MapPin,
    Pencil,
    Plus,
    Shield,
    Star,
    Trash2,
    XCircle,
} from 'lucide-react';

import { MuiIcon } from '@/components/MuiIcons';
import { PriceDisplay } from '@/components/PriceDisplay';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    getProjectLineForMilestone,
    getProjectMilestoneChangeRequestsForMilestone,
    getProjectMilestoneChangeRequestsForProvider,
} from '@/lib/milestone-change-requests';

import {
    collectIdentityValues,
    createMilestoneProposalDialogState,
    getAssignedProviderMilestones,
    getBudgetStatusBadge,
    getMilestoneId,
    getMilestoneStatusBadge,
    getNextMilestoneStatus,
    getProviderMilestones,
    getProviderProjectLines,
    hasMilestoneEscrowOrPaymentReference,
    isMilestonePaymentSecuredStatus,
    isMilestonePaymentSettledStatus,
    isPendingMilestonePaymentStatus,
    normalizeOptionalText,
    normalizePositiveBudget,
    normalizeStatusValue,
    renderEscrowStatusControl,
    resolveProviderId,
    toFiniteNumber,
} from '../_lib/project-request-card-helpers';
import type {
    MilestoneProposalResponseDialogState,
    ProjectRequestCardProps,
    ProjectRequestCardTranslator,
} from '../_lib/project-request-card-types';

type ProjectRequestCardProviderListProps = {
    project: any;
    user: any;
    existingServices: any[];
    customServices: any[];
    normalizedProviders: any[];
    projectLines: any[];
    dateLocale: any;
    t: ProjectRequestCardTranslator;
    isClientRole: boolean;
    isProviderRole: boolean;
    responding: string | null;
    updatingMilestoneId: string | null;
    proposeNewBudgetProviderId: string | null;
    setProposeNewBudgetProviderId: (value: string | null) => void;
    newBudget: number;
    setNewBudget: (value: number) => void;
    newBudgetReason: string;
    setNewBudgetReason: (value: string) => void;
    newBudgetReasonError: string | null;
    setNewBudgetReasonError: (value: string | null) => void;
    rejectBudgetProviderId: string | null;
    setRejectBudgetProviderId: (value: string | null) => void;
    budgetRejectionReason: string;
    setBudgetRejectionReason: (value: string) => void;
    budgetRejectionError: string | null;
    setBudgetRejectionError: (value: string | null) => void;
    setMilestoneProposalDialog: (value: any) => void;
    setMilestoneProposalError: (value: string | null) => void;
    setMilestoneProposalResponseDialog: (value: MilestoneProposalResponseDialogState) => void;
    setMilestoneProposalResponseReason: (value: string) => void;
    setMilestoneProposalResponseError: (value: string | null) => void;
    submittingMilestoneProposalKey: string | null;
    highlightedMilestoneId: string | null;
    onResponse: ProjectRequestCardProps['onResponse'];
    handleBudgetResponse: (
        projectId: string,
        providerId: string,
        response: 'ACCEPTED' | 'REJECTED',
        reason?: string
    ) => Promise<boolean>;
    handleMilestoneProposalResponse: (
        projectId: string,
        proposalId: string,
        response: 'ACCEPTED' | 'REJECTED',
        reason?: string
    ) => Promise<boolean>;
    handleMarkMilestoneStatus: (
        projectId: number | string,
        milestone: number | string,
        currentStatus: string
    ) => Promise<void>;
    onOpenUrl: (url: string) => void;
};

type ProjectRequestCardProviderItemProps = ProjectRequestCardProviderListProps & {
    provider: any;
};

function ProjectRequestCardProviderItem({
    project,
    provider,
    user,
    projectLines,
    dateLocale,
    t,
    isClientRole,
    isProviderRole,
    normalizedProviders,
    responding,
    updatingMilestoneId,
    proposeNewBudgetProviderId,
    setProposeNewBudgetProviderId,
    newBudget,
    setNewBudget,
    newBudgetReason,
    setNewBudgetReason,
    newBudgetReasonError,
    setNewBudgetReasonError,
    rejectBudgetProviderId,
    setRejectBudgetProviderId,
    budgetRejectionReason,
    setBudgetRejectionReason,
    budgetRejectionError,
    setBudgetRejectionError,
    setMilestoneProposalDialog,
    setMilestoneProposalError,
    setMilestoneProposalResponseDialog,
    setMilestoneProposalResponseReason,
    setMilestoneProposalResponseError,
    submittingMilestoneProposalKey,
    highlightedMilestoneId,
    onResponse,
    handleBudgetResponse,
    handleMilestoneProposalResponse,
    handleMarkMilestoneStatus,
    onOpenUrl,
}: ProjectRequestCardProviderItemProps) {
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
    const providerMilestonesProposedTotal = providerMilestones.reduce(
        (sum: number, milestone: any) => {
            const proposedAmount = normalizePositiveBudget(
                milestone?.proposed_amount ?? milestone?.proposedAmount
            );
            if (proposedAmount === null) return sum;
            return sum + proposedAmount;
        },
        0
    );
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
                return (
                    assignedProviderId !== null &&
                    String(assignedProviderId) === String(provider.id)
                );
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
              const transactionProviderId = transaction?.provider_id ?? transaction?.providerId ?? null;

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
        providerResponseStatus === 'ACCEPTED' && providerBudgetStatus === 'ACCEPTED';
    const canClientManageBudgetProposal = isClientRole && providerBudgetStatus === 'PROPOSED';
    const canProviderRespondToProject =
        isProviderRole &&
        isCurrentUserProvider &&
        (providerBudgetStatus === 'PENDING' || providerBudgetStatus === 'REJECTED');
    const canProviderManageMilestoneChanges =
        isProviderRole && isCurrentUserProvider && !isProjectFullyApprovedForProvider;
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
            entry?.payment_status ?? entry?.paymentStatus ?? ''
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
    });
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
                            {provider.firstName?.[0]}
                            {provider.lastName?.[0]}
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
                                <span>
                                    {provider.location ||
                                        t('client.project_requests.providers.location_fallback')}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                            {provider.services?.length > 0 &&
                                provider.services.map((service: any, index: number) => (
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
                                        {renderEscrowStatusControl({
                                            statusValue: providerEscrowStatus,
                                            nextStepUrl: providerTransactionNextStep,
                                            audience: 'provider',
                                            t,
                                            onOpenUrl,
                                        })}
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
                            onClick={() => onResponse(String(project.id), { response: 'ACCEPTED' })}
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
                            <DialogTitle>
                                {t('client.project_requests.budget.new_proposal')}
                            </DialogTitle>
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
                                    placeholder={t(
                                        'client.project_requests.budget.reason_placeholder_new_proposal'
                                    )}
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
                                <Button variant="outline">
                                    {t('client.project_requests.budget.cancel')}
                                </Button>
                            </DialogClose>
                            <Button
                                variant="default"
                                onClick={() => {
                                    const trimmedReason = newBudgetReason.trim();
                                    if (!trimmedReason) {
                                        setNewBudgetReasonError(
                                            t(
                                                'client.project_requests.budget.reason_required_new_propose'
                                            )
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

            {canClientManageBudgetProposal && (
                <Alert className="mt-3 border-emerald-200 dark:bg-emerald-500/20 bg-emerald-50/70">
                    <DollarSign className="h-4 w-4" />
                    <AlertDescription>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">
                                    {t('client.project_requests.budget.new_proposal')}:
                                </div>
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
                                        void handleBudgetResponse(
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
                                    disabled={
                                        responding === `${project.id}-${provider.id}` ||
                                        providerBudgetStatus !== 'PROPOSED'
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
                            <DialogTitle>
                                {t('client.project_requests.budget.reject_proposal_title')}
                            </DialogTitle>
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
                                placeholder={t(
                                    'client.project_requests.budget.reason_placeholder_rejection'
                                )}
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
                                            t(
                                                'client.project_requests.budget.reason_required_reject'
                                            )
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

            {provider.respondedAt && !Number.isNaN(new Date(provider.respondedAt).getTime()) && (
                <div className="mt-2 text-xs text-muted-foreground">
                    {t('client.project_requests.providers.response_received')}{' '}
                    {formatDistanceToNow(new Date(provider.respondedAt), {
                        addSuffix: true,
                        locale: dateLocale,
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
                                const proposalStatus = normalizeStatusValue(
                                    proposal?.status ?? 'PENDING'
                                );
                                const proposalType = normalizeStatusValue(
                                    proposal?.proposal_type ?? ''
                                );

                                return (
                                    <div
                                        key={
                                            proposalId ||
                                            `${proposalType}-${proposal?.created_at ?? Math.random()}`
                                        }
                                        className="rounded-md border border-slate-200 bg-slate-50/60 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]"
                                    >
                                        <div className="font-medium text-slate-700 dark:text-slate-200">
                                            {proposal?.title ??
                                                t(
                                                    'client.project_requests.milestone_change_requests.proposed_new'
                                                )}
                                        </div>
                                        <div className="mt-1 text-muted-foreground">
                                            <span className="font-medium text-foreground">
                                                {t(
                                                    'client.project_requests.milestone_change_requests.reason'
                                                )}
                                                :{' '}
                                            </span>
                                            {proposal?.reason || '-'}
                                        </div>
                                        {canClientRespondToMilestoneChanges &&
                                        proposalStatus === 'PENDING' ? (
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
                                                    {t(
                                                        'client.project_requests.milestone_change_requests.accept'
                                                    )}
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
                                                    {t(
                                                        'client.project_requests.milestone_change_requests.reject'
                                                    )}
                                                </Button>
                                            </div>
                                        ) : null}
                                        {proposalStatus === 'REJECTED' && proposal?.client_reason ? (
                                            <div className="mt-2 text-sm text-red-600 dark:text-red-300">
                                                <span className="font-medium">
                                                    {t(
                                                        'client.project_requests.milestone_change_requests.client_reason'
                                                    )}
                                                    :{' '}
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
                            const hasMilestoneExceededEscrowPhase =
                                isMilestoneBeyondEscrowPhase(milestone);
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
                                (isPendingPaymentStatus(milestone) ||
                                    hasMilestoneExceededEscrowPhase) &&
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
                            const canAdvanceMilestoneStatus = (() => {
                                if (
                                    !isProviderRole ||
                                    !isCurrentUserProvider ||
                                    !isMilestoneAssignedToCardProvider ||
                                    !milestoneId ||
                                    nextMilestoneStatus === null
                                ) {
                                    return false;
                                }

                                const normalizedMilestoneStatus =
                                    normalizeStatusValue(milestoneStatus);
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
                            const projectLineForMilestone = getProjectLineForMilestone(
                                project,
                                milestone
                            );
                            const canProviderEditMilestone =
                                canProviderManageMilestoneChanges &&
                                milestoneId != null &&
                                isMilestoneAssignedToCardProvider;

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
                                    className={`flex items-center justify-between rounded-md border p-2 text-sm gap-2 ${
                                        highlightedMilestoneId &&
                                        milestoneId != null &&
                                        String(milestoneId) === highlightedMilestoneId
                                            ? 'border-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-500/30'
                                            : ''
                                    } ${
                                        milestoneStatus === 'PAID' ||
                                        milestonePaymentStatus === 'PAID'
                                            ? 'bg-green-300'
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-6">
                                        <span className="block">
                                            <div>{milestone.title}</div>
                                            <div className="text-sm text-muted-foreground line-clamp-2">
                                                {milestone.description}
                                            </div>
                                            {milestoneChangeRequests.length > 0 ? (
                                                <div className="mt-2 space-y-2">
                                                    {milestoneChangeRequests.map((proposal: any) => {
                                                        const proposalId =
                                                            proposal?.id != null
                                                                ? String(proposal.id)
                                                                : '';
                                                        const proposalStatus = normalizeStatusValue(
                                                            proposal?.status ?? 'PENDING'
                                                        );
                                                        const proposalType = normalizeStatusValue(
                                                            proposal?.proposal_type ?? ''
                                                        );

                                                        return (
                                                            <div
                                                                key={String(
                                                                    proposal?.id ??
                                                                        `${proposal?.proposal_type}-${proposal?.created_at}`
                                                                )}
                                                                className="rounded-md border border-slate-200/80 bg-white/80 p-2 text-xs text-muted-foreground dark:border-[#1E2A3D] dark:bg-[#111B2D]"
                                                            >
                                                                <span className="font-medium text-foreground">
                                                                    {t(
                                                                        'client.project_requests.milestone_change_requests.reason'
                                                                    )}
                                                                    :{' '}
                                                                </span>
                                                                {proposal?.reason || '-'}
                                                                {proposalStatus === 'REJECTED' &&
                                                                proposal?.client_reason ? (
                                                                    <div className="mt-1 text-red-600 dark:text-red-300">
                                                                        <span className="font-medium">
                                                                            {t(
                                                                                'client.project_requests.milestone_change_requests.client_reason'
                                                                            )}
                                                                            :{' '}
                                                                        </span>
                                                                        {proposal.client_reason}
                                                                    </div>
                                                                ) : null}
                                                                {canClientRespondToMilestoneChanges &&
                                                                proposalStatus === 'PENDING' ? (
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
                                                                            {t(
                                                                                'client.project_requests.milestone_change_requests.accept'
                                                                            )}
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            onClick={() => {
                                                                                setMilestoneProposalResponseDialog(
                                                                                    {
                                                                                        projectId: String(
                                                                                            project.id
                                                                                        ),
                                                                                        proposalId,
                                                                                        proposalType,
                                                                                    }
                                                                                );
                                                                                setMilestoneProposalResponseReason(
                                                                                    ''
                                                                                );
                                                                                setMilestoneProposalResponseError(
                                                                                    null
                                                                                );
                                                                            }}
                                                                            disabled={!proposalId}
                                                                        >
                                                                            <XCircle className="w-4 h-4 mr-1" />
                                                                            {t(
                                                                                'client.project_requests.milestone_change_requests.reject'
                                                                            )}
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
                                            {milestoneBudgetStatus === 'PROPOSED' &&
                                            milestoneProposedAmount != null ? (
                                                <span className="ml-2 text-blue-700">
                                                    {'->'}{' '}
                                                    <PriceDisplay value={milestoneProposedAmount} />
                                                </span>
                                            ) : null}
                                        </span>
                                    </div>
                                    <div className="ms-2 flex items-center gap-2">
                                        {getMilestoneStatusBadge(milestoneStatus, t)}
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
                                                            description: String(
                                                                milestone?.description ?? ''
                                                            ),
                                                            amount:
                                                                toFiniteNumber(milestone?.amount) !=
                                                                null
                                                                    ? String(
                                                                          toFiniteNumber(
                                                                              milestone?.amount
                                                                          )
                                                                      )
                                                                    : '',
                                                            reason: '',
                                                            serviceName: String(
                                                                projectLineForMilestone?.service_name ??
                                                                    milestone?.service_name ??
                                                                    ''
                                                            ),
                                                            milestoneTitle: String(
                                                                milestone?.title ?? ''
                                                            ),
                                                            currentSnapshot: milestone,
                                                        })
                                                    );
                                                    setMilestoneProposalError(null);
                                                }}
                                            >
                                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                                {t(
                                                    'client.project_requests.milestone_change_requests.edit_action'
                                                )}
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
                                                            description: String(
                                                                milestone?.description ?? ''
                                                            ),
                                                            amount:
                                                                toFiniteNumber(milestone?.amount) !=
                                                                null
                                                                    ? String(
                                                                          toFiniteNumber(
                                                                              milestone?.amount
                                                                          )
                                                                      )
                                                                    : '',
                                                            reason: '',
                                                            serviceName: String(
                                                                projectLineForMilestone?.service_name ??
                                                                    milestone?.service_name ??
                                                                    ''
                                                            ),
                                                            milestoneTitle: String(
                                                                milestone?.title ?? ''
                                                            ),
                                                            currentSnapshot: milestone,
                                                        })
                                                    );
                                                    setMilestoneProposalError(null);
                                                }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                {t(
                                                    'client.project_requests.milestone_change_requests.delete_action'
                                                )}
                                            </Button>
                                        </span>
                                    ) : null}
                                    {canAdvanceMilestoneStatus && (
                                        <span>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() =>
                                                    void handleMarkMilestoneStatus(
                                                        project.id,
                                                        milestoneId,
                                                        milestoneStatus
                                                    )
                                                }
                                                disabled={isMilestoneUpdating}
                                            >
                                                {isMilestoneUpdating ? (
                                                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                                ) : null}
                                                {nextMilestoneStatus === 'work_in_progress'
                                                    ? t(
                                                          'client.project_requests.milestones.start_work'
                                                      )
                                                    : nextMilestoneStatus === 'finished'
                                                      ? t(
                                                            'client.project_requests.milestones.mark_finished'
                                                        )
                                                      : t(
                                                            'client.project_requests.milestones.finished'
                                                        )}
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
                                                        onOpenUrl(clientEscrowPaymentUrl);
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
                                            <Button size="sm" variant="outline" disabled>
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
}

export function ProjectRequestCardProviderList({
    existingServices,
    customServices,
    normalizedProviders,
    ...providerItemProps
}: ProjectRequestCardProviderListProps) {
    return (
        <>
            {(existingServices.length > 0 || customServices.length > 0) && (
                <div className="mb-4">
                    <div className="text-sm font-medium mb-2">
                        {providerItemProps.t('client.project_requests.project.technologies')}:
                    </div>
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

            <div>
                <div className="text-sm font-medium mb-3">
                    {providerItemProps.t('client.project_requests.providers.title')}:
                </div>
                <div className="space-y-3">
                    {normalizedProviders.map((provider: any) => (
                        <ProjectRequestCardProviderItem
                            key={provider.id}
                            provider={provider}
                            normalizedProviders={normalizedProviders}
                            existingServices={existingServices}
                            customServices={customServices}
                            {...providerItemProps}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
