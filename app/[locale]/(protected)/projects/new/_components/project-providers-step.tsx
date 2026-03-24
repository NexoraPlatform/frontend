'use client';

import { useTranslations } from 'next-intl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';

type ProjectProvidersStepProps = {
  [key: string]: any;
};

export default function ProjectProvidersStep({
  briefResult,
  briefStatus,
  currentStepNumber,
  formatMilestoneDurationDays,
  getProviderDisplayName,
  getProviderId,
  getServiceKey,
  handleAssignMilestoneToProvider,
  handleRemoveMilestoneAssignment,
  handleToggleProvider,
  isProviderSelected,
  milestoneAssignments,
  projectInputMode,
  providerSelectionGroups,
  reviewMilestonesByService,
  selectedProviders,
  selectedProvidersCountByService,
  transitionTo,
  wizardCardClass,
  wizardCardStyle,
}: ProjectProvidersStepProps) {
  const t = useTranslations();

  return (
    <Card className={wizardCardClass} style={wizardCardStyle}>
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
          {t('step_2')} {currentStepNumber ?? 4}: {t('provider_selection')}
        </CardTitle>
        <CardDescription className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('for_each_service_select_recommended_providers_or_choose_alternatives_from_the_extended')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {providerSelectionGroups.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('there_are_no_provider_recommendations_yet_you_can_continue_to_connections_without')}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {providerSelectionGroups.map((group: any, groupIndex: number) => {
              const serviceKey = getServiceKey(group.service_name);
              const selectedCount = selectedProvidersCountByService.get(serviceKey) ?? 0;
              const serviceMilestones = reviewMilestonesByService.get(serviceKey) ?? [];
              const unassignedMilestones = serviceMilestones.filter(
                (entry: any) => milestoneAssignments[entry.key] === undefined
              );

              const renderProviderCard = (
                provider: any,
                tone: 'recommended' | 'other'
              ) => {
                const providerId = getProviderId(provider);
                const checked = isProviderSelected(group.service_name, provider);
                const assignedMilestones =
                  providerId === null
                    ? []
                    : serviceMilestones.filter(
                        (entry: any) => milestoneAssignments[entry.key] === providerId
                      );
                const activeClass =
                  tone === 'recommended'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:border-emerald-500/50 dark:bg-emerald-500/10'
                    : 'border-blue-500 bg-blue-50/70 dark:border-blue-500/50 dark:bg-blue-500/10';

                return (
                  <Card
                    key={`${tone}-${group.service_name}-${providerId ?? getProviderDisplayName(provider)}`}
                    className={`cursor-pointer border transition ${
                      checked ? activeClass : 'border-slate-200 dark:border-[#1E2A3D]'
                    }`}
                    onClick={() => handleToggleProvider(group.service_name, provider)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {getProviderDisplayName(provider)}
                          </CardTitle>
                          <CardDescription>
                            {t('match_score')}:{' '}
                            {typeof provider.matchScore === 'number'
                              ? `${provider.matchScore}%`
                              : t('n_a')}
                          </CardDescription>
                          <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-[#A3ADC2]">
                            <span>
                              {t('rating')}:{' '}
                              {typeof provider.rating === 'number'
                                ? provider.rating.toFixed(2)
                                : t('n_a')}
                            </span>
                            <span>
                              {t('reviews')}:{' '}
                              {typeof provider.reviewCount === 'number'
                                ? provider.reviewCount
                                : t('n_a')}
                            </span>
                          </div>
                        </div>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() =>
                            handleToggleProvider(group.service_name, provider)
                          }
                          aria-label={t('select_item_aria', {
                            name: getProviderDisplayName(provider),
                          })}
                        />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {Array.isArray(provider.matchReasons) &&
                      provider.matchReasons.length > 0 ? (
                        <ul className="space-y-1 text-xs text-slate-600 dark:text-[#A3ADC2]">
                          {provider.matchReasons.slice(0, 3).map((reason: string, reasonIndex: number) => (
                            <li key={`${tone}-reason-${providerId ?? reasonIndex}-${reasonIndex}`}>
                              • {reason}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {checked ? (
                        <div className="space-y-3 rounded-md border border-slate-200/80 bg-white/70 p-2 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                          <div className="space-y-1">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                              {t('milestones_available_for_assignment')}
                            </div>
                            {unassignedMilestones.length > 0 ? (
                              <div className="space-y-1">
                                {unassignedMilestones.map((entry: any) => (
                                  <div
                                    key={`available-${entry.key}-${providerId ?? 'unknown'}`}
                                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-[#1E2A3D] dark:bg-[#0F172A]"
                                  >
                                    <span className="truncate text-slate-700 dark:text-[#C9D4E7]">
                                      {entry.milestone.title}
                                      {formatMilestoneDurationDays(entry.milestone.duration_days)
                                        ? ` • ${formatMilestoneDurationDays(entry.milestone.duration_days)}`
                                        : ''}
                                    </span>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        handleAssignMilestoneToProvider(
                                          group.service_name,
                                          entry.key,
                                          provider
                                        );
                                      }}
                                      aria-label={t('assign_milestone_to_provider_aria', {
                                        milestone: entry.milestone.title,
                                        provider: getProviderDisplayName(provider),
                                      })}
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                                {t('no_unassigned_milestones_for_this_service')}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                              {t('assigned_milestones')}
                            </div>
                            {assignedMilestones.length > 0 ? (
                              <div className="space-y-1">
                                {assignedMilestones.map((entry: any) => (
                                  <div
                                    key={`assigned-${entry.key}-${providerId ?? 'unknown'}`}
                                    className="flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs dark:border-emerald-500/40 dark:bg-emerald-500/10"
                                  >
                                    <span className="truncate text-emerald-800 dark:text-emerald-100">
                                      {entry.milestone.title}
                                      {formatMilestoneDurationDays(entry.milestone.duration_days)
                                        ? ` • ${formatMilestoneDurationDays(entry.milestone.duration_days)}`
                                        : ''}
                                    </span>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 text-emerald-700 hover:text-emerald-900 dark:text-emerald-200 dark:hover:text-emerald-100"
                                      onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        handleRemoveMilestoneAssignment(entry.key);
                                      }}
                                      aria-label={t('remove_milestone_assignment_aria', {
                                        milestone: entry.milestone.title,
                                        provider: getProviderDisplayName(provider),
                                      })}
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                                {t('no_milestones_assigned_to_this_provider')}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              };

              return (
                <div
                  key={`provider-group-${group.service_name}-${group.service_id ?? groupIndex}`}
                  className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-base font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                      {group.service_name}
                    </div>
                    <Badge variant="outline">
                      {t('selected')}: {selectedCount}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                      {t('recommended_providers')}
                    </div>
                    {group.recommended.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {group.recommended.map((provider: any) =>
                          renderProviderCard(provider, 'recommended')
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-[#8FA0B8]">
                        {t('no_recommended_providers_for_this_service')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                        {t('other_providers')}
                      </div>
                      <Badge variant="secondary">{t('optional')}</Badge>
                    </div>
                    {group.others.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {group.others.map((provider: any) =>
                          renderProviderCard(provider, 'other')
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-[#8FA0B8]">
                        {t('no_other_providers_available_for_this_service')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-md border border-slate-200 bg-white/80 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
          <span className="font-semibold">
            {t('total_selected_providers')}:
          </span>{' '}
          {selectedProviders.length}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={() =>
              transitionTo(projectInputMode === 'manual' ? 'intent' : 'briefing')
            }
            className="border transition-colors"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--stat-bg)', color: 'var(--text-main)' }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {projectInputMode === 'manual'
              ? t('back_to_project_details')
              : t('back_to_briefing')}
          </Button>

          <Button
            onClick={() => transitionTo('connections')}
            disabled={!briefResult || briefStatus !== 'FINAL'}
            className="bg-[#1BC47D] text-white hover:bg-[#18A96B]"
          >
            {t('continue_to_connections')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
