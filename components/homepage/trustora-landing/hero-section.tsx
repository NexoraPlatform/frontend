"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";

import { revealEase } from "./constants";
import type { LandingMetric } from "./types";

export function TrustoraLandingHeroSection() {
  const t = useTranslations("trustora.landing");

  const metrics: LandingMetric[] = [
    { value: "99.9%", label: t("hero.metrics.uptime_label") },
    { value: "$2B+", label: t("hero.metrics.secured_label") },
    { value: "500K+", label: t("hero.metrics.transactions_label") },
  ];

  const panelStats = [
    {
      label: t("hero.panel.stats.first.label"),
      value: t("hero.panel.stats.first.value"),
      change: t("hero.panel.stats.first.change"),
    },
    {
      label: t("hero.panel.stats.second.label"),
      value: t("hero.panel.stats.second.value"),
      change: t("hero.panel.stats.second.change"),
    },
    {
      label: t("hero.panel.stats.third.label"),
      value: t("hero.panel.stats.third.value"),
      change: t("hero.panel.stats.third.change"),
    },
  ];

  const checks = [
    {
      name: t("hero.panel.checks.first.name"),
      status: t("hero.panel.checks.first.status"),
      tone: "success" as const,
    },
    {
      name: t("hero.panel.checks.second.name"),
      status: t("hero.panel.checks.second.status"),
      tone: "success" as const,
    },
    {
      name: t("hero.panel.checks.third.name"),
      status: t("hero.panel.checks.third.status"),
      tone: "accent" as const,
    },
  ];

  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden pt-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: revealEase }}
              className="glass-effect inline-flex items-center rounded-full px-4 py-2"
            >
              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-sm font-medium">{t("hero.badge")}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: revealEase }}
              className="text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl"
            >
              {t("hero.title")} <span className="text-gradient">{t("hero.title_highlight")}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: revealEase }}
              className="max-w-2xl text-xl leading-relaxed text-muted-foreground"
            >
              {t("hero.description")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: revealEase }}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Button
                asChild
                size="lg"
                className="group rounded-xl bg-primary px-8 py-6 text-base font-medium text-white transition-all duration-200 active:scale-[0.98] hover:bg-primary/90"
              >
                <Link href="/projects">
                  {t("hero.primary_cta")}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="group rounded-xl border-2 px-8 py-6 text-base font-medium transition-all duration-200 active:scale-[0.98]"
              >
                <a href="#how-it-works">
                  <Play className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                  {t("hero.secondary_cta")}
                </a>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: revealEase }}
              className="flex items-center space-x-8 pt-8"
            >
              {metrics.map((metric, index) => (
                <div key={metric.label} className="flex items-center space-x-8">
                  <div>
                    <div className="text-gradient text-3xl font-bold">{metric.value}</div>
                    <div className="text-sm text-muted-foreground">{metric.label}</div>
                  </div>
                  {index < metrics.length - 1 ? <div className="h-12 w-px bg-border" /> : null}
                </div>
              ))}
            </motion.div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: revealEase }}
              className="relative w-full max-w-lg"
              style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
            >
              <div className="absolute inset-0 -m-8 rounded-3xl bg-[#1BC47D]/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] dark:border-white/10 dark:bg-[#111B27]">
                <div className="flex items-center gap-2 border-b border-black/5 bg-black/5 px-4 py-3 dark:border-white/5 dark:bg-white/5">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                  </div>
                  <div className="mx-4 flex-1">
                    <div className="flex h-5 items-center rounded-md bg-black/5 px-3 dark:bg-white/5">
                      <span className="font-mono text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                        {t("hero.panel.browser_url")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-3 gap-3">
                    {panelStats.map((item, index) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 + index * 0.08, duration: 0.5 }}
                        className="rounded-xl bg-black/5 p-3 dark:bg-white/5"
                      >
                        <p className="mb-1 text-[10px] text-[#64748B] dark:text-[#94A3B8]">{item.label}</p>
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F5F7FA]">{item.value}</p>
                        <p className="text-[10px] font-medium text-[#1BC47D]">{item.change}</p>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.68, duration: 0.55 }}
                    className="relative h-28 overflow-hidden rounded-xl bg-black/5 p-4 dark:bg-white/5"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                        {t("hero.panel.chart.title")}
                      </span>
                      <span className="text-[10px] font-medium text-[#1BC47D]">
                        {t("hero.panel.chart.live")}
                      </span>
                    </div>

                    <svg viewBox="0 0 300 60" preserveAspectRatio="none" className="h-14 w-full">
                      <defs>
                        <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1BC47D" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#1BC47D" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,50 Q30,45 60,35 T120,25 T180,30 T240,20 T300,5"
                        fill="none"
                        stroke="#1BC47D"
                        strokeWidth="2"
                      />
                      <path
                        d="M0,50 Q30,45 60,35 T120,25 T180,30 T240,20 T300,5 L300,60 L0,60Z"
                        fill="url(#heroChartGrad)"
                      />
                    </svg>
                  </motion.div>

                  <div className="space-y-2">
                    {checks.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.08, duration: 0.45 }}
                        className="flex items-center justify-between rounded-lg bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]"
                      >
                        <span className="text-xs text-[#0F172A] dark:text-[#F5F7FA]">{item.name}</span>
                        <span
                          className={
                            item.tone === "accent"
                              ? "rounded-full px-2 py-0.5 text-[10px] font-medium text-[#21D19F] bg-[rgba(33,209,159,0.082)]"
                              : "rounded-full bg-[rgba(27,196,125,0.082)] px-2 py-0.5 text-[10px] font-medium text-[#1BC47D]"
                          }
                        >
                          {item.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
