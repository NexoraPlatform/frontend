import { useTranslations } from 'next-intl';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { ProjectContractWorkspaceController } from '../_hooks/use-project-contract-workspace-controller';

type ProjectContractPreviewDialogProps = Pick<
  ProjectContractWorkspaceController,
  'effectiveSummary' | 'previewHtml' | 'previewOpen' | 'setPreviewOpen'
>;

export function ProjectContractPreviewDialog({
  effectiveSummary,
  previewHtml,
  previewOpen,
  setPreviewOpen,
}: ProjectContractPreviewDialogProps) {
  const t = useTranslations('projects.detail.contracts');

  return (
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      <DialogContent className="max-w-6xl overflow-hidden border-0 bg-white p-0 dark:bg-[#0B1220]">
        <DialogHeader className="border-b border-slate-200 px-6 py-4 dark:border-[#1E2A3D]">
          <DialogTitle>{t('preview.title')}</DialogTitle>
          <DialogDescription>
            {effectiveSummary?.reference || t('preview.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="h-[75vh] bg-slate-100 dark:bg-[#070C14]">
          {previewHtml ? (
            <iframe
              title={t('preview.title')}
              srcDoc={previewHtml}
              className="h-full w-full bg-white"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-[#A3ADC2]">
              {t('preview.empty')}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
