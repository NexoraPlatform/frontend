import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mb-10 rounded-3xl border border-border/60 bg-card/70 p-8 dark:border-slate-800/70 dark:bg-slate-900/60">
        <Skeleton className="mb-4 h-4 w-32 bg-muted/80 dark:bg-slate-800" />
        <Skeleton className="mb-4 h-10 w-2/3 bg-muted/80 dark:bg-slate-800" />
        <Skeleton className="h-5 w-full max-w-2xl bg-muted/80 dark:bg-slate-800" />
      </div>

      <div className="mb-10 grid gap-6 xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border/60 bg-card/80 p-6 dark:border-slate-800/70 dark:bg-slate-900/70"
          >
            <Skeleton className="mb-3 h-4 w-24 bg-muted/80 dark:bg-slate-800" />
            <Skeleton className="h-8 w-2/3 bg-muted/80 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      <div className="grid gap-8 xs:grid-cols-1 lg:grid-cols-[2.6fr_1fr]">
        <div className="space-y-6">
          <Skeleton className="h-72 w-full rounded-2xl bg-card dark:bg-slate-900/70" />
          <Skeleton className="h-[460px] w-full rounded-2xl bg-card dark:bg-slate-900/70" />
        </div>
        <Skeleton className="h-[620px] w-full rounded-2xl bg-card dark:bg-slate-900/70" />
      </div>
    </div>
  );
}

