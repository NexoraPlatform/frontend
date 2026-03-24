'use client';

import { useTranslations } from 'next-intl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PriceDisplay } from '@/components/PriceDisplay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

type ProjectReviewStepProps = {
  [key: string]: any;
};

const PAYMENT_PLAN_OPTIONS = [
  { value: 'FULL', labelKey: 'payment_plan_full' },
  { value: 'MILESTONE', labelKey: 'payment_plan_milestone' },
  { value: 'MONTHLY', labelKey: 'payment_plan_monthly' },
] as const;

export default function ProjectReviewStep({
  briefFullDetails,
  briefPayloadTrimmedSections,
  briefPayloadTruncated,
  briefResult,
  briefingDisplay,
  briefingProjectLines,
  budgetValue,
  canEditPaymentPlanByDuration,
  creatingProject,
  currentStepNumber,
  editableDuration,
  effectiveDuration,
  effectivePaymentPlan,
  formatMilestoneDurationDays,
  fullBusinessAnalysis,
  fullComplexityEntries,
  fullComplexityEstimationEntries,
  fullFeatureBusinessValue,
  fullTargetUsers,
  fullTeamRecommendationEntries,
  fullTechnicalRisks,
  fullTechStackItems,
  handleCreateProject,
  linesMissingMilestones,
  ndaActive,
  allowOpenSource,
  requiresMilestonesByDuration,
  reviewLines,
  reviewMilestonesExceedTotalBudget,
  reviewMilestonesTotal,
  setAllowOpenSource,
  setEditableDuration,
  setEditablePaymentPlan,
  setNdaActive,
  setTotalBudget,
  totalBudget,
  transitionTo,
  wizardCardClass,
  wizardCardStyle,
}: ProjectReviewStepProps) {
  const t = useTranslations();

  return (
    <Card className={wizardCardClass} style={wizardCardStyle}>
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
          {t('step_2')} {currentStepNumber ?? 6}: {t('review_create')}
        </CardTitle>
        <CardDescription className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('review_budget_distribution_for_each_line_then_create_the_modular_project')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {briefPayloadTruncated ? (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p>
                {t('review_data_comes_from_a_compacted_payload_broadcast_limit_10kb')}
              </p>
              {briefPayloadTrimmedSections.length > 0 ? (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide">
                    {t('compacted_sections')}
                  </div>
                  <ul className="mt-1 space-y-1 text-xs">
                    {briefPayloadTrimmedSections.map((section: string, index: number) => (
                      <li key={`review-trimmed-${section}-${index}`}>• {section}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        {briefResult ? (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]">
            <h4 className="text-base font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
              {t('final_summary_for_creation')}
            </h4>
            {briefingDisplay.description ? (
              <p className="text-sm text-slate-700 dark:text-[#C9D4E7]">
                {briefingDisplay.description}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                  {t('ai_budget')}
                </div>
                <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {typeof briefingDisplay.budget === 'number'
                    ? `$${briefingDisplay.budget.toLocaleString()}`
                    : '—'}
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                  {t('duration')}
                </div>
                <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {effectiveDuration || '—'}
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                  {t('payment_plan')}
                </div>
                <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {effectivePaymentPlan || '—'}
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                  {t('currency')}
                </div>
                <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {briefingDisplay.currency || 'USD'}
                </div>
              </div>
            </div>
            {(typeof briefingDisplay.budgetMin === 'number' || typeof briefingDisplay.budgetMax === 'number') ? (
              <div className="text-xs text-slate-600 dark:text-[#A3ADC2]">
                {t('range')}:{' '}
                {typeof briefingDisplay.budgetMin === 'number'
                  ? `$${briefingDisplay.budgetMin.toLocaleString()}`
                  : '—'}
                {' - '}
                {typeof briefingDisplay.budgetMax === 'number'
                  ? `$${briefingDisplay.budgetMax.toLocaleString()}`
                  : '—'}
              </div>
            ) : null}

            <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                {t('final_contract_configuration')}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="project-duration">{t('project_duration')}</Label>
                  <Input
                    id="project-duration"
                    value={editableDuration}
                    onChange={(event) => setEditableDuration(event.target.value)}
                    placeholder={t('ex_2months_1month_6months')}
                  />
                  <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                    {t('duration_is_validated_against_the_mandatory_milestones_rule_for_projects_over_3')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-plan">{t('payment_plan')}</Label>
                  <Select
                    value={effectivePaymentPlan || undefined}
                    onValueChange={(value) => setEditablePaymentPlan(value)}
                    disabled={!canEditPaymentPlanByDuration}
                  >
                    <SelectTrigger id="payment-plan">
                      <SelectValue placeholder={t('select_payment_plan')} />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_PLAN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                    {canEditPaymentPlanByDuration
                      ? t('for_durations_up_to_3_months_the_payment_plan_can_be_changed')
                      : t('for_durations_over_3_months_the_payment_plan_cannot_be_changed_at')}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                {t('project_terms_title')}
              </div>
              <p className="mb-3 text-xs text-slate-500 dark:text-[#8FA0B8]">
                {t('project_terms_license_provider_fixed')}
              </p>
              <div className="space-y-3">
                <label
                  htmlFor="project-term-nda"
                  className="flex items-start gap-3 rounded-md border border-slate-200 px-3 py-3 text-sm dark:border-[#1E2A3D]"
                >
                  <Checkbox
                    id="project-term-nda"
                    checked={ndaActive}
                    onCheckedChange={(checked) => setNdaActive(Boolean(checked))}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <div className="font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                      {t('project_terms_nda_label')}
                    </div>
                    <p className="text-xs leading-5 text-slate-500 dark:text-[#8FA0B8]">
                      {t('project_terms_nda_description')}
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="project-term-open-source"
                  className="flex items-start gap-3 rounded-md border border-slate-200 px-3 py-3 text-sm dark:border-[#1E2A3D]"
                >
                  <Checkbox
                    id="project-term-open-source"
                    checked={allowOpenSource}
                    onCheckedChange={(checked) => setAllowOpenSource(Boolean(checked))}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <div className="font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                      {t('project_terms_open_source_label')}
                    </div>
                    <p className="text-xs leading-5 text-slate-500 dark:text-[#8FA0B8]">
                      {t('project_terms_open_source_description')}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {requiresMilestonesByDuration && linesMissingMilestones.length > 0 ? (
              <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('for_durations_over_3_months_milestones_are_mandatory_on_each_line')}{' '}
                  {t('missing_for')}: {linesMissingMilestones.join(', ')}.
                </AlertDescription>
              </Alert>
            ) : null}

            {briefingDisplay.overview || briefingDisplay.clientGoal || briefingDisplay.targetAudience ? (
              <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                  {t('final_brief_modular')}
                </div>
                {briefingDisplay.overview ? (
                  <p className="text-slate-700 dark:text-[#C9D4E7]">
                    <span className="font-semibold">{t('overview')}:</span>{' '}
                    {briefingDisplay.overview}
                  </p>
                ) : null}
                {briefingDisplay.clientGoal ? (
                  <p className="mt-1 text-slate-700 dark:text-[#C9D4E7]">
                    <span className="font-semibold">{t('client_goal')}:</span>{' '}
                    {briefingDisplay.clientGoal}
                  </p>
                ) : null}
                {briefingDisplay.targetAudience ? (
                  <p className="mt-1 text-slate-700 dark:text-[#C9D4E7]">
                    <span className="font-semibold">{t('target_audience')}:</span>{' '}
                    {briefingDisplay.targetAudience}
                  </p>
                ) : null}
              </div>
            ) : null}

            {briefingDisplay.technologies.length > 0 ? (
              <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                  {t('technologies')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {briefingDisplay.technologies.map((item: string, index: number) => (
                    <Badge key={`${item}-review-tech-${index}`} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {briefingDisplay.specificRequirements.length > 0 ? (
              <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                  {t('specific_requirements')}
                </div>
                <ul className="space-y-1 text-sm text-slate-700 dark:text-[#C9D4E7]">
                  {briefingDisplay.specificRequirements.map((item: string, index: number) => (
                    <li key={`${item}-review-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {briefingDisplay.milestones.length > 0 ? (
              <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                  {t('milestones_plan')}
                </div>
                <div className="space-y-1 text-sm text-slate-700 dark:text-[#C9D4E7]">
                  {briefingDisplay.milestones.map((milestone: any, index: number) => (
                    <div key={`${milestone.title}-review-${index}`}>
                      {index + 1}. {milestone.title}
                      {' - '}
                      {typeof milestone.amount === 'number'
                        ? `$${milestone.amount.toLocaleString()}`
                        : t('n_a')}
                      {formatMilestoneDurationDays(milestone.duration_days)
                        ? ` • ${formatMilestoneDurationDays(milestone.duration_days)}`
                        : ''}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {briefingProjectLines.length > 0 ? (
              <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                  {t('final_brief_final_brief_modular_project_lines')}
                </div>
                <div className="space-y-2">
                  {briefingProjectLines.map((line: any, index: number) => (
                    <div
                      key={`${line.service_name}-review-line-${index}`}
                      className="flex flex-wrap items-center justify-between rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-[#1E2A3D] dark:bg-[#0F172A]"
                    >
                      <div className="flex items-center gap-2">
                        {line.service_name}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-[#A3ADC2]">
                        {line.budget_percentage}% ({line.milestones.length}{' '}
                        {t('milestones_2')})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {(fullBusinessAnalysis?.problem_statement || fullTechnicalRisks.length > 0) ? (
              <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                  {t('final_brief_full')}
                </div>
                {fullBusinessAnalysis?.problem_statement ? (
                  <p className="text-sm text-slate-700 dark:text-[#C9D4E7]">
                    <span className="font-semibold">
                      {t('problem_statement')}:
                    </span>{' '}
                    {String(fullBusinessAnalysis.problem_statement)}
                  </p>
                ) : null}
                {fullTechnicalRisks.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-[#C9D4E7]">
                    {fullTechnicalRisks.map((risk: string, index: number) => (
                      <li key={`${risk}-review-risk-${index}`}>• {risk}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="total-budget">
            {t('total_project_budget_usd')}
          </Label>
          <Input
            id="total-budget"
            type="number"
            min="0"
            value={totalBudget}
            onChange={(event) => setTotalBudget(event.target.value)}
            placeholder={t('ex_25000')}
          />
          {budgetValue > 0 ? (
            <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">
              {t('manual_total_milestones_summary')}: {' '}
              <span className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                <PriceDisplay value={reviewMilestonesTotal} />
              </span>
            </div>
          ) : null}
          {reviewMilestonesExceedTotalBudget ? (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              <AlertDescription>
                {t('manual_milestones_exceed_total_budget')}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-[#1E2A3D]">
          <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
            {t('budget_distribution_by_lines')}
          </div>
          <div className="space-y-2">
            {reviewLines.map((line: any, index: number) => (
              <div
                key={`${line.service_name}-${index}`}
                className="flex flex-wrap items-center justify-between rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-[#1E2A3D] dark:bg-[#0F172A]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{line.service_name}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-[#A3ADC2]">
                  {line.budget_percentage}% - ${line.budget_allocation.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => transitionTo('connections')}
            className="border transition-colors"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--stat-bg)', color: 'var(--text-main)' }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back_to_connections')}
          </Button>

          <Button
            onClick={() => void handleCreateProject()}
            disabled={
              creatingProject ||
              !briefResult ||
              !effectiveDuration ||
              !effectivePaymentPlan
            }
            className="bg-[#1BC47D] text-white hover:bg-[#18A96B]"
          >
            {creatingProject ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('creating_project')}
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t('create_project')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
