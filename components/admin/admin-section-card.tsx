"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { AdminSurfaceCard } from "@/components/admin/admin-surface-card";

type AdminSectionCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  delay?: number;
};

export function AdminSectionCard({
  title,
  description,
  action,
  children,
  className,
  headerClassName,
  delay = 0,
}: AdminSectionCardProps) {
  return (
    <AdminSurfaceCard delay={delay} className={className}>
      {title || description || action ? (
        <div
          className={cn(
            "mb-6 flex items-center justify-between gap-4",
            headerClassName
          )}
        >
          <div>
            {title ? <h3 className="mb-1 text-lg font-bold">{title}</h3> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}

      {children}
    </AdminSurfaceCard>
  );
}
