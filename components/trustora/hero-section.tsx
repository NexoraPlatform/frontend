import Image from "next/image";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/types/locale";

export async function TrustoraHeroSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "trustora" });
  const badgeText = t("hero.badge");
  const title = t("hero.title");
  const titleHighlight = t("hero.title_highlight");
  const subtitle = t("hero.subtitle");
  const primaryCta = t("hero.primary_cta");
  const secondaryCta = t("hero.secondary_cta");
  const trustedLabel = t("hero.trusted_label");
  const dashboardLabel = t("hero.dashboard_label");
  const securedLabel = t("hero.secured_label");
  const contractName = t("hero.contract_name");
  const contractValue = t("hero.contract_value");
  const milestoneProgress = t("hero.milestone_progress");
  const milestoneEta = t("hero.milestone_eta");
  const nextMilestoneLabel = t("hero.next_milestone");
  const payoutLabel = t("hero.payout_label");
  const payoutValue = t("hero.payout_value");

  const logoAlt =
    locale === "ro"
      ? "Logo Trustora pentru marketplace de servicii IT"
      : "Trustora logo for IT services marketplace";

  return (
    <section
      className="relative overflow-hidden bg-white px-6 pb-20 pt-8 text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]"
      aria-labelledby="trustora-hero-title"
      itemScope
      itemType="https://schema.org/Service"
    >
      <meta
        itemProp="serviceType"
        content={locale === "ro" ? "Marketplace servicii IT și freelancing" : "IT services marketplace"}
      />
      <meta itemProp="areaServed" content="Romania" />

      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F7FA]/85 via-[#F5F7FA]/65 to-white dark:from-[#0B1C2D]/70 dark:via-[#0B1C2D]/60 dark:to-[#070C14]/90" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <article>
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-200">
            <Image
              src="/trustora-logo2-120.avif"
              width={30}
              height={30}
              priority
              sizes="30px"
              alt={logoAlt}
              className="h-[30px] w-[30px] rounded-md"
            />
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {badgeText}
          </div>

          <h1
            id="trustora-hero-title"
            className="mb-6 text-5xl font-bold leading-[1.1] text-[#0F172A] dark:text-white lg:text-7xl"
            itemProp="name"
          >
            {title} <span className="text-[#1BC47D]">{titleHighlight}</span>
          </h1>

          <p
            className="mb-10 max-w-lg text-lg leading-relaxed text-slate-700 dark:text-slate-200"
            itemProp="description"
          >
            {subtitle}
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              aria-label={primaryCta}
              className="btn-primary rounded-xl px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-200/50"
            >
              {primaryCta}
            </button>
            <button
              type="button"
              aria-label={secondaryCta}
              className="rounded-xl border border-[#0B1C2D]/35 bg-transparent px-8 py-4 text-lg font-semibold text-[#0B1C2D] hover:bg-[#0B1C2D]/5 dark:border-[#1BC47D] dark:text-[#1BC47D] dark:hover:bg-[#1BC47D]/10"
            >
              {secondaryCta}
            </button>
          </div>

          <div className="mt-10 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex -space-x-2" aria-hidden="true">
              <div className="h-8 w-8 rounded-full border-2 border-[#F5F7FA] bg-slate-300 dark:border-[#0B1C2D]" />
              <div className="h-8 w-8 rounded-full border-2 border-[#F5F7FA] bg-slate-400 dark:border-[#0B1C2D]" />
              <div className="h-8 w-8 rounded-full border-2 border-[#F5F7FA] bg-slate-500 dark:border-[#0B1C2D]" />
            </div>
            <span>{trustedLabel}</span>
          </div>
        </article>

        <aside className="relative" aria-label={dashboardLabel}>
          <div className="glass-card relative z-10 rounded-2xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="mono text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {dashboardLabel}
              </span>
              <span className="rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-[#1BC47D]/15 dark:text-[#1BC47D]">
                {securedLabel}
              </span>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#1E2A3D] dark:bg-[#111B2D]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {contractName}
                  </span>
                  <span className="mono text-sm font-bold text-slate-900 dark:text-slate-100">
                    {contractValue}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#1E2A3D]">
                  <div className="h-full w-3/4 bg-[#1BC47D]" aria-hidden="true" />
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-medium text-slate-600 dark:text-slate-300">
                  <span>{milestoneProgress}</span>
                  <span>{milestoneEta}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-3 text-xs italic text-slate-600 dark:border-[#1E2A3D] dark:text-[#9CA3AF]">
                  <span>{nextMilestoneLabel}</span>
                </div>
                <div className="flex w-24 flex-col items-center justify-center rounded-xl bg-[#0B1C2D] p-3 text-white dark:border dark:border-[#1E2A3D] dark:bg-[#0B1220] dark:text-[#E6EDF3]">
                  <span className="text-[10px] opacity-75">{payoutLabel}</span>
                  <span className="font-bold">{payoutValue}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-10 -top-10 -z-0 h-40 w-40 rounded-full bg-emerald-100 opacity-50 blur-3xl dark:bg-[#1BC47D]/20" />
          <div className="absolute -bottom-10 -left-10 -z-0 h-40 w-40 rounded-full bg-emerald-100 opacity-50 blur-3xl dark:bg-[#0B1C2D]/60" />
        </aside>
      </div>
    </section>
  );
}
