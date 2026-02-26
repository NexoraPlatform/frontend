import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Skeleton } from '@/components/ui/skeleton';

export function OpenSoonSkeleton() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#F5F7FA] text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
      <TrustoraThemeStyles />

      <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <Skeleton className="h-10 w-44 bg-slate-200/70 dark:bg-[#1E2A3D]" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
          <Skeleton className="h-10 w-10 rounded-xl bg-slate-200/70 dark:bg-[#1E2A3D]" />
          <Skeleton className="hidden h-6 w-28 bg-slate-200/70 md:block dark:bg-[#1E2A3D]" />
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-20 pt-12 text-center">
        <Skeleton className="mb-8 h-8 w-44 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
        <Skeleton className="mb-4 h-14 w-full max-w-3xl bg-slate-200/70 dark:bg-[#1E2A3D]" />
        <Skeleton className="mb-10 h-14 w-full max-w-2xl bg-slate-200/70 dark:bg-[#1E2A3D]" />
        <Skeleton className="mb-12 h-6 w-full max-w-xl bg-slate-200/70 dark:bg-[#1E2A3D]" />

        <div className="mb-16 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1E2A3D] dark:bg-slate-900">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-12 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
            <Skeleton className="h-12 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
          </div>
          <Skeleton className="mb-4 h-12 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
          <Skeleton className="h-12 w-full rounded-lg bg-slate-200/70 dark:bg-[#1E2A3D]" />
          <Skeleton className="mx-auto mt-4 h-4 w-4/5 bg-slate-200/70 dark:bg-[#1E2A3D]" />
        </div>

        <div className="w-full max-w-4xl rounded-xl border border-slate-200 bg-white p-6 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
          <Skeleton className="mb-6 h-8 w-60 bg-slate-200/70 dark:bg-[#1E2A3D]" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Skeleton className="h-40 w-full rounded-lg bg-slate-200/70 dark:bg-[#1E2A3D]" />
            <Skeleton className="h-40 w-full rounded-lg bg-slate-200/70 dark:bg-[#1E2A3D] md:col-span-2" />
          </div>
        </div>
      </main>
    </div>
  );
}

