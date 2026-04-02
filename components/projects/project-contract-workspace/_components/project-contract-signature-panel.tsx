import { AlertCircle, Download, FileText, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import type { ProjectContractWorkspaceController } from '../_hooks/use-project-contract-workspace-controller';
import {
  formatDateTime,
  getProcessTone,
  humanizeCode,
} from '../_lib/project-contract-workspace-helpers';

type ProjectContractSignaturePanelProps = Pick<
  ProjectContractWorkspaceController,
  | 'activeSignature'
  | 'canIssueFreshSignatureFlow'
  | 'canManageSignatureUploads'
  | 'canReadAdminContract'
  | 'canUploadClientSignedDocument'
  | 'canUploadProviderSignedDocument'
  | 'clientFileInputRef'
  | 'clientSignedFile'
  | 'contract'
  | 'effectiveSummary'
  | 'handleClientFileChange'
  | 'handleDownloadManualSignatureStep'
  | 'handleDownloadSignedPdf'
  | 'handleIssueSignatureFlow'
  | 'handleProviderFileChange'
  | 'handleUploadManualSignatureStep'
  | 'latestSignatureValidation'
  | 'locale'
  | 'operationsLoading'
  | 'providerFileInputRef'
  | 'providerSignedFile'
  | 'setValidationPolicyCode'
  | 'signatureActionLoading'
  | 'signatureError'
  | 'translateIfPresent'
  | 'validationPolicyCode'
>;

export function ProjectContractSignaturePanel({
  activeSignature,
  canIssueFreshSignatureFlow,
  canManageSignatureUploads,
  canReadAdminContract,
  canUploadClientSignedDocument,
  canUploadProviderSignedDocument,
  clientFileInputRef,
  clientSignedFile,
  contract,
  effectiveSummary,
  handleClientFileChange,
  handleDownloadManualSignatureStep,
  handleDownloadSignedPdf,
  handleIssueSignatureFlow,
  handleProviderFileChange,
  handleUploadManualSignatureStep,
  latestSignatureValidation,
  locale,
  operationsLoading,
  providerFileInputRef,
  providerSignedFile,
  setValidationPolicyCode,
  signatureActionLoading,
  signatureError,
  translateIfPresent,
  validationPolicyCode,
}: ProjectContractSignaturePanelProps) {
  const t = useTranslations('projects.detail.contracts');

  return (
    <Card className="border-slate-200 dark:border-[#1E2A3D]">
      <CardHeader>
        <CardTitle>{t('signature.title')}</CardTitle>
        <CardDescription>{t('signature.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {operationsLoading && canReadAdminContract ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : null}

        {signatureError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('signature.errors.title')}</AlertTitle>
            <AlertDescription>{signatureError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
              {t('signature.labels.contract_status')}
            </div>
            <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
              {effectiveSummary?.status
                ? translateIfPresent(
                    `statuses.${String(effectiveSummary.status).toLowerCase()}`,
                    humanizeCode(effectiveSummary.status)
                  )
                : t('summary.unavailable')}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
              {t('signature.labels.flow_status')}
            </div>
            <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
              {activeSignature?.flow_status
                ? translateIfPresent(
                    `signature.flow_statuses.${String(
                      activeSignature.flow_status
                    ).toLowerCase()}`,
                    humanizeCode(activeSignature.flow_status)
                  )
                : t('signature.awaiting_issue')}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
              {t('signature.labels.signature_level')}
            </div>
            <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
              {contract?.signature_level
                ? humanizeCode(contract.signature_level)
                : t('summary.unavailable')}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
              {t('signature.labels.completed_at')}
            </div>
            <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
              {formatDateTime(activeSignature?.completed_at ?? null, locale) ??
                t('summary.unavailable')}
            </div>
          </div>
        </div>

        {activeSignature ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={getProcessTone(activeSignature.status)}>
                {activeSignature.status
                  ? translateIfPresent(
                      `signature.statuses.${String(activeSignature.status).toLowerCase()}`,
                      humanizeCode(activeSignature.status)
                    )
                  : t('summary.unavailable')}
              </Badge>
              {activeSignature.flow_status ? (
                <Badge
                  variant="outline"
                  className={getProcessTone(activeSignature.flow_status)}
                >
                  {translateIfPresent(
                    `signature.flow_statuses.${String(
                      activeSignature.flow_status
                    ).toLowerCase()}`,
                    humanizeCode(activeSignature.flow_status)
                  )}
                </Badge>
              ) : null}
              {activeSignature.validation_policy_code ? (
                <Badge variant="outline">
                  {activeSignature.validation_policy_code}
                </Badge>
              ) : null}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {t('signature.steps.client')}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-[#A3ADC2]">
                  {t('signature.steps.client_description')}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {canManageSignatureUploads ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        void handleDownloadManualSignatureStep('client');
                      }}
                      disabled={signatureActionLoading === 'client-download'}
                    >
                      {signatureActionLoading === 'client-download' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      {t('signature.actions.download_client_packet')}
                    </Button>
                  ) : null}
                </div>
                {canUploadClientSignedDocument ? (
                  <div className="mt-4 space-y-3">
                    <Input
                      ref={clientFileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleClientFileChange}
                    />
                    <div className="text-xs text-slate-500 dark:text-[#A3ADC2]">
                      {clientSignedFile?.name ?? t('signature.no_file_selected')}
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        void handleUploadManualSignatureStep('client');
                      }}
                      disabled={signatureActionLoading === 'client-upload'}
                    >
                      {signatureActionLoading === 'client-upload' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t('signature.actions.upload_client_signed_pdf')}
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {t('signature.steps.provider')}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-[#A3ADC2]">
                  {t('signature.steps.provider_description')}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {canManageSignatureUploads ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        void handleDownloadManualSignatureStep('provider');
                      }}
                      disabled={signatureActionLoading === 'provider-download'}
                    >
                      {signatureActionLoading === 'provider-download' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      {t('signature.actions.download_provider_packet')}
                    </Button>
                  ) : null}
                  {activeSignature.id ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        void handleDownloadSignedPdf();
                      }}
                      disabled={signatureActionLoading === 'signed-download'}
                    >
                      {signatureActionLoading === 'signed-download' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-4 w-4" />
                      )}
                      {t('signature.actions.download_signed_pdf')}
                    </Button>
                  ) : null}
                </div>
                {canUploadProviderSignedDocument ? (
                  <div className="mt-4 space-y-3">
                    <Input
                      ref={providerFileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleProviderFileChange}
                    />
                    <div className="text-xs text-slate-500 dark:text-[#A3ADC2]">
                      {providerSignedFile?.name ?? t('signature.no_file_selected')}
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        void handleUploadManualSignatureStep('provider');
                      }}
                      disabled={signatureActionLoading === 'provider-upload'}
                    >
                      {signatureActionLoading === 'provider-upload' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t('signature.actions.upload_provider_signed_pdf')}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            {latestSignatureValidation ? (
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                    {t('signature.validation.title')}
                  </div>
                  {latestSignatureValidation.validation_status ? (
                    <Badge
                      variant="outline"
                      className={getProcessTone(
                        latestSignatureValidation.validation_status
                      )}
                    >
                      {translateIfPresent(
                        `signature.validation.statuses.${String(
                          latestSignatureValidation.validation_status
                        ).toLowerCase()}`,
                        humanizeCode(latestSignatureValidation.validation_status)
                      )}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                      {t('signature.validation.labels.stage')}
                    </div>
                    <div className="mt-2 text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                      {latestSignatureValidation.stage
                        ? humanizeCode(latestSignatureValidation.stage)
                        : t('summary.unavailable')}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                      {t('signature.validation.labels.signature_count')}
                    </div>
                    <div className="mt-2 text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                      {latestSignatureValidation.signature_count_found ??
                        t('summary.unavailable')}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                      {t('signature.validation.labels.detected_level')}
                    </div>
                    <div className="mt-2 text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                      {latestSignatureValidation.detected_signature_level
                        ? humanizeCode(
                            latestSignatureValidation.detected_signature_level
                          )
                        : t('summary.unavailable')}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                      {t('signature.validation.labels.best_signature_time')}
                    </div>
                    <div className="mt-2 text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                      {formatDateTime(
                        latestSignatureValidation.best_signature_time,
                        locale
                      ) ?? t('summary.unavailable')}
                    </div>
                  </div>
                </div>

                {latestSignatureValidation.failure_reason ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-800">
                    {latestSignatureValidation.failure_reason}
                  </div>
                ) : null}

                {latestSignatureValidation.signers.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                      {t('signature.validation.labels.signers')}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {latestSignatureValidation.signers.map((signer) => (
                        <div
                          key={signer.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              {signer.expected_role
                                ? humanizeCode(signer.expected_role)
                                : t('summary.unavailable')}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={getProcessTone(
                                signer.signature_valid ? 'valid' : 'invalid'
                              )}
                            >
                              {signer.signature_valid
                                ? t('signature.validation.valid')
                                : t('signature.validation.invalid')}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-slate-700 dark:text-[#E6EDF3]">
                            {signer.certificate_subject ?? t('summary.unavailable')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-600 dark:border-[#1E2A3D] dark:bg-[#0B1220]/70 dark:text-[#A3ADC2]">
                {t('signature.validation.empty')}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-600 dark:border-[#1E2A3D] dark:bg-[#0B1220]/70 dark:text-[#A3ADC2]">
              {effectiveSummary?.status === 'awaiting_client_signature'
                ? t('signature.hints.awaiting_client_signature')
                : effectiveSummary?.status === 'awaiting_provider_signature'
                  ? t('signature.hints.awaiting_provider_signature')
                  : effectiveSummary?.status === 'signed'
                    ? t('signature.hints.signed')
                    : canIssueFreshSignatureFlow
                      ? t('signature.ready_to_issue')
                      : t('signature.empty')}
            </div>

            {canIssueFreshSignatureFlow ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                <div className="grid gap-3 md:grid-cols-[1fr,auto] md:items-end">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                      {t('signature.actions.issue_flow')}
                    </div>
                    <Input
                      value={validationPolicyCode}
                      onChange={(event) => setValidationPolicyCode(event.target.value)}
                      placeholder={t('signature.form.validation_policy_code')}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      void handleIssueSignatureFlow();
                    }}
                    disabled={signatureActionLoading === 'issue'}
                  >
                    {signatureActionLoading === 'issue' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {t('signature.actions.issue_flow')}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
