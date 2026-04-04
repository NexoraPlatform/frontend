import { CheckCircle, Clock, DollarSign, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AiBriefFormDraft } from '@/types/ai';

import type { ProjectRequestsTranslator } from './client-project-requests-types';

export const createEmptyBriefDraft = (): AiBriefFormDraft => ({
    title: '',
    description: '',
    budget: '',
    budgetType: 'FIXED',
    deadline: '',
    technologies: [],
    team_structure: [],
});

export const readCachedProjectContractId = (projectId: string) => {
    if (typeof window === 'undefined' || !projectId) {
        return null;
    }

    try {
        const raw = window.sessionStorage.getItem(`project-contract:${projectId}`);
        return raw && raw.trim() ? raw : null;
    } catch {
        return null;
    }
};

export const normalizeStatusValue = (value: unknown, fallback = '') =>
    String(value ?? fallback).trim().toUpperCase();

export const toFiniteNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
};

export const normalizePositiveBudget = (value: unknown): number | null => {
    const numeric = toFiniteNumber(value);
    if (numeric === null || numeric <= 0) return null;
    return numeric;
};

export const normalizeOptionalText = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

export const openProjectRequestsNextStep = (nextStepUrl: string) => {
    if (typeof window === 'undefined') {
        return;
    }

    window.open(nextStepUrl, '_blank');
};

export const getStatusBadge = (
    status: string,
    t: ProjectRequestsTranslator
) => {
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

export const getMilestoneStatusBadge = (
    status: string,
    t: ProjectRequestsTranslator
) => {
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

export const getMilestonePaymentStatusBadge = (
    status: string,
    t: ProjectRequestsTranslator
) => {
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

type RenderEscrowStatusControlParams = {
    statusValue: unknown;
    nextStepUrl: string | null | undefined;
    audience: 'provider' | 'client';
    t: ProjectRequestsTranslator;
    onOpenUrl?: (url: string) => void;
};

export const renderEscrowStatusControl = ({
    statusValue,
    nextStepUrl,
    audience: _audience,
    t,
    onOpenUrl = openProjectRequestsNextStep,
}: RenderEscrowStatusControlParams) => {
    const status = normalizeStatusValue(statusValue, '');
    if (!status) {
        return null;
    }

    const badgeClassName =
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium';

    const renderBadge = (label: string, className: string) => (
        <Badge className={`${badgeClassName} ${className}`}>{label}</Badge>
    );

    switch (status) {
        case 'PENDING':
            if (nextStepUrl) {
                return (
                    <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        onClick={() => onOpenUrl(nextStepUrl)}
                    >
                        {t('client.project_requests.escrow.approve')}
                    </Button>
                );
            }
            return renderBadge(
                t('client.project_requests.escrow.approve'),
                'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
            );
        case 'AWAITING_PAYMENT':
            return renderBadge(
                t('client.project_requests.escrow.awaiting_payment'),
                'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
            );
        case 'FUNDED':
            return renderBadge(
                t('client.project_requests.escrow.funded'),
                'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
            );
        case 'ACTION_REQUIRED':
            if (nextStepUrl) {
                return (
                    <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                        onClick={() => onOpenUrl(nextStepUrl)}
                    >
                        {t('client.project_requests.escrow.action_required')}
                    </Button>
                );
            }
            return renderBadge(
                t('client.project_requests.escrow.action_required'),
                'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200'
            );
        case 'DELIVERED':
            return renderBadge(
                t('client.project_requests.escrow.delivered'),
                'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200'
            );
        case 'REJECTED':
            return renderBadge(
                t('client.project_requests.escrow.rejected'),
                'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
            );
        case 'REVISION_REQUIRED':
            return renderBadge(
                t('client.project_requests.escrow.revision_required'),
                'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200'
            );
        case 'APPROVED':
            return renderBadge(
                t('client.project_requests.escrow.approved'),
                'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
            );
        case 'IN_PROGRESS':
            return renderBadge(
                t('client.project_requests.escrow.in_progress'),
                'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200'
            );
        case 'CANCELLED':
            return renderBadge(
                t('client.project_requests.escrow.cancelled'),
                'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-200'
            );
        case 'COMPLETED':
            return renderBadge(
                t('client.project_requests.escrow.completed'),
                'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
            );
        default:
            return null;
    }
};
