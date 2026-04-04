"use client";

import { motion } from "framer-motion";
import {
  ChartBar as BarChart3,
  FileCheck,
  Gauge,
  Globe,
  Lock,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { LandingIconItem } from "./types";

export function TrustoraLandingFeaturesSection() {
  const t = useTranslations("trustora.landing");

  const items: LandingIconItem[] = [
    {
      icon: Shield,
      title: t("features.items.first.title"),
      description: t("features.items.first.description"),
    },
    {
      icon: Sparkles,
      title: t("features.items.second.title"),
      description: t("features.items.second.description"),
    },
    {
      icon: BarChart3,
      title: t("features.items.third.title"),
      description: t("features.items.third.description"),
    },
    {
      icon: FileCheck,
      title: t("features.items.fourth.title"),
      description: t("features.items.fourth.description"),
    },
    {
      icon: Globe,
      title: t("features.items.fifth.title"),
      description: t("features.items.fifth.description"),
    },
    {
      icon: Lock,
      title: t("features.items.sixth.title"),
      description: t("features.items.sixth.description"),
    },
    {
      icon: TrendingUp,
      title: t("features.items.seventh.title"),
      description: t("features.items.seventh.description"),
    },
    {
      icon: Gauge,
      title: t("features.items.eighth.title"),
      description: t("features.items.eighth.description"),
    },
  ];

  return (
    <section id="features" className="relative isolate overflow-hidden py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-20 max-w-3xl text-center"
        >
          <div className="glass-effect mb-6 inline-flex items-center rounded-full px-4 py-2">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t("features.badge")}</span>
          </div>
          <h2 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl">
            {t("features.title")} <span className="text-gradient">{t("features.title_highlight")}</span>
          </h2>
          <p className="text-xl text-muted-foreground">{t("features.subtitle")}</p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="glass-effect group rounded-3xl p-8 transition-all duration-300 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
