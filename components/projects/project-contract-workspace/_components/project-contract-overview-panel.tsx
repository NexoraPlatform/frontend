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

type ProjectContractOverviewPanelProps = Pick<
  ProjectContractWorkspaceController,
  'contract' | 'effectiveSummary'
>;

export function ProjectContractOverviewPanel({
  contract,
  effectiveSummary,
}: ProjectContractOverviewPanelProps) {
  const t = useTranslations('projects.detail.contracts');

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
      <Card className="border-slate-200 dark:border-[#1E2A3D]">
        <CardHeader>
          <CardTitle>{t('overview.title')}</CardTitle>
          <CardDescription>{t('overview.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
              {t('overview.reference')}
            </div>
            <div className="text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
              {effectiveSummary?.reference}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
              {t('overview.signature_level')}
            </div>
            <div className="text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
              {contract?.signature_level
                ? humanizeCode(contract.signature_level)
                : t('summary.unavailable')}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
              {t('overview.governing_law')}
            </div>
            <div className="text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
              {contract?.governing_law_code ?? t('summary.unavailable')}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
              {t('overview.jurisdiction')}
            </div>
            <div className="text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
              {contract?.jurisdiction_label ??
                contract?.jurisdiction_code ??
                t('summary.unavailable')}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
              {t('overview.currency')}
            </div>
            <div className="text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
              {contract?.currency ?? t('summary.unavailable')}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
              {t('overview.template')}
            </div>
            <div className="text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
              {contract?.template_code ?? t('summary.unavailable')}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-[#1E2A3D]">
        <CardHeader>
          <CardTitle>{t('overview.parties_title')}</CardTitle>
          <CardDescription>{t('overview.parties_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(contract?.parties ?? []).length > 0 ? (
            contract?.parties.map((party) => (
              <div
                key={`${party.party_role}-${party.id || party.user_id || party.company_id || party.legal_name}`}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                    {party.legal_name ?? t('overview.unavailable_party')}
                  </div>
                  <Badge variant="outline">{humanizeCode(party.party_role)}</Badge>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-[#A3ADC2]">
                  {[party.country_code, party.signatory_name, party.signatory_title]
                    .filter(Boolean)
                    .join(' • ') || t('summary.unavailable')}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-[#A3ADC2]">
              {t('overview.no_parties')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
