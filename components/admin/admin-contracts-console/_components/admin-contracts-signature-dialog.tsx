import { type ChangeEvent } from "react";
import { Download, FileText, Loader2, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSpinner } from "@/components/admin/admin-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import type { AdminContractsConsoleController } from "../_hooks/use-admin-contracts-console-controller";
import {
  AdminErrorBanner,
  formatDateTime,
  getToneClass,
  humanizeCode,
} from "../_lib/admin-contracts-console-helpers";

type AdminContractsSignatureDialogProps = Pick<
  AdminContractsConsoleController,
  | "canUploadSignedPdf"
  | "handleSignedPdfDownload"
  | "handleSignedPdfUpload"
  | "latestSignatureValidation"
  | "locale"
  | "setSignatureDialogOpen"
  | "setSignatureUploadFile"
  | "signatureDetail"
  | "signatureDetailError"
  | "signatureDetailLoading"
  | "signatureDialogOpen"
  | "signatureDownloadLoading"
  | "signatureUploadFile"
  | "signatureUploadInputRef"
  | "signatureUploadLabel"
  | "signatureUploadLoading"
>;

export function AdminContractsSignatureDialog({
  canUploadSignedPdf,
  handleSignedPdfDownload,
  handleSignedPdfUpload,
  latestSignatureValidation,
  locale,
  setSignatureDialogOpen,
  setSignatureUploadFile,
  signatureDetail,
  signatureDetailError,
  signatureDetailLoading,
  signatureDialogOpen,
  signatureDownloadLoading,
  signatureUploadFile,
  signatureUploadInputRef,
  signatureUploadLabel,
  signatureUploadLoading,
}: AdminContractsSignatureDialogProps) {
  const t = useTranslations("admin.contracts");

  return (
    <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("signature_detail.title")}</DialogTitle>
          <DialogDescription>{t("signature_detail.description")}</DialogDescription>
        </DialogHeader>

        <AdminErrorBanner
          title={t("signature_detail.errors.title")}
          message={signatureDetailError}
        />

        {signatureDetailLoading ? (
          <div className="py-10">
            <AdminSpinner />
          </div>
        ) : signatureDetail ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={getToneClass(signatureDetail.status)}>
                {humanizeCode(signatureDetail.status)}
              </Badge>
              {signatureDetail.flow_status ? (
                <Badge
                  variant="outline"
                  className={getToneClass(signatureDetail.flow_status)}
                >
                  {humanizeCode(signatureDetail.flow_status)}
                </Badge>
              ) : null}
              {signatureDetail.signature_level ? (
                <Badge variant="outline">{signatureDetail.signature_level}</Badge>
              ) : null}
            </div>

            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>{t("signature_detail.operational_title")}</AlertTitle>
              <AlertDescription>{t("signature_detail.operational_body")}</AlertDescription>
            </Alert>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("signature_detail.labels.contract")}
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {signatureDetail.contract?.reference ?? t("common.unavailable")}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("signature_detail.labels.validation_policy")}
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {signatureDetail.validation_policy_code ?? t("common.unavailable")}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("signature_detail.labels.sent_at")}
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {formatDateTime(signatureDetail.sent_at, locale) ??
                    t("common.unavailable")}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("signature_detail.labels.completed_at")}
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {formatDateTime(signatureDetail.completed_at, locale) ??
                    t("common.unavailable")}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void handleSignedPdfDownload();
                }}
                disabled={signatureDownloadLoading}
              >
                {signatureDownloadLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {t("signature_detail.actions.download_signed_pdf")}
              </Button>
            </div>

            <AdminSectionCard
              title={t("signature_detail.upload_title")}
              description={t("signature_detail.upload_description")}
            >
              {canUploadSignedPdf ? (
                <div className="grid gap-3 md:grid-cols-[1fr,auto] md:items-end">
                  <div className="space-y-2">
                    <Input
                      ref={signatureUploadInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setSignatureUploadFile(event.target.files?.[0] ?? null)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {signatureUploadFile?.name ?? t("signature_detail.no_file_selected")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      void handleSignedPdfUpload();
                    }}
                    disabled={signatureUploadLoading}
                  >
                    {signatureUploadLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UploadIcon />
                    )}
                    {signatureUploadLabel}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("signature_detail.no_upload_permission")}
                </p>
              )}
            </AdminSectionCard>

            <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
              <AdminSectionCard
                title={t("signature_detail.documents_title")}
                description={t("signature_detail.documents_description")}
              >
                <div className="space-y-3">
                  {[
                    signatureDetail.base_document,
                    signatureDetail.client_signed_document,
                    signatureDetail.fully_signed_document,
                    signatureDetail.signed_document,
                  ]
                    .filter(Boolean)
                    .map((document) => (
                      <div
                        key={document!.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {document?.document_role ? (
                            <Badge variant="outline">
                              {humanizeCode(document.document_role)}
                            </Badge>
                          ) : null}
                          <span className="text-sm font-medium">
                            {document?.file_name ?? t("common.unavailable")}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {document?.mime_type ?? "—"} • {document?.sha256_hash ?? "—"}
                        </div>
                      </div>
                    ))}
                </div>
              </AdminSectionCard>

              <AdminSectionCard
                title={t("signature_detail.signers_title")}
                description={t("signature_detail.signers_description")}
              >
                <div className="space-y-3">
                  {signatureDetail.required_signer_sequence.length > 0 ? (
                    signatureDetail.required_signer_sequence.map((entry, index) => {
                      const payload =
                        typeof entry === "object" && entry !== null
                          ? (entry as Record<string, unknown>)
                          : null;
                      const signerOrder =
                        typeof payload?.order === "number" ||
                        typeof payload?.order === "string"
                          ? payload.order
                          : index + 1;

                      return (
                        <div
                          key={`${payload?.role ?? "signer"}-${index}`}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              {humanizeCode(String(payload?.role ?? `Signer ${index + 1}`))}
                            </Badge>
                            <Badge variant="outline">
                              {t("signature_detail.signer_order", {
                                value: signerOrder,
                              })}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm">
                            {String(payload?.signatory_name ?? t("common.unavailable"))}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {String(payload?.signatory_email ?? "—")} •{" "}
                            {String(payload?.signature_field_name ?? "—")}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("signature_detail.no_signers")}
                    </p>
                  )}
                </div>
              </AdminSectionCard>
            </div>

            <AdminSectionCard
              title={t("signature_detail.events_title")}
              description={t("signature_detail.events_description")}
            >
              <div className="space-y-3">
                {signatureDetail.events.length > 0 ? (
                  signatureDetail.events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{humanizeCode(event.event_type)}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(event.occurred_at, locale) ?? "—"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm">
                        {event.actor_email ?? event.actor_role ?? "—"}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("signature_detail.no_events")}
                  </p>
                )}
              </div>
            </AdminSectionCard>

            <AdminSectionCard
              title={t("signature_detail.validations_title")}
              description={t("signature_detail.validations_description")}
            >
              {latestSignatureValidation ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {latestSignatureValidation.validation_status ? (
                      <Badge
                        variant="outline"
                        className={getToneClass(latestSignatureValidation.validation_status)}
                      >
                        {humanizeCode(latestSignatureValidation.validation_status)}
                      </Badge>
                    ) : null}
                    {latestSignatureValidation.stage ? (
                      <Badge variant="outline">
                        {humanizeCode(latestSignatureValidation.stage)}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t("signature_detail.validation.signature_count")}
                      </div>
                      <div className="mt-2 text-sm font-semibold">
                        {latestSignatureValidation.signature_count_found ?? "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t("signature_detail.validation.detected_level")}
                      </div>
                      <div className="mt-2 text-sm font-semibold">
                        {latestSignatureValidation.detected_signature_level ?? "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t("signature_detail.validation.best_time")}
                      </div>
                      <div className="mt-2 text-sm font-semibold">
                        {formatDateTime(
                          latestSignatureValidation.best_signature_time,
                          locale
                        ) ?? "—"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t("signature_detail.validation.integrity")}
                      </div>
                      <div className="mt-2 text-sm font-semibold">
                        {latestSignatureValidation.integrity_ok
                          ? t("common.ok")
                          : t("common.failed")}
                      </div>
                    </div>
                  </div>
                  {latestSignatureValidation.failure_reason ? (
                    <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 text-sm text-red-800">
                      {latestSignatureValidation.failure_reason}
                    </div>
                  ) : null}
                  {latestSignatureValidation.signers.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {latestSignatureValidation.signers.map((signer) => (
                        <div
                          key={signer.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              {humanizeCode(signer.expected_role)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={getToneClass(
                                signer.signature_valid ? "valid" : "invalid"
                              )}
                            >
                              {signer.signature_valid
                                ? t("signature_detail.validation.valid")
                                : t("signature_detail.validation.invalid")}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm">
                            {signer.certificate_subject ?? t("common.unavailable")}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {signer.signature_field_name ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("signature_detail.no_validations")}
                </p>
              )}
            </AdminSectionCard>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function UploadIcon() {
  return <FileText className="mr-2 h-4 w-4" />;
}
