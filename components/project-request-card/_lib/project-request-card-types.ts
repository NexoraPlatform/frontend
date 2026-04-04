export interface ProjectRequestCardProps {
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

export type ProjectRequestCardTranslator = (
    key: string,
    values?: Record<string, any>
) => string;

export type MilestoneProposalDialogState = {
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

export type MilestoneProposalResponseDialogState = {
    proposalId: string;
    projectId: string;
    proposalType: string;
} | null;
