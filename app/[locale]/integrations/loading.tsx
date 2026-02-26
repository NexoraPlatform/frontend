import { Skeleton } from '@/components/ui/skeleton';
import { PublicHeroSkeleton, PublicPageShell } from '@/components/loading/public-page-shell';

export default function IntegrationsLoading() {
  return (
    <PublicPageShell mainClassName="pt-24">
      <section className="hero-gradient px-6 pb-10">
        <div className="mx-auto max-w-6xl">
          <PublicHeroSkeleton />
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-6 py-12 dark:bg-[#0B1220]">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-16 w-full rounded-xl bg-slate-200/70 dark:bg-[#1E2A3D]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-white p-6 dark:border-[#1E2A3D] dark:bg-[#0B1220]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <Skeleton className="h-6 w-28 bg-slate-200/70 dark:bg-[#1E2A3D]" />
                  <Skeleton className="h-5 w-16 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
                  <Skeleton className="h-4 w-3/4 bg-slate-200/70 dark:bg-[#1E2A3D]" />
                </div>
                <Skeleton className="mt-6 h-10 w-full rounded-lg bg-slate-200/70 dark:bg-[#1E2A3D]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}

