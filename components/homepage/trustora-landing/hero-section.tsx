"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";

import { revealEase } from "./constants";
import type { LandingHeroPanel, LandingMetric } from "./types";

export function TrustoraLandingHeroSection() {
  const t = useTranslations("trustora.landing");

  const metrics: LandingMetric[] = [
    { value: "99.9%", label: t("hero.metrics.uptime_label") },
    { value: "$2B+", label: t("hero.metrics.secured_label") },
    { value: "500K+", label: t("hero.metrics.transactions_label") },
  ];

  const panel: LandingHeroPanel = {
    balanceLabel: t("hero.panel.balance_label"),
    balanceValue: t("hero.panel.balance_value"),
    balanceGrowth: t("hero.panel.balance_growth"),
    cards: [
      {
        label: t("hero.panel.income.label"),
        value: t("hero.panel.income.value"),
        trend: t("hero.panel.income.trend"),
      },
      {
        label: t("hero.panel.expenses.label"),
        value: t("hero.panel.expenses.value"),
        trend: t("hero.panel.expenses.trend"),
      },
    ],
    transactions: [
      {
        name: t("hero.panel.transactions.first.name"),
        amount: t("hero.panel.transactions.first.amount"),
        time: t("hero.panel.transactions.first.time"),
      },
      {
        name: t("hero.panel.transactions.second.name"),
        amount: t("hero.panel.transactions.second.amount"),
        time: t("hero.panel.transactions.second.time"),
      },
      {
        name: t("hero.panel.transactions.third.name"),
        amount: t("hero.panel.transactions.third.amount"),
        time: t("hero.panel.transactions.third.time"),
      },
    ],
  };

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

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: revealEase }}
            className="relative"
          >
            <div className="glass-effect relative rounded-3xl p-8 shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">{panel.balanceLabel}</div>
                    <div className="text-3xl font-bold">{panel.balanceValue}</div>
                  </div>
                  <div className="rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-primary">
                    {panel.balanceGrowth}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {panel.cards.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                      className="rounded-2xl border border-white/5 bg-background/50 p-4"
                    >
                      <div className="mb-1 text-xs text-muted-foreground">{item.label}</div>
                      <div className="text-xl font-bold">{item.value}</div>
                      <div className="mt-1 text-xs text-primary">{item.trend}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-3">
                  {panel.transactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-background/50 p-3 transition-colors hover:border-primary/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{transaction.name}</div>
                          <div className="text-xs text-muted-foreground">{transaction.time}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-primary">{transaction.amount}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(27, 196, 125, 0)",
                    "0 0 0 20px rgba(27, 196, 125, 0.05)",
                    "0 0 0 0 rgba(27, 196, 125, 0)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 -z-10 rounded-3xl"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
