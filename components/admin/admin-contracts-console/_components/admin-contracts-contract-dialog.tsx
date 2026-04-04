import { Download, FileSearch, Loader2, SquarePen } from "lucide-react";
import { useTranslations } from "next-intl";

import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSpinner } from "@/components/admin/admin-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONTRACT_NOTE_TYPE_OPTIONS } from "@/lib/admin-contracts";

import type { AdminContractsConsoleController } from "../_hooks/use-admin-contracts-console-controller";
import {
  AdminErrorBanner,
  formatDateTime,
  formatMoney,
  getToneClass,
  humanizeCode,
} from "../_lib/admin-contracts-console-helpers";

type AdminContractsContractDialogProps = Pick<
  AdminContractsConsoleController,
  | "canCreateNotes"
  | "contractDetail"
  | "contractDetailError"
  | "contractDetailLoading"
  | "contractDialogOpen"
  | "contractDownloadLoading"
  | "contractNoteBody"
  | "contractNoteLoading"
  | "contractNoteType"
  | "contractPreviewLoading"
  | "handleContractDownload"
  | "handleContractPreview"
  | "handleCreateContractNote"
  | "locale"
  | "setContractDialogOpen"
  | "setContractNoteBody"
  | "setContractNoteType"
>;

export function AdminContractsContractDialog({
  canCreateNotes,
  contractDetail,
  contractDetailError,
  contractDetailLoading,
  contractDialogOpen,
  contractDownloadLoading,
  contractNoteBody,
  contractNoteLoading,
  contractNoteType,
  contractPreviewLoading,
  handleContractDownload,
  handleContractPreview,
  handleCreateContractNote,
  locale,
  setContractDialogOpen,
  setContractNoteBody,
  setContractNoteType,
}: AdminContractsContractDialogProps) {
  const t = useTranslations("admin.contracts");

  return (
    <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("contract_detail.title")}</DialogTitle>
          <DialogDescription>{t("contract_detail.description")}</DialogDescription>
        </DialogHeader>

        <AdminErrorBanner
          title={t("contract_detail.errors.title")}
          message={contractDetailError}
        />

        {contractDetailLoading ? (
          <div className="py-10">
            <AdminSpinner />
          </div>
        ) : contractDetail ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={getToneClass(contractDetail.status)}>
                {humanizeCode(contractDetail.status)}
              </Badge>
              {contractDetail.signature_level ? (
                <Badge variant="outline">{contractDetail.signature_level}</Badge>
              ) : null}
              {contractDetail.requires_manual_review ? (
                <Badge variant="outline">{t("contract_detail.badges.manual_review")}</Badge>
              ) : null}
              {contractDetail.requires_qes ? (
                <Badge variant="outline">{t("contract_detail.badges.qes")}</Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void handleContractPreview();
                }}
                disabled={contractPreviewLoading}
              >
                {contractPreviewLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSearch className="mr-2 h-4 w-4" />
                )}
                {t("contract_detail.actions.preview_html")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void handleContractDownload();
                }}
                disabled={contractDownloadLoading}
              >
                {contractDownloadLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {t("contract_detail.actions.download_pdf")}
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("contract_detail.labels.reference")}
                </div>
                <div className="mt-2 text-sm font-semibold">{contractDetail.reference}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("contract_detail.labels.project")}
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {contractDetail.project?.title ?? t("common.unavailable")}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("contract_detail.labels.value")}
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {formatMoney(
                    contractDetail.total_amount,
                    contractDetail.currency,
                    locale
                  ) ?? t("common.unavailable")}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("contract_detail.labels.updated_at")}
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {formatDateTime(contractDetail.updated_at, locale) ??
                    t("common.unavailable")}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
              <AdminSectionCard
                title={t("contract_detail.risk_title")}
                description={t("contract_detail.risk_description")}
              >
                {contractDetail.latest_risk_assessment ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {[
                        contractDetail.latest_risk_assessment.overall_risk,
                        contractDetail.latest_risk_assessment.misclassification_risk,
                        contractDetail.latest_risk_assessment.gdpr_risk,
                        contractDetail.latest_risk_assessment.ip_risk,
                        contractDetail.latest_risk_assessment.tax_risk,
                      ]
                        .filter(Boolean)
                        .map((entry) => (
                          <Badge key={entry} variant="outline">
                            {humanizeCode(entry)}
                          </Badge>
                        ))}
                    </div>
                    {contractDetail.latest_risk_assessment.warnings.length > 0 ? (
                      <div>
                        <div className="text-sm font-medium">
                          {t("contract_detail.warnings")}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {contractDetail.latest_risk_assessment.warnings.map((warning) => (
                            <Badge key={warning} variant="outline">
                              {humanizeCode(warning)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {contractDetail.latest_risk_assessment.blocking_reasons.length > 0 ? (
                      <div>
                        <div className="text-sm font-medium">
                          {t("contract_detail.blocking_reasons")}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {contractDetail.latest_risk_assessment.blocking_reasons.map(
                            (reason) => (
                              <Badge
                                key={reason}
                                variant="outline"
                                className="border-red-200 bg-red-50 text-red-700"
                              >
                                {humanizeCode(reason)}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("contract_detail.no_risk")}
                  </p>
                )}
              </AdminSectionCard>

              <AdminSectionCard
                title={t("contract_detail.documents_title")}
                description={t("contract_detail.documents_description")}
              >
                <div className="space-y-3">
                  {contractDetail.documents.map((document) => (
                    <div
                      key={document.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">
                          {document.file_name ?? t("common.unavailable")}
                        </div>
                        <div className="flex gap-2">
                          {document.document_role ? (
                            <Badge variant="outline">
                              {humanizeCode(document.document_role)}
                            </Badge>
                          ) : null}
                          {document.is_current ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-200 bg-emerald-50 text-emerald-700"
                            >
                              {t("contract_detail.current_document")}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {document.mime_type ?? "—"} •{" "}
                        {formatDateTime(document.created_at, locale) ?? "—"}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-sm text-muted-foreground">
                  {t("contract_detail.backfill_note")}
                </div>
              </AdminSectionCard>
            </div>

            <AdminSectionCard
              title={t("contract_detail.notes_title")}
              description={t("contract_detail.notes_description")}
            >
              {canCreateNotes ? (
                <div className="mb-4 grid gap-3 md:grid-cols-[200px,1fr,auto]">
                  <Select
                    value={contractNoteType}
                    onValueChange={(value) =>
                      setContractNoteType(
                        value as (typeof CONTRACT_NOTE_TYPE_OPTIONS)[number]
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_NOTE_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {humanizeCode(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={contractNoteBody}
                    onChange={(event) => setContractNoteBody(event.target.value)}
                    placeholder={t("contract_detail.note_placeholder")}
                    rows={3}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      void handleCreateContractNote();
                    }}
                    disabled={contractNoteLoading}
                  >
                    {contractNoteLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <SquarePen className="mr-2 h-4 w-4" />
                    )}
                    {t("contract_detail.actions.add_note")}
                  </Button>
                </div>
              ) : null}

              <div className="space-y-3">
                {contractDetail.notes.length > 0 ? (
                  contractDetail.notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{humanizeCode(note.note_type)}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(note.created_at, locale) ?? "—"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm">{note.body}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {note.author_user?.name ?? note.author_user?.email ?? "—"}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("contract_detail.no_notes")}
                  </p>
                )}
              </div>
            </AdminSectionCard>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
