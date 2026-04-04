import { CheckCircle, Loader2 } from 'lucide-react';

import ProjectContractWorkspace from '@/components/projects/project-contract-workspace';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type {
    BudgetRejectionDialogState,
    ContractDialogContext,
    MilestoneProposalResponseDialogState,
    ProjectRequestsTranslator,
    ReplacementContext,
} from '../_lib/client-project-requests-types';

type ProjectRequestsDialogsProps = {
    t: ProjectRequestsTranslator;
    locale: string;
    replacementDialogOpen: boolean;
    onReplacementDialogOpenChange: (open: boolean) => void;
    replacementContext: ReplacementContext;
    clearReplacementDialog: () => void;
    loadingReplacementSuggestions: boolean;
    replacementSuggestions: any[];
    reassigningProviderId: string | null;
    onReassignMilestoneProvider: (providerId: string) => void;
    budgetRejectionDialog: BudgetRejectionDialogState;
    budgetRejectionReason: string;
    setBudgetRejectionReason: (value: string) => void;
    budgetRejectionError: string | null;
    setBudgetRejectionError: (value: string | null) => void;
    clearBudgetRejectionDialog: () => void;
    onSubmitBudgetRejection: () => void;
    milestoneProposalResponseDialog: MilestoneProposalResponseDialogState;
    milestoneProposalResponseReason: string;
    setMilestoneProposalResponseReason: (value: string) => void;
    milestoneProposalResponseError: string | null;
    setMilestoneProposalResponseError: (value: string | null) => void;
    clearMilestoneProposalResponseDialog: () => void;
    onSubmitMilestoneProposalRejection: () => void;
    responding: string | null;
    contractDialogContext: ContractDialogContext;
    onContractDialogOpenChange: (open: boolean) => void;
};

export function ProjectRequestsDialogs({
    t,
    locale,
    replacementDialogOpen,
    onReplacementDialogOpenChange,
    replacementContext,
    clearReplacementDialog,
    loadingReplacementSuggestions,
    replacementSuggestions,
    reassigningProviderId,
    onReassignMilestoneProvider,
    budgetRejectionDialog,
    budgetRejectionReason,
    setBudgetRejectionReason,
    budgetRejectionError,
    setBudgetRejectionError,
    clearBudgetRejectionDialog,
    onSubmitBudgetRejection,
    milestoneProposalResponseDialog,
    milestoneProposalResponseReason,
    setMilestoneProposalResponseReason,
    milestoneProposalResponseError,
    setMilestoneProposalResponseError,
    clearMilestoneProposalResponseDialog,
    onSubmitMilestoneProposalRejection,
    responding,
    contractDialogContext,
    onContractDialogOpenChange,
}: ProjectRequestsDialogsProps) {
    return (
        <>
            <Dialog
                open={replacementDialogOpen}
                onOpenChange={(open) => {
                    onReplacementDialogOpenChange(open);
                    if (!open) {
                        clearReplacementDialog();
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
                                                        {candidate?.firstName?.[0]}
                                                        {candidate?.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                        {candidate?.name ||
                                                            `${candidate?.firstName ?? ''} ${candidate?.lastName ?? ''}`.trim()}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-[#A3ADC2]">
                                                        {candidate?.profile?.location ||
                                                            t('client.project_requests.providers.location_fallback')}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="btn-primary"
                                                disabled={reassigningProviderId === candidateId}
                                                onClick={() => onReassignMilestoneProvider(candidateId)}
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

            <Dialog
                open={Boolean(budgetRejectionDialog)}
                onOpenChange={(open) => {
                    if (!open) {
                        clearBudgetRejectionDialog();
                    }
                }}
            >
                <DialogContent className="max-w-xl mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('client.project_requests.budget.reject_proposal_title')}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                            {t('client.project_requests.budget.reject_proposal_description')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="budget-rejection-reason">
                            {t('client.project_requests.budget.reason_label')}
                        </Label>
                        <Textarea
                            id="budget-rejection-reason"
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
                        <Button
                            type="button"
                            variant="outline"
                            onClick={clearBudgetRejectionDialog}
                        >
                            {t('client.project_requests.budget.cancel')}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={
                                !budgetRejectionDialog ||
                                responding ===
                                    `${budgetRejectionDialog?.projectId}-${budgetRejectionDialog?.providerId}`
                            }
                            onClick={onSubmitBudgetRejection}
                        >
                            {responding ===
                            `${budgetRejectionDialog?.projectId}-${budgetRejectionDialog?.providerId}` ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            {t('client.project_requests.budget.submit_rejection')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(milestoneProposalResponseDialog)}
                onOpenChange={(open) => {
                    if (!open) {
                        clearMilestoneProposalResponseDialog();
                    }
                }}
            >
                <DialogContent className="max-w-xl mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('client.project_requests.milestone_change_requests.reject_title')}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                            {t('client.project_requests.milestone_change_requests.reject_description')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="milestone-proposal-rejection-reason">
                            {t('client.project_requests.milestone_change_requests.client_reason')}
                        </Label>
                        <Textarea
                            id="milestone-proposal-rejection-reason"
                            value={milestoneProposalResponseReason}
                            onChange={(event) => {
                                setMilestoneProposalResponseReason(event.target.value);
                                if (milestoneProposalResponseError) {
                                    setMilestoneProposalResponseError(null);
                                }
                            }}
                            placeholder={t('client.project_requests.milestone_change_requests.reject_reason_placeholder')}
                            rows={4}
                        />
                        {milestoneProposalResponseError ? (
                            <p className="text-sm text-red-600 dark:text-red-300">
                                {milestoneProposalResponseError}
                            </p>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={clearMilestoneProposalResponseDialog}
                        >
                            {t('client.project_requests.budget.cancel')}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={
                                !milestoneProposalResponseDialog ||
                                responding ===
                                    `${milestoneProposalResponseDialog?.projectId}:${milestoneProposalResponseDialog?.proposalId}:REJECTED`
                            }
                            onClick={onSubmitMilestoneProposalRejection}
                        >
                            {responding ===
                            `${milestoneProposalResponseDialog?.projectId}:${milestoneProposalResponseDialog?.proposalId}:REJECTED` ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            {t('client.project_requests.milestone_change_requests.submit_reject')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(contractDialogContext)}
                onOpenChange={onContractDialogOpenChange}
            >
                <DialogContent className="max-w-6xl bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-0 overflow-hidden flex flex-col max-h-[92vh]">
                    <DialogHeader className="border-b border-slate-200 px-6 py-5 dark:border-[#1E2A3D]">
                        <DialogTitle className="text-xl font-bold text-[#0B1C2D] dark:text-white">
                            {t('projects.detail.contracts.title')}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                            {contractDialogContext?.projectTitle ??
                                t('projects.detail.contracts.project_fallback')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="overflow-y-auto px-6 py-5">
                        {contractDialogContext ? (
                            <ProjectContractWorkspace
                                key={`${contractDialogContext.projectId}:${String(
                                    contractDialogContext.initialContractId ?? 'none'
                                )}`}
                                variant="dialog"
                                projectId={contractDialogContext.projectId}
                                projectTitle={contractDialogContext.projectTitle}
                                projectClientId={contractDialogContext.projectClientId}
                                initialContractId={contractDialogContext.initialContractId}
                                locale={locale}
                                autoGenerate={contractDialogContext.autoGenerate}
                            />
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
