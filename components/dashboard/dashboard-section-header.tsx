"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type DashboardSectionHeaderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: ReactNode;
};

export function DashboardSectionHeader({
  title,
  description,
  icon: Icon,
  action,
}: DashboardSectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass-effect rounded-2xl border border-border p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-400 text-white shadow-lg shadow-primary/20">
            <Icon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>
        </div>

        {action ? <div className="flex shrink-0 items-center gap-3">{action}</div> : null}
      </div>
    </motion.div>
  );
}
