"use client";

import { motion } from "framer-motion";
import { ArrowRight, Rocket, Settings, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

import type { LandingStep } from "./types";

export function TrustoraLandingHowItWorksSection() {
  const t = useTranslations("trustora.landing");
  const badgeGlassClass =
    "glass-effect mb-6 inline-flex items-center rounded-full border border-white/50 bg-white/45 px-4 py-2 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[0_20px_45px_-30px_rgba(0,0,0,0.6)]";
  const stepCardClass =
    "group relative overflow-hidden rounded-[2rem] border border-white/45 bg-white/35 px-8 py-10 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.35)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-white/45 hover:shadow-[0_35px_100px_-45px_rgba(27,196,125,0.3)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]";
  const iconGlassClass =
    "glass-effect relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/50 bg-white/50 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.5)] backdrop-blur-2xl transition-transform duration-300 group-hover:scale-110 dark:border-white/10 dark:bg-white/[0.06]";

  const steps: LandingStep[] = [
    {
      number: "01",
      icon: UserPlus,
      title: t("how_it_works.steps.first.title"),
      description: t("how_it_works.steps.first.description"),
    },
    {
      number: "02",
      icon: Settings,
      title: t("how_it_works.steps.second.title"),
      description: t("how_it_works.steps.second.description"),
    },
    {
      number: "03",
      icon: Rocket,
      title: t("how_it_works.steps.third.title"),
      description: t("how_it_works.steps.third.description"),
    },
  ];

  return (
    <section id="how-it-works" className="relative isolate overflow-hidden py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.08] via-slate-50/80 to-slate-100/80 dark:from-primary/[0.12] dark:via-[#08111d] dark:to-[#0b1220]" />
        <div className="absolute left-[8%] top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20" />
        <div className="absolute right-[10%] top-24 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-100/60 blur-3xl dark:bg-emerald-500/10" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-20 max-w-3xl text-center"
        >
          <div className={badgeGlassClass}>
            <span className="text-sm font-medium">{t("how_it_works.badge")}</span>
          </div>
          <h2 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl">
            {t("how_it_works.title")}{" "}
            <span className="text-gradient">{t("how_it_works.title_highlight")}</span>
          </h2>
          <p className="text-xl text-muted-foreground">{t("how_it_works.subtitle")}</p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-0 right-0 top-1/2 hidden h-0.5 -translate-y-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent lg:block" />

          <div className="grid gap-8 md:grid-cols-3 lg:gap-16">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative"
                >
                  <div className={stepCardClass}>
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.5),rgba(255,255,255,0.08)_42%,transparent_72%)] opacity-90 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04)_40%,transparent_72%)]"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute -right-10 top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
                    />
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="relative mb-8">
                        <div className={iconGlassClass}>
                          <Icon className="h-10 w-10 text-primary" />
                        </div>
                        <div className="glass-effect absolute -right-9 -top-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/50 bg-white/40 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.4)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.05]">
                          <span className="text-2xl font-bold text-primary">{step.number}</span>
                        </div>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 -z-10 rounded-3xl bg-primary/20 blur-xl"
                        />
                      </div>

                      <h3 className="mb-4 text-2xl font-bold">{step.title}</h3>
                      <p className="max-w-sm leading-relaxed text-muted-foreground">{step.description}</p>

                      {index < steps.length - 1 ? (
                        <div className="absolute -right-8 top-12 hidden lg:block xl:-right-12">
                          <ArrowRight className="h-8 w-8 text-primary/40" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-muted-foreground">{t("how_it_works.footer")}</p>
        </motion.div>
      </div>
    </section>
  );
}
