import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import {
    createEmptyBriefDraft,
    normalizeOptionalText,
    normalizePositiveBudget,
    normalizeStatusValue,
    readCachedProjectContractId,
    renderEscrowStatusControl,
    toFiniteNumber,
} from './client-project-requests-helpers';

const t = (key: string) =>
    ({
        'client.project_requests.escrow.approve': 'Approve',
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

describe('client-project-requests-helpers', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
    });

    afterEach(() => {
        window.sessionStorage.clear();
    });

    it('creates an empty AI brief draft with stable defaults', () => {
        expect(createEmptyBriefDraft()).toEqual({
            title: '',
            description: '',
            budget: '',
            budgetType: 'FIXED',
            deadline: '',
            technologies: [],
            team_structure: [],
        });
    });

    it('reads a cached project contract id from sessionStorage', () => {
        window.sessionStorage.setItem('project-contract:project-42', 'contract-15');

        expect(readCachedProjectContractId('project-42')).toBe('contract-15');
        expect(readCachedProjectContractId('missing')).toBeNull();
        expect(readCachedProjectContractId('')).toBeNull();
    });

    it('normalizes status and numeric helper values safely', () => {
        expect(normalizeStatusValue(' proposed ')).toBe('PROPOSED');
        expect(normalizeStatusValue(undefined, 'pending')).toBe('PENDING');
        expect(toFiniteNumber('150.5')).toBe(150.5);
        expect(toFiniteNumber('abc')).toBeNull();
        expect(normalizePositiveBudget('99')).toBe(99);
        expect(normalizePositiveBudget('-3')).toBeNull();
        expect(normalizeOptionalText('  hello  ')).toBe('hello');
        expect(normalizeOptionalText('   ')).toBeNull();
    });

    it('renders the pending escrow action as a button and opens the provided URL', () => {
        const onOpenUrl = vi.fn();

        render(
            renderEscrowStatusControl({
                statusValue: 'PENDING',
                nextStepUrl: 'https://example.com/next-step',
                audience: 'client',
                t,
                onOpenUrl,
            })
        );

        fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

        expect(onOpenUrl).toHaveBeenCalledWith('https://example.com/next-step');
    });

    it('renders non-actionable escrow states as badges', () => {
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
