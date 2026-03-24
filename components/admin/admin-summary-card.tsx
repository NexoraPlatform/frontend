"use client";

import type { ComponentType, ReactNode } from "react";
import { motion } from "framer-motion";

import { Link } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AdminSummaryCardProps = {
  title: ReactNode;
  value: ReactNode;
  icon: ComponentType<{ className?: string }>;
  colorClassName: string;
  badge?: ReactNode;
  footer?: ReactNode;
  href?: string;
  className?: string;
  delay?: number;
};

export function AdminSummaryCard({
  title,
  value,
  icon: Icon,
  colorClassName,
  badge,
  footer,
  href,
  className,
  delay = 0,
}: AdminSummaryCardProps) {
  const card = (
    <div
      className={cn(
        "glass-effect h-full rounded-2xl border border-border p-6 transition-all duration-300",
        href ? "group hover:border-primary/40" : "",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            colorClassName,
            href ? "transition-transform group-hover:scale-110" : ""
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        {badge}
      </div>

      <p className="mb-2 text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
    >
      {href ? (
        <Link href={href} className="block h-full">
          {card}
        </Link>
      ) : (
        card
      )}
    </motion.div>
  );
}
