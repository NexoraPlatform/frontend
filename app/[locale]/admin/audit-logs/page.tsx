"use client";

import { useTranslations } from 'next-intl';
import AuditLogsTable from '@/components/AuditLogsTable';

export default function AuditLogsPage() {
    const t = useTranslations();

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Logs</h1>
                <p className="text-muted-foreground mt-2">
                    View and analyze changes made within the system.
                </p>
            </div>

            <AuditLogsTable />
        </div>
    );
}
