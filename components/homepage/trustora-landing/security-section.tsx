"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Eye, FileCheck, Lock, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";

import type { LandingIconItem } from "./types";

export function TrustoraLandingSecuritySection() {
  const t = useTranslations("trustora.landing");

  const features: LandingIconItem[] = [
    {
      icon: Shield,
      title: t("security.items.first.title"),
      description: t("security.items.first.description"),
    },
    {
      icon: Lock,
      title: t("security.items.second.title"),
      description: t("security.items.second.description"),
    },
    {
      icon: Eye,
      title: t("security.items.third.title"),
      description: t("security.items.third.description"),
    },
    {
      icon: FileCheck,
      title: t("security.items.fourth.title"),
      description: t("security.items.fourth.description"),
    },
  ];

  const panelChecklist = [
    t("security.panel.checklist.first"),
    t("security.panel.checklist.second"),
    t("security.panel.checklist.third"),
    t("security.panel.checklist.fourth"),
    t("security.panel.checklist.fifth"),
    t("security.panel.checklist.sixth"),
  ];

  const certifications = [
    t("security.certifications.first"),
    t("security.certifications.second"),
    t("security.certifications.third"),
    t("security.certifications.fourth"),
    t("security.certifications.fifth"),
    t("security.certifications.sixth"),
  ];

  return (
    <section id="security" className="relative isolate overflow-hidden py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
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
            <Shield className="mr-2 h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t("security.badge")}</span>
          </div>
          <h2 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl">
            {t("security.title")} <span className="text-gradient">{t("security.title_highlight")}</span>
          </h2>
          <p className="text-xl text-muted-foreground">{t("security.subtitle")}</p>
        </motion.div>

        <div className="mb-20 grid items-center gap-16 lg:grid-cols-2">
          <div className="space-y-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass-effect flex items-start space-x-4 rounded-2xl p-6 transition-all duration-300 hover:border-primary/40"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="glass-effect rounded-3xl p-8 lg:p-12">
              <div className="space-y-8">
                <div className="text-center">
                  <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20">
                    <Shield className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold">{t("security.panel.title")}</h3>
                  <p className="text-muted-foreground">{t("security.panel.description")}</p>
                </div>

                <div className="space-y-4">
                  {panelChecklist.map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.05 }}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-sm">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-effect rounded-3xl p-8 lg:p-12"
        >
          <div className="mb-8 text-center">
            <h3 className="mb-3 text-2xl font-bold">{t("security.compliance_title")}</h3>
            <p className="text-muted-foreground">{t("security.compliance_description")}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {certifications.map((certification, index) => (
              <motion.div
                key={certification}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="flex flex-col justify-center rounded-xl border border-white/5 bg-background/50 p-4 text-center transition-colors duration-300 hover:border-primary/40"
              >
                <div className="text-sm font-medium">{certification}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Button asChild size="lg" variant="outline" className="border-2 px-8 font-medium">
            <Link href="/help">{t("security.documentation_cta")}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
