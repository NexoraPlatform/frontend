import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="h-screen w-full overflow-hidden bg-[#F5F7FA] text-[#0F172A] dark:bg-[#06111A] dark:text-[#E6EDF3]">
      <TrustoraThemeStyles />
      <div className="flex h-full w-full overflow-hidden">
        <aside className="hidden w-64 shrink-0 border-r border-[#152B42] bg-[#0B1C2D] md:flex md:flex-col md:justify-between">
          <div className="p-6">
            <Skeleton className="mb-8 h-10 w-36 bg-[#152B42]" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full bg-[#152B42]" />
              ))}
            </div>
          </div>
          <div className="p-4">
            <Skeleton className="h-16 w-full rounded-xl bg-[#152B42]" />
          </div>
        </aside>

        <main className="flex min-h-0 flex-1 flex-col">
          <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200/60 bg-white/80 px-8 dark:border-[#1E2A3D] dark:bg-[#0D1F30]/80">
            <Skeleton className="h-10 w-80 max-w-[60%] bg-slate-200/70 dark:bg-[#1E2A3D]" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
              <Skeleton className="h-10 w-10 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
              <Skeleton className="h-10 w-10 rounded-full bg-slate-200/70 dark:bg-[#1E2A3D]" />
            </div>
          </header>

          <section className="flex-1 overflow-y-auto p-8">
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-32 rounded-2xl bg-white dark:bg-[#0D1F30]"
                />
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Skeleton className="h-[360px] rounded-2xl bg-white lg:col-span-2 dark:bg-[#0D1F30]" />
              <Skeleton className="h-[360px] rounded-2xl bg-white dark:bg-[#0D1F30]" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

