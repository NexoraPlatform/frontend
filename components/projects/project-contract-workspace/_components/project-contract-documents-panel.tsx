import { FileSearch, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { ProjectContractWorkspaceController } from '../_hooks/use-project-contract-workspace-controller';
import {
  formatFileSize,
  humanizeCode,
} from '../_lib/project-contract-workspace-helpers';

type ProjectContractDocumentsPanelProps = Pick<
  ProjectContractWorkspaceController,
  | 'activeSignature'
  | 'currentDocuments'
  | 'downloading'
  | 'handleDownloadPdf'
  | 'handleDownloadSignedPdf'
  | 'handlePreviewHtml'
  | 'locale'
  | 'previewLoading'
  | 'signatureActionLoading'
>;

export function ProjectContractDocumentsPanel({
  activeSignature,
  currentDocuments,
  downloading,
  handleDownloadPdf,
  handleDownloadSignedPdf,
  handlePreviewHtml,
  locale,
  previewLoading,
  signatureActionLoading,
}: ProjectContractDocumentsPanelProps) {
  const t = useTranslations('projects.detail.contracts');

  return (
    <Card className="border-slate-200 dark:border-[#1E2A3D]">
      <CardHeader>
        <CardTitle>{t('documents.title')}</CardTitle>
        <CardDescription>{t('documents.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentDocuments.length > 0 ? (
          currentDocuments.map((document) => (
            <div
              key={`${document.id}-${document.document_role}`}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/70 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{humanizeCode(document.document_role)}</Badge>
                  {document.is_current ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700"
                    >
                      {t('documents.current')}
                    </Badge>
                  ) : null}
                </div>
                <div className="text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {document.file_name ?? t('documents.unnamed')}
                </div>
                <div className="text-xs text-slate-500 dark:text-[#A3ADC2]">
                  {[document.mime_type, formatFileSize(document.file_size_bytes, locale)]
                    .filter(Boolean)
                    .join(' • ') || t('summary.unavailable')}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {document.document_role === 'DRAFT_HTML' && document.is_current ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void handlePreviewHtml();
                    }}
                    disabled={previewLoading}
                  >
                    <FileSearch className="mr-2 h-4 w-4" />
                    {t('actions.preview_html')}
                  </Button>
                ) : null}
                {document.document_role === 'FINAL_PDF' && document.is_current ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void handleDownloadPdf();
                    }}
                    disabled={downloading}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {t('actions.download_pdf')}
                  </Button>
                ) : null}
                {document.document_role === 'SIGNED_PDF' &&
                document.is_current &&
                activeSignature?.id ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void handleDownloadSignedPdf();
                    }}
                    disabled={signatureActionLoading === 'signed-download'}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {t('signature.actions.download_signed_pdf')}
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 dark:text-[#A3ADC2]">
            {t('documents.empty')}
          </p>
        )}

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-600 dark:border-[#1E2A3D] dark:bg-[#0B1220]/70 dark:text-[#A3ADC2]">
          {t('documents.backfill_note')}
        </div>
      </CardContent>
    </Card>
  );
}
