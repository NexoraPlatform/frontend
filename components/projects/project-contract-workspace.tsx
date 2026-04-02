'use client';

import { useTranslations } from 'next-intl';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { ProjectContractWorkspaceContent } from './project-contract-workspace/_components/project-contract-workspace-content';
import { useProjectContractWorkspaceController } from './project-contract-workspace/_hooks/use-project-contract-workspace-controller';
import type { ProjectContractWorkspaceProps } from './project-contract-workspace/_lib/project-contract-workspace-types';

export default function ProjectContractWorkspace(
  props: ProjectContractWorkspaceProps
) {
  const t = useTranslations('projects.detail.contracts');
  const controller = useProjectContractWorkspaceController(props);

  if (props.variant === 'dialog') {
    return (
      <ProjectContractWorkspaceContent
        controller={controller}
        projectTitle={props.projectTitle}
        className={props.className}
      />
    );
  }

  return (
    <Card className={cn('glass-card shadow-sm', props.className)}>
      <CardHeader>
        <CardTitle className="text-xl">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ProjectContractWorkspaceContent
          controller={controller}
          projectTitle={props.projectTitle}
          className={props.className}
        />
      </CardContent>
    </Card>
  );
}
