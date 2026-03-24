'use client';

import { useTranslations } from 'next-intl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

type ProjectConnectionsStepProps = {
  [key: string]: any;
};

export default function ProjectConnectionsStep({
  canContinueFromConnections,
  connectedOAuthProviders,
  currentStepNumber,
  getLocalizedOAuthProviderLabel,
  getOAuthProviderIcon,
  handleConnectOAuthProvider,
  missingOAuthProviders,
  requiredOAuthProviders,
  requiredOAuthProvidersByService,
  transitionTo,
  wizardCardClass,
  wizardCardStyle,
}: ProjectConnectionsStepProps) {
  const t = useTranslations();

  return (
    <Card className={wizardCardClass} style={wizardCardStyle}>
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
          {t('step_2')} {currentStepNumber ?? 5}: {t('provider_connections')}
        </CardTitle>
        <CardDescription className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('connect_required_delivery_providers_for_selected_services')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {requiredOAuthProviders.length === 0 ? (
          <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              {t('no_delivery_provider_connections_required')}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {requiredOAuthProviders.map((provider: any) => {
              const isConnected = connectedOAuthProviders.has(provider);
              const requiredServices = requiredOAuthProvidersByService.get(provider) ?? [];

              return (
                <Card
                  key={`oauth-provider-${provider}`}
                  className={`border transition ${
                    isConnected
                      ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                      : 'border-slate-200 dark:border-[#1E2A3D]'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {getOAuthProviderIcon(provider)}
                        <CardTitle className="text-base">
                          {getLocalizedOAuthProviderLabel(provider)}
                        </CardTitle>
                      </div>
                      <Badge variant={isConnected ? 'default' : 'secondary'}>
                        {isConnected ? t('connected') : t('not_connected')}
                      </Badge>
                    </div>
                    {requiredServices.length > 0 ? (
                      <CardDescription>
                        {t('required_for_services')}: {requiredServices.join(', ')}
                      </CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    <Button
                      type="button"
                      variant={isConnected ? 'outline' : 'default'}
                      className="w-full"
                      disabled={isConnected}
                      onClick={() => handleConnectOAuthProvider(provider)}
                    >
                      {isConnected ? t('connected') : t('connect_provider')}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {requiredOAuthProviders.length > 0 ? (
          missingOAuthProviders.length > 0 ? (
            <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('connect_required_providers_before_review')}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {t('all_required_delivery_providers_are_connected')}
              </AlertDescription>
            </Alert>
          )
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => transitionTo('providers')}
            className="border transition-colors"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--stat-bg)', color: 'var(--text-main)' }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back_to_providers')}
          </Button>

          <Button
            onClick={() => transitionTo('review')}
            disabled={!canContinueFromConnections}
            className="bg-[#1BC47D] text-white hover:bg-[#18A96B]"
          >
            {t('continue_to_review')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
