"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Building2,
  ChartBar as BarChart3,
  Globe,
  Landmark,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { LandingPartner } from "./types";

const socialProofIcons: LucideIcon[] = [
  Landmark,
  Building2,
  Briefcase,
  BarChart3,
  Shield,
  Globe,
];

export function TrustoraLandingSocialProofSection() {
  const t = useTranslations("trustora.landing");

  const partners: LandingPartner[] = [
    { name: "SecureBank", icon: socialProofIcons[0] },
    { name: "FinanceHub", icon: socialProofIcons[1] },
    { name: "TradePro", icon: socialProofIcons[2] },
    { name: "WealthMax", icon: socialProofIcons[3] },
    { name: "SafeGuard", icon: socialProofIcons[4] },
    { name: "PayStream", icon: socialProofIcons[5] },
  ];

  return (
    <section className="border-y border-white/5 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {t("social_proof.title")}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {partners.map((partner, index) => {
            const Icon = partner.icon;

            return (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group flex flex-col items-center justify-center space-y-3 rounded-2xl p-6 transition-all duration-300 hover:glass-effect"
              >
                <Icon className="h-10 w-10 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
                <span className="text-sm font-medium text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                  {partner.name}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
