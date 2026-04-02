import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { ProjectContractWorkspaceController } from '../_hooks/use-project-contract-workspace-controller';
import { humanizeCode } from '../_lib/project-contract-workspace-helpers';

type ProjectContractRiskPanelProps = Pick<
  ProjectContractWorkspaceController,
  'latestRiskAssessment' | 'translateIfPresent'
>;

export function ProjectContractRiskPanel({
  latestRiskAssessment,
  translateIfPresent,
}: ProjectContractRiskPanelProps) {
  const t = useTranslations('projects.detail.contracts');

  return (
    <Card className="border-slate-200 dark:border-[#1E2A3D]">
      <CardHeader>
        <CardTitle>{t('risk.title')}</CardTitle>
        <CardDescription>{t('risk.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {latestRiskAssessment ? (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {[
                ['overall', latestRiskAssessment.overall_risk],
                ['misclassification', latestRiskAssessment.misclassification_risk],
                ['gdpr', latestRiskAssessment.gdpr_risk],
                ['ip', latestRiskAssessment.ip_risk],
                ['tax', latestRiskAssessment.tax_risk],
              ].map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80"
                >
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                    {t(`risk.labels.${key}` as never)}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                    {value
                      ? translateIfPresent(
                          `risk_levels.${String(value).toLowerCase()}`,
                          humanizeCode(value)
                        )
                      : t('summary.unavailable')}
                  </div>
                </div>
              ))}
            </div>

            {latestRiskAssessment.warnings.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {t('risk.warnings')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {latestRiskAssessment.warnings.map((warning) => (
                    <Badge
                      key={warning}
                      variant="outline"
                      className="border-amber-200 bg-amber-50 text-amber-700"
                    >
                      {humanizeCode(warning)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {latestRiskAssessment.blocking_reasons.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {t('risk.blocking_reasons')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {latestRiskAssessment.blocking_reasons.map((reason) => (
                    <Badge
                      key={reason}
                      variant="outline"
                      className="border-red-200 bg-red-50 text-red-700"
                    >
                      {humanizeCode(reason)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-500 dark:text-[#A3ADC2]">{t('risk.empty')}</p>
        )}
      </CardContent>
    </Card>
  );
}
