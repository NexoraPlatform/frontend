"use client";

import { motion } from "framer-motion";
import { ArrowRight, Rocket, Settings, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

import type { LandingStep } from "./types";

export function TrustoraLandingHowItWorksSection() {
  const t = useTranslations("trustora.landing");

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
    <section id="how-it-works" className="bg-secondary/20 py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-20 max-w-3xl text-center"
        >
          <div className="glass-effect mb-6 inline-flex items-center rounded-full px-4 py-2">
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
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-8">
                      <div className="glass-effect relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110">
                        <Icon className="h-10 w-10 text-primary" />
                      </div>
                      <div className="absolute -right-9 -top-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
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
