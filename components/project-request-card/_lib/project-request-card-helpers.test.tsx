import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import {
    buildNormalizedProviders,
    createMilestoneProposalDialogState,
    getNextMilestoneStatus,
    normalizeOptionalText,
    normalizePositiveBudget,
    normalizeStatusValue,
    renderEscrowStatusControl,
    toFiniteNumber,
} from './project-request-card-helpers';

const t = (key: string) =>
    ({
        'client.project_requests.escrow.approve': 'Approve',
        'client.project_requests.escrow.pay': 'Pay',
        'client.project_requests.escrow.awaiting_payment': 'Awaiting payment',
        'client.project_requests.escrow.funded': 'Funded',
        'client.project_requests.escrow.action_required': 'Action required',
        'client.project_requests.escrow.delivered': 'Delivered',
        'client.project_requests.escrow.rejected': 'Rejected',
        'client.project_requests.escrow.revision_required': 'Revision required',
        'client.project_requests.escrow.approved': 'Approved',
        'client.project_requests.escrow.in_progress': 'In progress',
        'client.project_requests.escrow.cancelled': 'Cancelled',
        'client.project_requests.escrow.completed': 'Completed',
    }[key] ?? key);

describe('project-request-card-helpers', () => {
    it('creates milestone proposal state with safe defaults', () => {
        expect(
            createMilestoneProposalDialogState({
                mode: 'ADD',
                providerId: '15',
                projectLineId: '42',
            })
        ).toEqual({
            mode: 'ADD',
            providerId: '15',
            projectLineId: '42',
            milestoneId: null,
            title: '',
            description: '',
            amount: '',
            reason: '',
            serviceName: '',
            milestoneTitle: '',
            currentSnapshot: null,
        });
    });

    it('normalizes numeric, text, and status values safely', () => {
        expect(normalizeStatusValue(' pending ')).toBe('PENDING');
        expect(toFiniteNumber('1200.5')).toBe(1200.5);
        expect(toFiniteNumber('abc')).toBeNull();
        expect(normalizePositiveBudget('500')).toBe(500);
        expect(normalizePositiveBudget('-20')).toBeNull();
        expect(normalizeOptionalText('  reason  ')).toBe('reason');
        expect(normalizeOptionalText('    ')).toBeNull();
    });

    it('derives the next milestone status from the current flow', () => {
        expect(getNextMilestoneStatus('PENDING')).toBe('work_in_progress');
        expect(getNextMilestoneStatus('BLOCKED')).toBe('work_in_progress');
        expect(getNextMilestoneStatus('IN_PROGRESS')).toBe('finished');
        expect(getNextMilestoneStatus('PAID')).toBeNull();
    });

    it('builds normalized providers with services inferred from project lines', () => {
        const normalized = buildNormalizedProviders({
            project: {
                status: 'pending',
                providers: [{ id: 7, name: 'Ana Ionescu' }],
            },
            projectLines: [
                {
                    id: 10,
                    service_id: 88,
                    service_name: 'Design',
                    providers: [{ id: 7 }],
                },
            ],
            selectedProviders: [],
        });

        expect(normalized).toHaveLength(1);
        expect(normalized[0]).toEqual(
            expect.objectContaining({
                id: '7',
                firstName: 'Ana',
                lastName: 'Ionescu',
                provider_response: 'PENDING',
                services: [expect.objectContaining({ name: 'Design' })],
            })
        );
    });

    it('renders actionable escrow states as buttons', () => {
        const onOpenUrl = vi.fn();

        render(
            renderEscrowStatusControl({
                statusValue: 'PENDING',
                nextStepUrl: 'https://example.com/approve',
                audience: 'provider',
                t,
                onOpenUrl,
            })
        );

        fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

        expect(onOpenUrl).toHaveBeenCalledWith('https://example.com/approve');
    });

    it('renders passive escrow states as badges', () => {
        render(
            renderEscrowStatusControl({
                statusValue: 'AWAITING_PAYMENT',
                nextStepUrl: null,
                audience: 'client',
                t,
            })
        );

        expect(screen.getByText('Awaiting payment')).toBeTruthy();
    });
});
