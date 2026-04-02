import {
  AlertCircle,
  Download,
  FileCode2,
  Loader2,
  RefreshCw,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from '@/lib/navigation';
import { cn } from '@/lib/utils';

import type { ProjectContractWorkspaceController } from '../_hooks/use-project-contract-workspace-controller';
import {
  formatDateTime,
  getStatusTone,
  humanizeCode,
} from '../_lib/project-contract-workspace-helpers';
import { ProjectContractDocumentsPanel } from './project-contract-documents-panel';
import { ProjectContractOverviewPanel } from './project-contract-overview-panel';
import { ProjectContractPreviewDialog } from './project-contract-preview-dialog';
import { ProjectContractReviewPanel } from './project-contract-review-panel';
import { ProjectContractRiskPanel } from './project-contract-risk-panel';
import { ProjectContractSignaturePanel } from './project-contract-signature-panel';

type ProjectContractWorkspaceContentProps = {
  className?: string;
  controller: ProjectContractWorkspaceController;
  projectTitle?: string | null;
};

export function ProjectContractWorkspaceContent({
  className,
  controller,
  projectTitle,
}: ProjectContractWorkspaceContentProps) {
  const t = useTranslations('projects.detail.contracts');

  return (
    <div className={cn('space-y-5', className)}>
      {controller.loading || controller.userLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      ) : null}

      {!controller.loading && !controller.userLoading && !controller.user ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('unauthenticated.title')}</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{t('unauthenticated.description')}</span>
            <Button asChild size="sm">
              <Link href="/auth/signin">{t('unauthenticated.cta')}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {!controller.loading &&
      !controller.userLoading &&
      controller.user &&
      !controller.effectiveSummary &&
      !controller.canGenerate ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('restricted.title')}</AlertTitle>
          <AlertDescription>{t('restricted.description')}</AlertDescription>
        </Alert>
      ) : null}

      {controller.workspaceError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('errors.title')}</AlertTitle>
          <AlertDescription>{controller.workspaceError}</AlertDescription>
        </Alert>
      ) : null}

      {!controller.loading &&
      !controller.userLoading &&
      controller.user &&
      !controller.effectiveSummary &&
      !controller.loadingContract &&
      !controller.generating ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 dark:border-[#1E2A3D] dark:bg-[#0F172A]/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#0B1C2D] dark:text-[#E6EDF3]">
                <Scale className="h-5 w-5 text-[#1BC47D]" />
                <h3 className="text-lg font-semibold">{t('empty.title')}</h3>
              </div>
              <p className="max-w-2xl text-sm text-slate-600 dark:text-[#A3ADC2]">
                {t('empty.description')}
              </p>
            </div>

            {controller.canGenerate ? (
              <Button
                type="button"
                onClick={() => {
                  void controller.handleGenerate();
                }}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {controller.generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t('actions.generate')}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {controller.effectiveSummary ? (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'capitalize',
                    getStatusTone(controller.effectiveSummary.status)
                  )}
                >
                  {controller.translateIfPresent(
                    `statuses.${controller.effectiveSummary.status}`,
                    humanizeCode(controller.effectiveSummary.status)
                  )}
                </Badge>
                {controller.effectiveSummary.requires_manual_review ? (
                  <Badge
                    variant="outline"
                    className="border-amber-200 bg-amber-50 text-amber-700"
                  >
                    {t('flags.manual_review')}
                  </Badge>
                ) : null}
                {controller.effectiveSummary.requires_qes ? (
                  <Badge
                    variant="outline"
                    className="border-blue-200 bg-blue-50 text-blue-700"
                  >
                    {t('flags.qes')}
                  </Badge>
                ) : null}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {controller.effectiveSummary.reference || t('overview.reference_fallback')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-[#A3ADC2]">
                  {t('overview.reference_description', {
                    project: projectTitle || t('project_fallback'),
                  })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void controller.handleRefresh();
                }}
                disabled={controller.loadingContract}
              >
                {controller.loadingContract ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {t('actions.refresh')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void controller.handlePreviewHtml();
                }}
                disabled={controller.previewLoading}
              >
                {controller.previewLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileCode2 className="mr-2 h-4 w-4" />
                )}
                {t('actions.preview_html')}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  void controller.handleDownloadPdf();
                }}
                disabled={controller.downloading}
                className="bg-[#0B1C2D] text-white hover:bg-[#10263F] dark:bg-[#E6EDF3] dark:text-[#0B1220] dark:hover:bg-white"
              >
                {controller.downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {t('actions.download_pdf')}
              </Button>
              {controller.canGenerate ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void controller.handleGenerate();
                  }}
                  disabled={controller.generating}
                >
                  {controller.generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  {t('actions.generate_new_version')}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                {t('summary.generated')}
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                {formatDateTime(controller.contract?.generated_at ?? null, controller.locale) ??
                  t('summary.unavailable')}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                {t('summary.documents')}
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                {controller.currentDocuments.length}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                {t('summary.milestones')}
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                {controller.contract?.milestones.length ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                {t('summary.risk')}
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                {controller.latestRiskAssessment?.overall_risk
                  ? controller.translateIfPresent(
                      `risk_levels.${String(
                        controller.latestRiskAssessment.overall_risk
                      ).toLowerCase()}`,
                      humanizeCode(controller.latestRiskAssessment.overall_risk)
                    )
                  : t('summary.unavailable')}
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
              <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
              <TabsTrigger value="documents">{t('tabs.documents')}</TabsTrigger>
              <TabsTrigger value="risk">{t('tabs.risk')}</TabsTrigger>
              <TabsTrigger value="review">{t('tabs.review')}</TabsTrigger>
              <TabsTrigger value="signature">{t('tabs.signature')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <ProjectContractOverviewPanel {...controller} />
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <ProjectContractDocumentsPanel {...controller} />
            </TabsContent>

            <TabsContent value="risk" className="mt-4">
              <ProjectContractRiskPanel {...controller} />
            </TabsContent>

            <TabsContent value="review" className="mt-4">
              <ProjectContractReviewPanel {...controller} />
            </TabsContent>

            <TabsContent value="signature" className="mt-4">
              <ProjectContractSignaturePanel {...controller} />
            </TabsContent>
          </Tabs>
        </>
      ) : null}

      <ProjectContractPreviewDialog {...controller} />
    </div>
  );
}
