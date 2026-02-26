import { Skeleton } from '@/components/ui/skeleton';
import {
  PublicHeroSkeleton,
  PublicListCardSkeleton,
  PublicPageShell,
} from '@/components/loading/public-page-shell';

export default function ProjectsLoading() {
  return (
    <PublicPageShell>
      <section className="hero-gradient px-6 pb-12 pt-32">
        <div className="mx-auto max-w-7xl">
          <PublicHeroSkeleton />
        </div>
      </section>

      <section className="px-6">
        <div className="mx-auto max-w-7xl rounded-xl border border-slate-200 bg-white p-6 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-11 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
            <Skeleton className="h-11 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
            <Skeleton className="h-11 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
            <Skeleton className="h-11 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-12 dark:bg-[#070C14]">
        <div className="mx-auto max-w-7xl space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <PublicListCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}

