'use client';

import { useTranslations } from 'next-intl';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type TestStartWarningDialogProps = {
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
};

export default function TestStartWarningDialog({
    onConfirm,
    onOpenChange,
    open,
}: TestStartWarningDialogProps) {
    const t = useTranslations('tests.providerFlow');

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('startWarning.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('startWarning.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-3 text-sm text-muted-foreground">
                    <p>{t('startWarning.leaveTab')}</p>
                    <p>{t('startWarning.noReturn')}</p>
                    <p className="font-medium text-foreground">
                        {t('startWarning.retry')}
                    </p>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('startWarning.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>
                        {t('startWarning.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
