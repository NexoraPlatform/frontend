import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/lib/navigation";
import type { Locale } from "@/types/locale";
import { TrustoraHeroSecurityVisual } from "@/components/trustora/hero-security-visual";

export async function TrustoraHeroSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "trustora" });
  const badgeText = t("hero.badge");
  const eyebrow = t("hero.eyebrow");
  const title = t("hero.title");
  const titleHighlight = t("hero.title_highlight");
  const subtitle = t("hero.subtitle");
  const primaryCta = t("hero.primary_cta");
  const secondaryCta = t("hero.secondary_cta");
  const ctaNote = t("hero.cta_note");
  const proofOne = t("hero.proof_one");
  const proofTwo = t("hero.proof_two");
  const proofThree = t("hero.proof_three");
  const dashboardLabel = t("hero.dashboard_label");

  const logoAlt =
    locale === "ro"
      ? "Logo Trustora pentru acces anticipat la proiecte IT protejate"
      : "Trustora logo for early access to protected IT projects";

  return (
    <section
      id="trustora-home-hero"
      className="relative h-[100svh] min-h-[100svh] max-h-[100svh] overflow-hidden bg-[#060B19] px-6 text-[#E6EDF3] supports-[height:100dvh]:h-[100dvh] supports-[height:100dvh]:min-h-[100dvh] supports-[height:100dvh]:max-h-[100dvh]"
      aria-labelledby="trustora-hero-title"
      itemScope
      itemType="https://schema.org/Service"
    >
      <meta
        itemProp="serviceType"
        content={
          locale === "ro"
            ? "Marketplace de freelancing IT cu plăți securizate prin escrow"
            : "IT freelancing marketplace with escrow-secured payments"
        }
      />
      <meta itemProp="areaServed" content="Romania" />

      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(11,26,64,0.9),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(72,202,228,0.12),transparent_28%),linear-gradient(180deg,#060B19_0%,#08101F_60%,#060B19_100%)]" />
      </div>

      <div className="relative z-10 mx-auto grid h-full max-w-7xl items-center gap-8 py-24 sm:py-28 lg:grid-cols-2 lg:gap-12">
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

          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
            {eyebrow}
          </p>

          <h1
            id="trustora-hero-title"
            className="mb-6 text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-7xl"
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
            <Link
              href="/early-access/client"
              aria-label={primaryCta}
              className="inline-flex items-center justify-center rounded-xl bg-[#1BC47D] px-8 py-4 text-center text-lg font-semibold text-[#071A12] shadow-lg shadow-emerald-500/25 transition-colors hover:bg-[#17b672]"
            >
              {primaryCta}
            </Link>
            <Link
              href="/early-access/provider"
              aria-label={secondaryCta}
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 bg-white/5 px-8 py-4 text-center text-lg font-semibold text-white transition-colors hover:border-[#1BC47D]/70 hover:bg-[#1BC47D]/10"
            >
              {secondaryCta}
            </Link>
          </div>

          <p className="mt-4 max-w-xl text-sm text-slate-400">
            {ctaNote}
          </p>

          <div className="mt-10 flex max-w-2xl flex-wrap gap-3 text-sm text-slate-200">
            {[proofTwo, proofThree].map((proof) => (
              <span
                key={proof}
                className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200"
              >
                {proof}
              </span>
            ))}
          </div>
        </article>

        <aside className="relative flex items-center justify-center lg:-ml-6" aria-label={dashboardLabel}>
          <TrustoraHeroSecurityVisual />
        </aside>
      </div>
    </section>
  );
}
