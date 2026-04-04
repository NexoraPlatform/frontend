import { Target } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import type { ProjectRequestsTranslator } from '../_lib/client-project-requests-types';

type ProjectRequestsEmptyStateProps = {
    t: ProjectRequestsTranslator;
    onCreateProject: () => void;
};

export function ProjectRequestsEmptyState({
    t,
    onCreateProject,
}: ProjectRequestsEmptyStateProps) {
    return (
        <Card className="glass-card border-transparent shadow-sm">
            <CardContent className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-[rgba(27,196,125,0.12)] flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-[#1BC47D]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#0B1C2D] dark:text-[#E6EDF3]">
                    {t('client.project_requests.empty.title')}
                </h3>
                <p className="text-slate-500 dark:text-[#A3ADC2] mb-6">
                    {t('client.project_requests.empty.description')}
                </p>
                <Button onClick={onCreateProject} className="btn-primary">
                    <Target className="w-4 h-4 mr-2" />
                    {t('client.project_requests.empty.cta')}
                </Button>
            </CardContent>
        </Card>
    );
}
