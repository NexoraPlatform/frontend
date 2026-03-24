"use client";

import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { AdminSurfaceCard } from "@/components/admin/admin-surface-card";

type IconComponent = ComponentType<{ className?: string }>;

type AdminSidebarCardProps = {
  icon: IconComponent;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  delay?: number;
};

type AdminOverviewItemProps = {
  label: ReactNode;
  value?: ReactNode;
  children?: ReactNode;
  className?: string;
  valueClassName?: string;
};

export function AdminSidebarCard({
  icon: Icon,
  title,
  description,
  children,
  className,
  delay = 0,
}: AdminSidebarCardProps) {
  return (
    <AdminSurfaceCard delay={delay} className={className}>
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>

      {children}
    </AdminSurfaceCard>
  );
}

export function AdminOverviewItem({
  label,
  value,
  children,
  className,
  valueClassName,
}: AdminOverviewItemProps) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-background/50 p-4", className)}>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      {children ? (
        <div className="mt-2">{children}</div>
      ) : (
        <p className={cn("mt-2 text-sm", valueClassName)}>{value}</p>
      )}
    </div>
  );
}
