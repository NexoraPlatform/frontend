import type { ReactNode } from 'react';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Skeleton } from '@/components/ui/skeleton';

type PublicPageShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

export function PublicPageShell({ children, mainClassName }: PublicPageShellProps) {
  return (
    <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
      <TrustoraThemeStyles />
      <Header />
      <main className={mainClassName ?? 'min-h-screen bg-slate-50 pt-8 dark:bg-[#070C14]'}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function PublicHeroSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-36 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
      <Skeleton className="h-12 w-full max-w-3xl bg-slate-200/70 dark:bg-[#1E2A3D]" />
      <Skeleton className="h-5 w-full max-w-2xl bg-slate-200/70 dark:bg-[#1E2A3D]" />
    </div>
  );
}

export function PublicListCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Skeleton className="h-6 w-28 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
        <Skeleton className="h-4 w-24 bg-slate-200/70 dark:bg-[#1E2A3D]" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-4/5 bg-slate-200/70 dark:bg-[#1E2A3D]" />
        <Skeleton className="h-4 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
        <Skeleton className="h-4 w-2/3 bg-slate-200/70 dark:bg-[#1E2A3D]" />
      </div>
      <div className="mt-6 flex gap-2">
        <Skeleton className="h-7 w-16 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
        <Skeleton className="h-7 w-20 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
        <Skeleton className="h-7 w-14 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Skeleton className="h-10 w-full rounded-lg bg-slate-200/70 dark:bg-[#1E2A3D]" />
        <Skeleton className="h-10 w-full rounded-lg bg-slate-200/70 dark:bg-[#1E2A3D]" />
      </div>
    </div>
  );
}

