"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type AdminSurfaceCardProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function AdminSurfaceCard({
  children,
  className,
  delay = 0,
}: AdminSurfaceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className={cn("glass-effect rounded-2xl border border-border p-6", className)}
    >
      {children}
    </motion.div>
  );
}
