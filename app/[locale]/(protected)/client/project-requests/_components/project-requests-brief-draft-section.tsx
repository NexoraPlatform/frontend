import type { Dispatch, SetStateAction } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import BriefCopilot from '@/components/projects/BriefCopilot';
import { PriceDisplay } from '@/components/PriceDisplay';

import type {
    ProjectRequestsBriefDraft,
    ProjectRequestsTranslator,
} from '../_lib/client-project-requests-types';

type ProjectRequestsBriefDraftSectionProps = {
    briefDraft: ProjectRequestsBriefDraft;
    setBriefDraft: Dispatch<SetStateAction<ProjectRequestsBriefDraft>>;
    parseTechnologies: (value: string) => string[];
    onContinueToProjectForm: () => void;
    onCopilotApply: (draft: ProjectRequestsBriefDraft) => void;
    locale: string;
    t: ProjectRequestsTranslator;
};

export function ProjectRequestsBriefDraftSection({
    briefDraft,
    setBriefDraft,
    parseTechnologies,
    onContinueToProjectForm,
    onCopilotApply,
    locale,
    t,
}: ProjectRequestsBriefDraftSectionProps) {
    return (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
            <Card className="glass-card border-transparent shadow-sm">
                <CardHeader>
                    <CardTitle className="text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {t('client.project_requests.brief_copilot.draft.title')}
                    </CardTitle>
                    <CardDescription>
                        {t('client.project_requests.brief_copilot.draft.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="brief-draft-title">
                            {t('client.project_requests.brief_copilot.draft.project_title')}
                        </Label>
                        <Input
                            id="brief-draft-title"
                            value={briefDraft.title}
                            onChange={(event) =>
                                setBriefDraft((prev) => ({ ...prev, title: event.target.value }))
                            }
                            placeholder={t('client.project_requests.brief_copilot.draft.project_title_placeholder')}
                        />
                    </div>

                    <div>
                        <Label htmlFor="brief-draft-description">
                            {t('client.project_requests.brief_copilot.draft.project_description')}
                        </Label>
                        <Textarea
                            id="brief-draft-description"
                            value={briefDraft.description}
                            onChange={(event) =>
                                setBriefDraft((prev) => ({
                                    ...prev,
                                    description: event.target.value,
                                }))
                            }
                            rows={5}
                            placeholder={t('client.project_requests.brief_copilot.draft.project_description_placeholder')}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="brief-draft-budget">
                                {t('client.project_requests.brief_copilot.draft.budget')}
                            </Label>
                            <Input
                                id="brief-draft-budget"
                                value={briefDraft.budget}
                                type="number"
                                onChange={(event) =>
                                    setBriefDraft((prev) => ({
                                        ...prev,
                                        budget: event.target.value,
                                    }))
                                }
                                placeholder={t('client.project_requests.brief_copilot.draft.budget_placeholder')}
                            />
                        </div>
                        <div>
                            <Label htmlFor="brief-draft-technologies">
                                {t('client.project_requests.brief_copilot.draft.technologies')}
                            </Label>
                            <Input
                                id="brief-draft-technologies"
                                value={briefDraft.technologies.join(', ')}
                                onChange={(event) =>
                                    setBriefDraft((prev) => ({
                                        ...prev,
                                        technologies: parseTechnologies(event.target.value),
                                    }))
                                }
                                placeholder={t('client.project_requests.brief_copilot.draft.technologies_placeholder')}
                            />
                        </div>
                    </div>

                    {briefDraft.team_structure && briefDraft.team_structure.length > 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                                {t('client.project_requests.brief_copilot.team_title')}
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {briefDraft.team_structure.map((member, index) => (
                                    <div
                                        key={`${member.role}-${index}`}
                                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-[#1E2A3D] dark:bg-[#0F1827]"
                                    >
                                        <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                            {member.role}
                                            {member.count ? ` × ${member.count}` : ''}
                                        </div>
                                        {member.estimated_cost !== undefined ? (
                                            <div className="text-emerald-700 dark:text-emerald-300">
                                                <PriceDisplay value={member.estimated_cost} />
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                            {t('client.project_requests.brief_copilot.draft.empty')}
                        </p>
                    )}

                    <Button
                        type="button"
                        onClick={onContinueToProjectForm}
                        className="w-full btn-primary"
                    >
                        {t('client.project_requests.brief_copilot.draft.open_form')}
                    </Button>
                </CardContent>
            </Card>

            <BriefCopilot locale={locale} onApply={onCopilotApply} />
        </div>
    );
}
