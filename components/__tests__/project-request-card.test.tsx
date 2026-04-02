import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ProjectRequestCard } from '@/components/project-request-card';

vi.mock('@/contexts/auth-context', () => ({
    useAuth: () => ({
        user: {
            id: 900,
            role: 'client',
            role_slugs: ['client'],
        },
        loading: false,
    }),
}));

vi.mock('next-intl', () => ({
    useLocale: () => 'en',
    useTranslations: () => (key: string, values?: Record<string, any>) => {
        if (key === 'client.project_requests.project.selected_providers') {
            return `selected providers ${values?.count ?? 0}`;
        }

        return key;
    },
}));

vi.mock('@/components/PriceDisplay', () => ({
    PriceDisplay: ({ value }: { value: number }) => <span>{value}</span>,
}));

vi.mock('@/components/MuiIcons', () => ({
    MuiIcon: () => <span data-testid="mui-icon" />,
}));

describe('ProjectRequestCard', () => {
    it('renders the refactored card with provider list content', () => {
        render(
            <ProjectRequestCard
                project={{
                    id: 1,
                    title: 'Migration Platform',
                    description: 'Move the product suite to a new stack',
                    status: 'PENDING',
                    budget: { amount: 5000 },
                    project_duration: 'ONE_TO_THREE_MONTHS',
                    created_at: '2026-03-01T10:00:00Z',
                    existing_services: [{ id: 11, name: 'React' }],
                    custom_services: [],
                    selected_providers: [
                        {
                            id: 22,
                            firstName: 'Ana',
                            lastName: 'Pop',
                            location: 'Bucharest',
                            rating: 4.9,
                            provider_response: 'PENDING',
                            services: [{ name: 'Frontend', categoryIcon: 'code' }],
                        },
                    ],
                    project_lines: [],
                    providers: [],
                }}
                onResponse={vi.fn()}
                onRefresh={vi.fn()}
            />
        );

        expect(screen.getByText('Migration Platform')).toBeTruthy();
        expect(screen.getByText('Move the product suite to a new stack')).toBeTruthy();
        expect(screen.getByText('Ana Pop')).toBeTruthy();
        expect(screen.getByText('Frontend')).toBeTruthy();
        expect(screen.getByText('selected providers 1')).toBeTruthy();
    });
});
