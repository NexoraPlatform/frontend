import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ProjectRequestCardDialogs } from './project-request-card-dialogs';
import type {
    MilestoneProposalDialogState,
    MilestoneProposalResponseDialogState,
} from '../_lib/project-request-card-types';

const t = (key: string, values?: Record<string, any>) =>
    ({
        'client.project_requests.milestone_change_requests.add_title': 'Add milestone',
        'client.project_requests.milestone_change_requests.add_description':
            'Add milestone description',
        'client.project_requests.milestone_change_requests.update_title': 'Update milestone',
        'client.project_requests.milestone_change_requests.update_description':
            'Update milestone description',
        'client.project_requests.milestone_change_requests.delete_title': 'Delete milestone',
        'client.project_requests.milestone_change_requests.delete_description':
            'Delete milestone description',
        'client.project_requests.milestone_change_requests.service_label': 'Service',
        'client.project_requests.milestone_change_requests.title_label': 'Title',
        'client.project_requests.milestone_change_requests.title_placeholder':
            'Title placeholder',
        'client.project_requests.milestone_change_requests.description_label': 'Description',
        'client.project_requests.milestone_change_requests.description_placeholder':
            'Description placeholder',
        'client.project_requests.milestone_change_requests.amount': 'Amount',
        'client.project_requests.milestone_change_requests.reason': 'Reason',
        'client.project_requests.milestone_change_requests.reason_placeholder':
            'Reason placeholder',
        'client.project_requests.milestone_change_requests.before': 'Before',
        'client.project_requests.milestone_change_requests.untitled': 'Untitled',
        'client.project_requests.milestone_change_requests.delete_confirm': `Delete ${values?.milestone ?? ''}`,
        'client.project_requests.milestone_change_requests.submit': 'Submit milestone',
        'client.project_requests.milestone_change_requests.reject_title': 'Reject proposal',
        'client.project_requests.milestone_change_requests.reject_description':
            'Reject proposal description',
        'client.project_requests.milestone_change_requests.client_reason': 'Client reason',
        'client.project_requests.milestone_change_requests.reject_reason_placeholder':
            'Reject reason placeholder',
        'client.project_requests.milestone_change_requests.reject_reason_required':
            'Reject reason required',
        'client.project_requests.milestone_change_requests.submit_reject':
            'Submit reject',
        'client.project_requests.budget.cancel': 'Cancel',
    }[key] ?? key);

function TestHarness({
    onSubmitMilestoneProposal,
    onRejectMilestoneProposalResponse,
    openMilestoneProposalDialog = true,
    openMilestoneProposalResponseDialog = true,
}: {
    onSubmitMilestoneProposal: () => void;
    onRejectMilestoneProposalResponse: (reason: string) => Promise<boolean>;
    openMilestoneProposalDialog?: boolean;
    openMilestoneProposalResponseDialog?: boolean;
}) {
    const [milestoneProposalDialog, setMilestoneProposalDialog] =
        useState<MilestoneProposalDialogState | null>(
            openMilestoneProposalDialog
                ? {
                      mode: 'ADD',
                      providerId: '10',
                      projectLineId: 'line-1',
                      milestoneId: null,
                      title: '',
                      description: '',
                      amount: '',
                      reason: '',
                      serviceName: 'Design',
                      milestoneTitle: '',
                      currentSnapshot: null,
                  }
                : null
        );
    const [milestoneProposalError, setMilestoneProposalError] = useState<string | null>(null);
    const [milestoneProposalResponseDialog, setMilestoneProposalResponseDialog] =
        useState<MilestoneProposalResponseDialogState>(
            openMilestoneProposalResponseDialog
                ? {
                      projectId: 'project-1',
                      proposalId: 'proposal-1',
                      proposalType: 'ADD',
                  }
                : null
        );
    const [milestoneProposalResponseReason, setMilestoneProposalResponseReason] =
        useState('');
    const [milestoneProposalResponseError, setMilestoneProposalResponseError] =
        useState<string | null>(null);

    return (
        <ProjectRequestCardDialogs
            projectId="project-1"
            milestoneProposalDialog={milestoneProposalDialog}
            setMilestoneProposalDialog={setMilestoneProposalDialog}
            milestoneProposalError={milestoneProposalError}
            setMilestoneProposalError={setMilestoneProposalError}
            milestoneProposalDialogLines={[
                { id: 'line-1', service_name: 'Design' },
                { id: 'line-2', service_name: 'Frontend' },
            ]}
            onSubmitMilestoneProposal={onSubmitMilestoneProposal}
            submittingMilestoneProposalKey={null}
            milestoneProposalResponseDialog={milestoneProposalResponseDialog}
            setMilestoneProposalResponseDialog={setMilestoneProposalResponseDialog}
            milestoneProposalResponseReason={milestoneProposalResponseReason}
            setMilestoneProposalResponseReason={setMilestoneProposalResponseReason}
            milestoneProposalResponseError={milestoneProposalResponseError}
            setMilestoneProposalResponseError={setMilestoneProposalResponseError}
            onRejectMilestoneProposalResponse={onRejectMilestoneProposalResponse}
            t={t}
        />
    );
}

describe('ProjectRequestCardDialogs', () => {
    it('updates milestone proposal fields and forwards submit action', () => {
        const onSubmitMilestoneProposal = vi.fn();
        const onRejectMilestoneProposalResponse = vi.fn(async () => true);

        render(
            <TestHarness
                onSubmitMilestoneProposal={onSubmitMilestoneProposal}
                onRejectMilestoneProposalResponse={onRejectMilestoneProposalResponse}
                openMilestoneProposalResponseDialog={false}
            />
        );

        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'API milestone' },
        });
        fireEvent.change(screen.getByLabelText('Reason'), {
            target: { value: 'Clarify backend scope' },
        });
        fireEvent.click(
            screen.getByRole('button', { name: 'Submit milestone', hidden: true })
        );

        expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
            'API milestone'
        );
        expect((screen.getByLabelText('Reason') as HTMLTextAreaElement).value).toBe(
            'Clarify backend scope'
        );
        expect(onSubmitMilestoneProposal).toHaveBeenCalledTimes(1);
    });

    it('validates reject reason and forwards it when provided', async () => {
        const onSubmitMilestoneProposal = vi.fn();
        const onRejectMilestoneProposalResponse = vi.fn(async () => true);

        render(
            <TestHarness
                onSubmitMilestoneProposal={onSubmitMilestoneProposal}
                onRejectMilestoneProposalResponse={onRejectMilestoneProposalResponse}
                openMilestoneProposalDialog={false}
            />
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Submit reject', hidden: true })
        );
        expect(screen.getByText('Reject reason required')).toBeTruthy();

        fireEvent.change(screen.getByLabelText('Client reason'), {
            target: { value: 'Need a smaller scope first' },
        });
        fireEvent.click(
            screen.getByRole('button', { name: 'Submit reject', hidden: true })
        );

        expect(onRejectMilestoneProposalResponse).toHaveBeenCalledWith(
            'Need a smaller scope first'
        );
    });
});
