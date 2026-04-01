"use client";

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type ReviewFlagDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  onSubmit: (payload: { reason_code: string; notes?: string | null }) => Promise<void>;
};

export function ReviewFlagDialog({
  open,
  onOpenChange,
  locale,
  onSubmit,
}: ReviewFlagDialogProps) {
  const [reasonCode, setReasonCode] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEnglish = locale.toLowerCase().startsWith('en');
  const copy = useMemo(
    () =>
      isEnglish
        ? {
            title: 'Report review',
            description: 'Only published reviews can be reported. Tell us what looks wrong.',
            reasonLabel: 'Reason',
            notesLabel: 'Additional context',
            notesPlaceholder: 'Share anything that would help moderation.',
            cancel: 'Cancel',
            submit: 'Send report',
            reasonRequired: 'Select a reason before sending the report.',
            genericError: 'We could not send the report.',
            reasons: [
              { value: 'abusive_content', label: 'Abusive or harassing content' },
              { value: 'spam_or_fake', label: 'Spam or fake review' },
              { value: 'privacy', label: 'Personal or confidential data' },
              { value: 'misleading', label: 'Misleading or untrue' },
              { value: 'conflict_of_interest', label: 'Conflict of interest' },
              { value: 'other', label: 'Other' },
            ],
          }
        : {
            title: 'Raportează recenzia',
            description:
              'Poți raporta doar recenzii publicate. Spune-ne pe scurt ce pare în neregulă.',
            reasonLabel: 'Motiv',
            notesLabel: 'Context suplimentar',
            notesPlaceholder: 'Adaugă orice detaliu util pentru moderare.',
            cancel: 'Renunță',
            submit: 'Trimite raportarea',
            reasonRequired: 'Selectează un motiv înainte să trimiți raportarea.',
            genericError: 'Nu am putut trimite raportarea.',
            reasons: [
              { value: 'abusive_content', label: 'Conținut abuziv sau hărțuire' },
              { value: 'spam_or_fake', label: 'Spam sau recenzie falsă' },
              { value: 'privacy', label: 'Date personale sau confidențiale' },
              { value: 'misleading', label: 'Informații înșelătoare sau neadevărate' },
              { value: 'conflict_of_interest', label: 'Conflict de interese' },
              { value: 'other', label: 'Alt motiv' },
            ],
          },
    [isEnglish]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setReasonCode('');
    setNotes('');
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    if (!reasonCode) {
      setError(copy.reasonRequired);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        reason_code: reasonCode,
        notes: notes.trim() ? notes.trim() : null,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : copy.genericError
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-200 bg-white/95 dark:border-[#23314D] dark:bg-[#0B1220]">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>{copy.reasonLabel}</Label>
            <Select value={reasonCode || 'none'} onValueChange={(value) => setReasonCode(value === 'none' ? '' : value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">...</SelectItem>
                {copy.reasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="review-flag-notes">{copy.notesLabel}</Label>
            <Textarea
              id="review-flag-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={copy.notesPlaceholder}
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {copy.cancel}
          </Button>
          <Button type="button" className="btn-primary" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {copy.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
