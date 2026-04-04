import type { AiBriefFormDraft } from '@/types/ai';

export type ClientProjectRequestsProps = {
    withLayout?: boolean;
};

export type BudgetRejectionDialogState = {
    projectId: string;
    providerId: string;
} | null;

export type ContractDialogContext = {
    projectId: string;
    projectTitle?: string | null;
    projectClientId?: string | number | null;
    initialContractId?: string | number | null;
    autoGenerate?: boolean;
} | null;

export type ReplacementContext = {
    projectId: string;
    milestoneId: string;
    milestoneTitle: string;
    excludeProviderId?: string;
} | null;

export type MilestoneProposalResponseDialogState = {
    projectId: string;
    proposalId: string;
} | null;

export type ProjectRequestsTranslator = (
    key: string,
    values?: Record<string, any>
) => string;

export type ProjectRequestsBriefDraft = AiBriefFormDraft;
