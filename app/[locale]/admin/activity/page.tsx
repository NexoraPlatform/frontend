import { useTranslations } from 'next-intl';
import ActivitiesList from '@/components/ActivitiesList';

export default function AdminActivityPage() {
    return (
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-8 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_60%)]" />
                <div className="relative flex flex-col gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        History
                    </span>
                    <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">System Activities</h1>
                    <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                        Track all automated events and user interactions in the system.
                    </p>
                </div>
            </div>

            <ActivitiesList />
        </div>
    );
}
