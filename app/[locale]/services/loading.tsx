import { Skeleton } from '@/components/ui/skeleton';
import {
  PublicHeroSkeleton,
  PublicListCardSkeleton,
  PublicPageShell,
} from '@/components/loading/public-page-shell';

export default function ServicesLoading() {
  return (
    <PublicPageShell>
      <section className="px-6 pb-16 pt-8">
        <div className="mx-auto mb-12 max-w-7xl">
          <PublicHeroSkeleton />
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <aside className="rounded-xl border border-slate-200 bg-white p-6 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
              <Skeleton className="mb-6 h-6 w-32 bg-slate-200/70 dark:bg-[#1E2A3D]" />
              <div className="space-y-4">
                <Skeleton className="h-11 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
                <Skeleton className="h-11 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
                <Skeleton className="h-11 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
                <Skeleton className="h-11 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
                <Skeleton className="h-11 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
              </div>
            </aside>

            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <PublicListCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}

