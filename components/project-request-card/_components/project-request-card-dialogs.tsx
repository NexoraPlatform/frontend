import React from 'react';
import { Loader2, Trash2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type {
    MilestoneProposalDialogState,
    MilestoneProposalResponseDialogState,
    ProjectRequestCardTranslator,
} from '../_lib/project-request-card-types';

type ProjectRequestCardDialogsProps = {
    projectId: string | number;
    milestoneProposalDialog: MilestoneProposalDialogState | null;
    setMilestoneProposalDialog: (value: MilestoneProposalDialogState | null) => void;
    milestoneProposalError: string | null;
    setMilestoneProposalError: (value: string | null) => void;
    milestoneProposalDialogLines: any[];
    onSubmitMilestoneProposal: () => void;
    submittingMilestoneProposalKey: string | null;
    milestoneProposalResponseDialog: MilestoneProposalResponseDialogState;
    setMilestoneProposalResponseDialog: (
        value: MilestoneProposalResponseDialogState
    ) => void;
    milestoneProposalResponseReason: string;
    setMilestoneProposalResponseReason: (value: string) => void;
    milestoneProposalResponseError: string | null;
    setMilestoneProposalResponseError: (value: string | null) => void;
    onRejectMilestoneProposalResponse: (reason: string) => Promise<boolean>;
    t: ProjectRequestCardTranslator;
};

export function ProjectRequestCardDialogs({
    projectId,
    milestoneProposalDialog,
    setMilestoneProposalDialog,
    milestoneProposalError,
    setMilestoneProposalError,
    milestoneProposalDialogLines,
    onSubmitMilestoneProposal,
    submittingMilestoneProposalKey,
    milestoneProposalResponseDialog,
    setMilestoneProposalResponseDialog,
    milestoneProposalResponseReason,
    setMilestoneProposalResponseReason,
    milestoneProposalResponseError,
    setMilestoneProposalResponseError,
    onRejectMilestoneProposalResponse,
    t,
}: ProjectRequestCardDialogsProps) {
    const milestoneProposalSubmitKey = milestoneProposalDialog
        ? [
              projectId ?? '',
              milestoneProposalDialog.providerId,
              milestoneProposalDialog.mode,
              milestoneProposalDialog.milestoneId ?? milestoneProposalDialog.projectLineId,
          ].join(':')
        : '';

    return (
        <>
            <Dialog
                open={Boolean(milestoneProposalDialog)}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setMilestoneProposalDialog(null);
                        setMilestoneProposalError(null);
                    }
                }}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {milestoneProposalDialog?.mode === 'ADD'
                                ? t('client.project_requests.milestone_change_requests.add_title')
                                : milestoneProposalDialog?.mode === 'UPDATE'
                                  ? t(
                                        'client.project_requests.milestone_change_requests.update_title'
                                    )
                                  : t(
                                        'client.project_requests.milestone_change_requests.delete_title'
                                    )}
                        </DialogTitle>
                        <DialogDescription>
                            {milestoneProposalDialog?.mode === 'ADD'
                                ? t(
                                        'client.project_requests.milestone_change_requests.add_description'
                                    )
                                : milestoneProposalDialog?.mode === 'UPDATE'
                                  ? t(
                                        'client.project_requests.milestone_change_requests.update_description'
                                    )
                                  : t(
                                        'client.project_requests.milestone_change_requests.delete_description'
                                    )}
                        </DialogDescription>
                    </DialogHeader>

                    {milestoneProposalDialog ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor={`milestone-proposal-line-${projectId}`}>
                                    {t(
                                        'client.project_requests.milestone_change_requests.service_label'
                                    )}
                                </Label>
                                <select
                                    id={`milestone-proposal-line-${projectId}`}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={milestoneProposalDialog.projectLineId}
                                    onChange={(event) => {
                                        const selectedLine = milestoneProposalDialogLines.find(
                                            (line: any) =>
                                                String(line?.id ?? '') === event.target.value
                                        );
                                        setMilestoneProposalDialog({
                                            ...milestoneProposalDialog,
                                            projectLineId: event.target.value,
                                            serviceName: String(
                                                selectedLine?.service_name ??
                                                    selectedLine?.title ??
                                                    ''
                                            ),
                                        });
                                        if (milestoneProposalError) {
                                            setMilestoneProposalError(null);
                                        }
                                    }}
                                    disabled={milestoneProposalDialog.mode !== 'ADD'}
                                >
                                    {milestoneProposalDialogLines.map((line: any) => (
                                        <option
                                            key={String(line?.id ?? '')}
                                            value={String(line?.id ?? '')}
                                        >
                                            {line?.service_name ?? line?.title ?? '-'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {milestoneProposalDialog.mode !== 'DELETE' ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor={`milestone-proposal-title-${projectId}`}>
                                            {t(
                                                'client.project_requests.milestone_change_requests.title_label'
                                            )}
                                        </Label>
                                        <Input
                                            id={`milestone-proposal-title-${projectId}`}
                                            value={milestoneProposalDialog.title}
                                            onChange={(event) => {
                                                setMilestoneProposalDialog({
                                                    ...milestoneProposalDialog,
                                                    title: event.target.value,
                                                });
                                                if (milestoneProposalError) {
                                                    setMilestoneProposalError(null);
                                                }
                                            }}
                                            placeholder={t(
                                                'client.project_requests.milestone_change_requests.title_placeholder'
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor={`milestone-proposal-description-${projectId}`}
                                        >
                                            {t(
                                                'client.project_requests.milestone_change_requests.description_label'
                                            )}
                                        </Label>
                                        <Textarea
                                            id={`milestone-proposal-description-${projectId}`}
                                            rows={3}
                                            value={milestoneProposalDialog.description}
                                            onChange={(event) => {
                                                setMilestoneProposalDialog({
                                                    ...milestoneProposalDialog,
                                                    description: event.target.value,
                                                });
                                                if (milestoneProposalError) {
                                                    setMilestoneProposalError(null);
                                                }
                                            }}
                                            placeholder={t(
                                                'client.project_requests.milestone_change_requests.description_placeholder'
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor={`milestone-proposal-amount-${projectId}`}>
                                            {t(
                                                'client.project_requests.milestone_change_requests.amount'
                                            )}
                                        </Label>
                                        <Input
                                            id={`milestone-proposal-amount-${projectId}`}
                                            type="number"
                                            min="0"
                                            value={milestoneProposalDialog.amount}
                                            onChange={(event) => {
                                                setMilestoneProposalDialog({
                                                    ...milestoneProposalDialog,
                                                    amount: event.target.value,
                                                });
                                                if (milestoneProposalError) {
                                                    setMilestoneProposalError(null);
                                                }
                                            }}
                                            placeholder="0"
                                        />
                                    </div>
                                </>
                            ) : (
                                <Alert>
                                    <Trash2 className="h-4 w-4" />
                                    <AlertDescription>
                                        {t(
                                            'client.project_requests.milestone_change_requests.delete_confirm',
                                            {
                                                milestone:
                                                    milestoneProposalDialog.milestoneTitle ||
                                                    milestoneProposalDialog.title ||
                                                    t(
                                                        'client.project_requests.milestone_change_requests.untitled'
                                                    ),
                                            }
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {milestoneProposalDialog.currentSnapshot &&
                            milestoneProposalDialog.mode !== 'ADD' ? (
                                <div className="rounded-md border border-dashed border-slate-300 bg-slate-50/60 p-3 text-sm dark:border-[#2A3952] dark:bg-[#111B2D]">
                                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        {t(
                                            'client.project_requests.milestone_change_requests.before'
                                        )}
                                    </div>
                                    <div className="font-medium">
                                        {milestoneProposalDialog.currentSnapshot?.title ??
                                            milestoneProposalDialog.milestoneTitle ??
                                            t(
                                                'client.project_requests.milestone_change_requests.untitled'
                                            )}
                                    </div>
                                    {milestoneProposalDialog.currentSnapshot?.description ? (
                                        <div className="text-muted-foreground">
                                            {
                                                milestoneProposalDialog.currentSnapshot
                                                    .description
                                            }
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <Label htmlFor={`milestone-proposal-reason-${projectId}`}>
                                    {t(
                                        'client.project_requests.milestone_change_requests.reason'
                                    )}
                                </Label>
                                <Textarea
                                    id={`milestone-proposal-reason-${projectId}`}
                                    rows={4}
                                    value={milestoneProposalDialog.reason}
                                    onChange={(event) => {
                                        setMilestoneProposalDialog({
                                            ...milestoneProposalDialog,
                                            reason: event.target.value,
                                        });
                                        if (milestoneProposalError) {
                                            setMilestoneProposalError(null);
                                        }
                                    }}
                                    placeholder={t(
                                        'client.project_requests.milestone_change_requests.reason_placeholder'
                                    )}
                                />
                            </div>

                            {milestoneProposalError ? (
                                <p className="text-sm text-red-600 dark:text-red-300">
                                    {milestoneProposalError}
                                </p>
                            ) : null}
                        </div>
                    ) : null}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">
                                {t('client.project_requests.budget.cancel')}
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={onSubmitMilestoneProposal}
                            disabled={
                                !milestoneProposalDialog ||
                                submittingMilestoneProposalKey === milestoneProposalSubmitKey
                            }
                        >
                            {submittingMilestoneProposalKey === milestoneProposalSubmitKey ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            {t('client.project_requests.milestone_change_requests.submit')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(milestoneProposalResponseDialog)}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setMilestoneProposalResponseDialog(null);
                        setMilestoneProposalResponseReason('');
                        setMilestoneProposalResponseError(null);
                    }
                }}
            >
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('client.project_requests.milestone_change_requests.reject_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'client.project_requests.milestone_change_requests.reject_description'
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor={`milestone-proposal-response-reason-${projectId}`}>
                            {t(
                                'client.project_requests.milestone_change_requests.client_reason'
                            )}
                        </Label>
                        <Textarea
                            id={`milestone-proposal-response-reason-${projectId}`}
                            rows={4}
                            value={milestoneProposalResponseReason}
                            onChange={(event) => {
                                setMilestoneProposalResponseReason(event.target.value);
                                if (milestoneProposalResponseError) {
                                    setMilestoneProposalResponseError(null);
                                }
                            }}
                            placeholder={t(
                                'client.project_requests.milestone_change_requests.reject_reason_placeholder'
                            )}
                        />
                        {milestoneProposalResponseError ? (
                            <p className="text-sm text-red-600 dark:text-red-300">
                                {milestoneProposalResponseError}
                            </p>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">
                                {t('client.project_requests.budget.cancel')}
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                const trimmedReason = milestoneProposalResponseReason.trim();
                                if (!trimmedReason) {
                                    setMilestoneProposalResponseError(
                                        t(
                                            'client.project_requests.milestone_change_requests.reject_reason_required'
                                        )
                                    );
                                    return;
                                }

                                void (async () => {
                                    const success = await onRejectMilestoneProposalResponse(
                                        trimmedReason
                                    );

                                    if (success) {
                                        setMilestoneProposalResponseDialog(null);
                                        setMilestoneProposalResponseReason('');
                                        setMilestoneProposalResponseError(null);
                                    }
                                })();
                            }}
                            disabled={
                                !milestoneProposalResponseDialog ||
                                submittingMilestoneProposalKey ===
                                    `${milestoneProposalResponseDialog.projectId}:${milestoneProposalResponseDialog.proposalId}:REJECTED`
                            }
                        >
                            {submittingMilestoneProposalKey ===
                            `${milestoneProposalResponseDialog?.projectId}:${milestoneProposalResponseDialog?.proposalId}:REJECTED` ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            {t(
                                'client.project_requests.milestone_change_requests.submit_reject'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
