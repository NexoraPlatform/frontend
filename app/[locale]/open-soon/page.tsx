"use client";

import { useMemo } from "react";
import Image from "next/image";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "next-themes";
import {
  CheckCircle2,
  Code2,
  FileCheck,
  Lock,
  Moon,
  Scale,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const copy = {
  ro: {
    title: "Infrastructura de încredere pentru",
    titleAccent: "economia digitală.",
    badge: "Infrastructura se încarcă...",
    subtitle:
      "Trustora securizează banii și munca prin escrow automatizat, contracte legale și profesioniști verificați.",
    subtitleHighlight: "Early Access începe în curând.",
    support: "Contact suport",
    languageLabel: "Limba",
    themeLabel: "Temă",
    themeLight: "Lumină",
    themeDark: "Întuneric",
    escrowTitle: "Escrow Vault",
    escrowTotal: "Total securizat",
    escrowStatus: "FONDURI_BLOCATE",
    contractTitle: "Logică smart contract",
    contractWaiting: "// Așteptăm confirmarea livrării...",
    trustIdentity: "Identitate verificată",
    trustPayment: "Plată protejată",
    trustDispute: "Rezolvare dispute",
    featureVerifiedTitle: "Doar conturi verificate",
    featureVerifiedBody:
      "Fără conturi false. Fiecare utilizator trece printr-o verificare riguroasă de identitate.",
    featureEscrowTitle: "Escrow protejat",
    featureEscrowBody:
      "Banii sunt blocați la începutul proiectului și eliberați doar la livrare.",
    featureContractsTitle: "Contracte legale",
    featureContractsBody:
      "Nu doar un chat. Fiecare proiect generează un contract legal opozabil.",
    footerCopy: "© 2026 Trustora Systems. Infrastructură de încredere digitală.",
  },
  en: {
    title: "Trusted infrastructure for",
    titleAccent: "the digital economy.",
    badge: "Infrastructure loading...",
    subtitle:
      "Trustora secures money and work through automated escrow, legal contracts, and verified professionals.",
    subtitleHighlight: "Early Access starts soon.",
    support: "Contact support",
    languageLabel: "Language",
    themeLabel: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    escrowTitle: "Escrow Vault",
    escrowTotal: "Total secured",
    escrowStatus: "FUNDS_LOCKED",
    contractTitle: "Smart contract logic",
    contractWaiting: "// Waiting for delivery confirmation...",
    trustIdentity: "Identity verified",
    trustPayment: "Payment protected",
    trustDispute: "Dispute resolution",
    featureVerifiedTitle: "Verified only",
    featureVerifiedBody:
      "No fake accounts. Every user goes through rigorous identity verification.",
    featureEscrowTitle: "Escrow protected",
    featureEscrowBody:
      "Funds are locked at project start and released only on delivery.",
    featureContractsTitle: "Legal contracts",
    featureContractsBody:
      "Not just a chat. Each project generates a legally binding contract.",
    footerCopy: "© 2026 Trustora Systems. Digital trust infrastructure.",
  },
};

export default function OpenSoonPage() {
  const locale = useLocale();
  const content = useMemo(() => copy[locale] ?? copy.ro, [locale]);
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3] overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:bg-[radial-gradient(#1E293B_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute left-[-100px] top-0 h-96 w-96 rounded-full bg-emerald-400/40 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#0B1C2D]/30 blur-[80px] dark:bg-[#0B1C2D]/60" />

      <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Image
            src="/trustora-logo2.svg"
            alt="Trustora Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-xl font-extrabold tracking-tight text-[#0B1C2D] dark:text-white">
            TRUSTORA
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/70 dark:text-slate-200">
            <span className="px-2 py-1 text-[10px] uppercase tracking-wider">{content.languageLabel}</span>
            <LocaleSwitcher currentLocale={locale} className="h-8 w-8 px-2" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-11 w-11 hover:text-[#0B1C2D] dark:bg-[#0B1220] dark:text-white dark:hover:bg-emerald-500/10 dark:hover:text-white rounded-xl transition-all duration-200 hover:scale-105"
            aria-label={`${content.themeLabel} ${theme === "dark" ? content.themeLight : content.themeDark}`}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <a
            href="mailto:contact@trustora.com"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-[#0B1C2D] dark:text-slate-300 dark:hover:text-white"
          >
            {content.support}
          </a>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-20 pt-12 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-mono font-medium text-slate-600 shadow-sm backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/80 dark:text-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
          </span>
          {content.badge}
        </div>

        <h1 className="mb-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-[#0B1C2D] dark:text-white md:text-6xl">
          {content.title}
          <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-[#0B1C2D] via-slate-500 to-emerald-500 bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-emerald-300">
            {content.titleAccent}
          </span>
        </h1>

        <p className="mb-12 max-w-2xl text-lg text-slate-600 dark:text-slate-300 md:text-xl">
          {content.subtitle}
          <br />
          <span className="font-medium text-[#0B1C2D] dark:text-white">
            {content.subtitleHighlight}
          </span>
        </p>

        <div className="group relative w-full max-w-4xl cursor-default">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-slate-200 via-emerald-300/30 to-slate-200 blur opacity-75 transition duration-1000 group-hover:opacity-100 dark:from-[#1E2A3D] dark:via-emerald-400/30 dark:to-[#1E2A3D]" />

          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl dark:border-[#1E2A3D] dark:bg-[#0B1220]">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#1E2A3D] dark:bg-[#111B2D]">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>
              <div className="ml-4 font-mono text-xs text-slate-400">trustora_core_v1.0.tsx</div>
            </div>

            <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-3 md:p-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                  <Lock className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{content.escrowTitle}</span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-[#F5F7FA] p-4 dark:border-[#1E2A3D] dark:bg-[#070C14]">
                  <div className="mb-2 flex items-end justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-300">{content.escrowTotal}</span>
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="font-mono text-2xl font-bold text-[#0B1C2D] dark:text-white">€2,450.00</div>
                  <div className="mt-2 flex items-center gap-1 text-xs font-mono text-emerald-600 dark:text-emerald-300">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    {content.escrowStatus}
                  </div>
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
                  <FileCheck className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{content.contractTitle}</span>
                </div>
                <div className="relative overflow-hidden rounded-lg bg-[#0B1C2D] p-4 font-mono text-xs text-slate-200 md:text-sm">
                  <div className="absolute right-0 top-0 p-2 opacity-20">
                    <Code2 className="h-12 w-12" />
                  </div>
                  <p className="mb-1">
                    <span className="text-emerald-300">const</span> transaction = <span className="text-amber-300">await</span>{" "}
                    Trustora.create({"{"})
                  </p>
                  <p className="mb-1 pl-4">client: <span className="text-emerald-200">&apos;verified_id_99&apos;</span>,</p>
                  <p className="mb-1 pl-4">provider: <span className="text-emerald-200">&apos;dev_expert_01&apos;</span>,</p>
                  <p className="mb-1 pl-4">amount: <span className="text-blue-300">2450.00</span>,</p>
                  <p className="mb-1 pl-4">condition: <span className="text-emerald-200">&apos;milestone_delivery&apos;</span></p>
                  <p className="mb-1">{"});"}</p>
                  <p className="mt-2 text-slate-400">{content.contractWaiting}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs font-medium text-slate-500 dark:border-[#1E2A3D] dark:bg-[#111B2D] dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {content.trustIdentity}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {content.trustPayment}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {content.trustDispute}
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="mx-auto w-full max-w-7xl border-t border-slate-200 px-6 py-12 dark:border-[#1E2A3D]">
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3 md:text-left">
          <div className="rounded-xl border border-transparent p-6 transition-all duration-300 hover:border-slate-100 hover:bg-white hover:shadow-sm dark:hover:border-[#1E2A3D] dark:hover:bg-[#0B1220]">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#0B1C2D] md:mx-0 dark:bg-blue-500/10 dark:text-blue-200">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-bold text-[#0B1C2D] dark:text-white">{content.featureVerifiedTitle}</h3>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-300">
              {content.featureVerifiedBody}
            </p>
          </div>

          <div className="rounded-xl border border-transparent p-6 transition-all duration-300 hover:border-slate-100 hover:bg-white hover:shadow-sm dark:hover:border-[#1E2A3D] dark:hover:bg-[#0B1220]">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 md:mx-0 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-bold text-[#0B1C2D] dark:text-white">{content.featureEscrowTitle}</h3>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-300">
              {content.featureEscrowBody}
            </p>
          </div>

          <div className="rounded-xl border border-transparent p-6 transition-all duration-300 hover:border-slate-100 hover:bg-white hover:shadow-sm dark:hover:border-[#1E2A3D] dark:hover:bg-[#0B1220]">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-amber-600 md:mx-0 dark:bg-amber-500/10 dark:text-amber-200">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-bold text-[#0B1C2D] dark:text-white">{content.featureContractsTitle}</h3>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-300">
              {content.featureContractsBody}
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{content.footerCopy}</p>
        </div>
      </section>
    </div>
  );
}
