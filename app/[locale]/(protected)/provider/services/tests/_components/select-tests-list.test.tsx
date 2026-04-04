import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SelectTestsList } from './select-tests-list';

vi.mock('next-intl', () => ({
    useLocale: () => 'en',
    useTranslations: () => (key: string, values?: Record<string, any>) =>
        values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock('@/components/dashboard/provider-dashboard-shell', () => ({
    ProviderDashboardShell: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}));

describe('SelectTestsList', () => {
    const testData = [
        {
            serviceId: 'svc-processing',
            serviceName: 'Node.js',
            level: 'senior',
            category: 'Backend',
        },
        {
            serviceId: 'svc-cooldown',
            serviceName: 'Laravel',
            level: 'mid',
            category: 'Backend',
        },
        {
            serviceId: 'svc-failed',
            serviceName: 'React',
            level: 'junior',
            category: 'Frontend',
        },
        {
            serviceId: 'svc-ready',
            serviceName: 'Go',
            level: 'expert',
            category: 'Backend',
        },
    ];

    const serviceTests = {
        'svc-processing:senior': {
            serviceInfo: testData[0],
            requestId: 'req-1',
            userTestId: null,
            status: 'processing',
            test: null,
            error: null,
            nextAvailableAt: null,
        },
        'svc-cooldown:mid': {
            serviceInfo: testData[1],
            requestId: null,
            userTestId: null,
            status: 'cooldown',
            test: null,
            error: 'Cooldown active',
            nextAvailableAt: '2026-04-03T10:00:00.000Z',
        },
        'svc-failed:junior': {
            serviceInfo: testData[2],
            requestId: null,
            userTestId: null,
            status: 'failed',
            test: null,
            error: 'Generation failed',
            nextAvailableAt: null,
        },
        'svc-ready:expert': {
            serviceInfo: testData[3],
            requestId: 'req-4',
            userTestId: 'user-test-4',
            status: 'completed',
            test: {
                id: 'test-4',
                title: 'Go Certification',
                description: 'Concurrency and services',
                totalQuestions: 12,
                questions: new Array(12).fill({ id: 'q1' }),
                timeLimit: 30,
                passingScore: 80,
            },
            error: null,
            nextAvailableAt: null,
        },
    } as const;

    it('renders the different service states and starts a completed test', () => {
        const onBack = vi.fn();
        const onStartRequested = vi.fn();

        render(
            <SelectTestsList
                error=""
                loadingTests={false}
                onBack={onBack}
                onStartRequested={onStartRequested}
                onStartWarningConfirm={vi.fn()}
                onStartWarningOpenChange={vi.fn()}
                serviceTests={serviceTests as any}
                startWarningOpen={false}
                testData={testData}
                StartWarningDialogComponent={() => null}
            />
        );

        expect(screen.getByText('Node.js')).toBeTruthy();
        expect(screen.getByText('Cooldown active')).toBeTruthy();
        expect(screen.getByText('Generation failed')).toBeTruthy();
        expect(screen.getByText('Go Certification')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'list.startTest' }));

        expect(onStartRequested).toHaveBeenCalledWith({
            test: serviceTests['svc-ready:expert'].test,
            serviceInfo: testData[3],
            requestId: 'req-4',
            userTestId: 'user-test-4',
        });
    });

    it('renders the empty state and preserves the back action', () => {
        const onBack = vi.fn();

        render(
            <SelectTestsList
                error=""
                loadingTests={false}
                onBack={onBack}
                onStartRequested={vi.fn()}
                onStartWarningConfirm={vi.fn()}
                onStartWarningOpenChange={vi.fn()}
                serviceTests={{}}
                startWarningOpen={false}
                testData={[]}
                StartWarningDialogComponent={() => null}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'list.back' }));

        expect(screen.getByText('list.emptyTitle')).toBeTruthy();
        expect(onBack).toHaveBeenCalledTimes(1);
    });
});
