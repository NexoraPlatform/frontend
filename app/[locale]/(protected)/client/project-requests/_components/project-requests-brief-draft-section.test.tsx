import React, { useState } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { ProjectRequestsBriefDraftSection } from './project-requests-brief-draft-section';
import type { ProjectRequestsBriefDraft } from '../_lib/client-project-requests-types';

vi.mock('@/components/projects/BriefCopilot', () => ({
    default: ({ onApply }: { onApply: (draft: ProjectRequestsBriefDraft) => void }) => (
        <button
            type="button"
            onClick={() =>
                onApply({
                    title: 'AI title',
                    description: 'AI description',
                    budget: '4500',
                    budgetType: 'FIXED',
                    deadline: '',
                    technologies: ['React'],
                    team_structure: [],
                })
            }
        >
            Mock Brief Copilot
        </button>
    ),
}));

vi.mock('@/components/PriceDisplay', () => ({
    PriceDisplay: ({ value }: { value: number }) => <span>{value}</span>,
}));

afterEach(() => {
    cleanup();
});

const t = (key: string) =>
    ({
        'client.project_requests.brief_copilot.draft.title': 'Draft title',
        'client.project_requests.brief_copilot.draft.description': 'Draft description',
        'client.project_requests.brief_copilot.draft.project_title': 'Project title',
        'client.project_requests.brief_copilot.draft.project_title_placeholder': 'Project title placeholder',
        'client.project_requests.brief_copilot.draft.project_description': 'Project description',
        'client.project_requests.brief_copilot.draft.project_description_placeholder': 'Project description placeholder',
        'client.project_requests.brief_copilot.draft.budget': 'Budget',
        'client.project_requests.brief_copilot.draft.budget_placeholder': 'Budget placeholder',
        'client.project_requests.brief_copilot.draft.technologies': 'Technologies',
        'client.project_requests.brief_copilot.draft.technologies_placeholder': 'Technologies placeholder',
        'client.project_requests.brief_copilot.team_title': 'Suggested team',
        'client.project_requests.brief_copilot.draft.empty': 'No draft yet',
        'client.project_requests.brief_copilot.draft.open_form': 'Open project form',
    }[key] ?? key);

function TestHarness({
    onContinueToProjectForm,
    onCopilotApply,
}: {
    onContinueToProjectForm: () => void;
    onCopilotApply: (draft: ProjectRequestsBriefDraft) => void;
}) {
    const [briefDraft, setBriefDraft] = useState<ProjectRequestsBriefDraft>({
        title: '',
        description: '',
        budget: '',
        budgetType: 'FIXED',
        deadline: '',
        technologies: [],
        team_structure: [
            {
                role: 'Frontend Engineer',
                count: 2,
                estimated_cost: 3200,
            },
        ],
    });

    return (
        <ProjectRequestsBriefDraftSection
            briefDraft={briefDraft}
            setBriefDraft={setBriefDraft}
            parseTechnologies={(value) =>
                value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
            }
            onContinueToProjectForm={onContinueToProjectForm}
            onCopilotApply={onCopilotApply}
            locale="en"
            t={t}
        />
    );
}

describe('ProjectRequestsBriefDraftSection', () => {
    it('updates form fields and opens the project form action', () => {
        const onContinueToProjectForm = vi.fn();
        const onCopilotApply = vi.fn();

        render(
            <TestHarness
                onContinueToProjectForm={onContinueToProjectForm}
                onCopilotApply={onCopilotApply}
            />
        );

        fireEvent.change(screen.getByLabelText('Project title'), {
            target: { value: 'Migration Platform' },
        });
        fireEvent.change(screen.getByLabelText('Technologies'), {
            target: { value: 'React, Node.js' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Open project form' }));

        expect((screen.getByLabelText('Project title') as HTMLInputElement).value).toBe(
            'Migration Platform'
        );
        expect((screen.getByLabelText('Technologies') as HTMLInputElement).value).toBe(
            'React, Node.js'
        );
        expect(screen.getByText('Suggested team')).toBeTruthy();
        expect(screen.getByText('Frontend Engineer × 2')).toBeTruthy();
        expect(onContinueToProjectForm).toHaveBeenCalledTimes(1);
    });

    it('renders the copilot integration and forwards the apply callback', () => {
        const onContinueToProjectForm = vi.fn();
        const onCopilotApply = vi.fn();

        render(
            <TestHarness
                onContinueToProjectForm={onContinueToProjectForm}
                onCopilotApply={onCopilotApply}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Mock Brief Copilot' }));

        expect(onCopilotApply).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'AI title',
                description: 'AI description',
                technologies: ['React'],
            })
        );
    });
});
