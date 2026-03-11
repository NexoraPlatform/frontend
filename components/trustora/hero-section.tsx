import Image from "next/image";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/types/locale";
import { TrustoraHeroSecurityVisual } from "@/components/trustora/hero-security-visual";

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

  const logoAlt =
    locale === "ro"
      ? "Logo Trustora pentru marketplace de servicii IT"
      : "Trustora logo for IT services marketplace";

  return (
    <section
      id="trustora-home-hero"
      className="relative overflow-hidden bg-[#060B19] px-6 pb-20 pt-24 text-[#E6EDF3] sm:pt-28"
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(11,26,64,0.9),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(72,202,228,0.12),transparent_28%),linear-gradient(180deg,#060B19_0%,#08101F_60%,#060B19_100%)]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <article>
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-100">
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
            className="mb-6 text-5xl font-bold leading-[1.1] text-white lg:text-7xl"
            itemProp="name"
          >
            {title} <span className="text-[#1BC47D]">{titleHighlight}</span>
          </h1>

          <p
            className="mb-10 max-w-lg text-lg leading-relaxed text-slate-300"
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
              className="rounded-xl border border-[#1BC47D]/70 bg-transparent px-8 py-4 text-lg font-semibold text-[#1BC47D] hover:bg-[#1BC47D]/10"
            >
              {secondaryCta}
            </button>
          </div>

          <div className="mt-10 flex items-center gap-4 text-sm text-slate-300">
            <div className="flex -space-x-2" aria-hidden="true">
              <div className="h-8 w-8 rounded-full border-2 border-[#060B19] bg-slate-300" />
              <div className="h-8 w-8 rounded-full border-2 border-[#060B19] bg-slate-400" />
              <div className="h-8 w-8 rounded-full border-2 border-[#060B19] bg-slate-500" />
            </div>
            <span>{trustedLabel}</span>
          </div>
        </article>

        <aside className="relative" aria-label={dashboardLabel}>
          <div className="mb-4 flex items-center justify-between px-2 text-xs uppercase tracking-[0.24em] text-slate-400">
            <span className="mono">{dashboardLabel}</span>
            <span className="rounded-full border border-[#1BC47D]/30 bg-[#1BC47D]/10 px-3 py-1 font-semibold text-[#74C69D]">
              {securedLabel}
            </span>
          </div>

          <TrustoraHeroSecurityVisual />
        </aside>
      </div>
    </section>
  );
}
