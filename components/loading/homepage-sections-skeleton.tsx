import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Skeleton } from '@/components/ui/skeleton';

export function HomeHeroSkeleton() {
  return (
    <section className="relative overflow-hidden bg-white px-6 pb-20 pt-8 dark:bg-[#070C14]">
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <Skeleton className="mb-6 h-9 w-52 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
          <Skeleton className="mb-4 h-16 w-full max-w-2xl bg-slate-200/70 dark:bg-[#1E2A3D]" />
          <Skeleton className="mb-8 h-16 w-full max-w-xl bg-slate-200/70 dark:bg-[#1E2A3D]" />
          <div className="mb-10 flex flex-col gap-4 sm:flex-row">
            <Skeleton className="h-14 w-48 rounded-xl bg-slate-200/70 dark:bg-[#1E2A3D]" />
            <Skeleton className="h-14 w-48 rounded-xl bg-slate-200/70 dark:bg-[#1E2A3D]" />
          </div>
          <Skeleton className="h-8 w-64 bg-slate-200/70 dark:bg-[#1E2A3D]" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
          <Skeleton className="mb-6 h-4 w-40 bg-slate-200/70 dark:bg-[#1E2A3D]" />
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl bg-slate-200/70 dark:bg-[#1E2A3D]" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 w-full rounded-xl bg-slate-200/70 dark:bg-[#1E2A3D]" />
              <Skeleton className="h-20 w-full rounded-xl bg-slate-200/70 dark:bg-[#1E2A3D]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomePillarsSkeleton() {
  return (
    <section className="bg-[#F5F7FA] px-6 py-24 dark:bg-[#0B1220]">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="h-6 w-6 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
            <Skeleton className="h-4 w-24 bg-slate-200/70 dark:bg-[#1E2A3D]" />
            <Skeleton className="h-14 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeMessagingSkeleton() {
  return (
    <section className="bg-white px-6 py-24 dark:bg-[#070C14]">
      <div className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-3xl border border-slate-100 bg-slate-100 md:grid-cols-2 dark:border-[#1E2A3D] dark:bg-[#1E2A3D]">
        <div className="bg-white p-12 dark:bg-[#0B1220]">
          <Skeleton className="mb-6 h-6 w-24 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
          <Skeleton className="mb-4 h-12 w-3/4 bg-slate-200/70 dark:bg-[#1E2A3D]" />
          <Skeleton className="mb-8 h-20 w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3 bg-slate-200/70 dark:bg-[#1E2A3D]" />
            <Skeleton className="h-4 w-2/3 bg-slate-200/70 dark:bg-[#1E2A3D]" />
          </div>
        </div>

        <div className="bg-[#0B1C2D] p-12 dark:bg-[#0B1220]">
          <Skeleton className="mb-6 h-6 w-24 rounded-full bg-[#1E2A3D]" />
          <Skeleton className="mb-4 h-12 w-3/4 bg-[#1E2A3D]" />
          <Skeleton className="mb-8 h-20 w-full bg-[#1E2A3D]" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3 bg-[#1E2A3D]" />
            <Skeleton className="h-4 w-2/3 bg-[#1E2A3D]" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeVisualSkeleton() {
  return (
    <section className="overflow-hidden bg-white px-6 py-24 dark:bg-[#070C14]">
      <div className="mx-auto max-w-7xl text-center">
        <Skeleton className="mx-auto mb-16 h-10 w-96 max-w-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
        <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:gap-20">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex h-48 w-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1E2A3D] dark:bg-[#0B1220]"
            >
              <Skeleton className="mb-4 h-12 w-12 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
              <Skeleton className="mb-2 h-4 w-28 bg-slate-200/70 dark:bg-[#1E2A3D]" />
              <Skeleton className="h-3 w-20 bg-slate-200/70 dark:bg-[#1E2A3D]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeFinalCtaSkeleton() {
  return (
    <section className="bg-[#0B1C2D] px-6 py-32 text-white dark:bg-[#0B1220]">
      <div className="mx-auto max-w-3xl text-center">
        <Skeleton className="mx-auto mb-8 h-14 w-full max-w-2xl bg-[#1E2A3D]" />
        <Skeleton className="mx-auto mb-12 h-6 w-full max-w-xl bg-[#1E2A3D]" />
        <Skeleton className="mx-auto h-14 w-56 rounded-lg bg-[#1E2A3D]" />
      </div>
    </section>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
      <TrustoraThemeStyles />
      <Header />
      <main className="pt-8">
        <HomeHeroSkeleton />
        <HomePillarsSkeleton />
        <HomeMessagingSkeleton />
        <HomeVisualSkeleton />
        <HomeFinalCtaSkeleton />
      </main>
      <Footer />
    </div>
  );
}

