"use client";

import type { ComponentType, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type IconComponent = ComponentType<{ className?: string }>;

type AdminEmptyStateProps = {
  icon: IconComponent;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

type AdminTableRowProps = {
  colSpan: number;
};

type AdminTableEmptyRowProps = AdminTableRowProps & AdminEmptyStateProps;

export function AdminSpinner({ className = "flex justify-center py-16" }: { className?: string }) {
  return (
    <div className={className}>
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "py-16 text-center",
}: AdminEmptyStateProps) {
  return (
    <div className={className}>
      <Icon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      {title ? <h3 className="text-lg font-medium">{title}</h3> : null}
      {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function AdminTableLoadingRow({ colSpan }: AdminTableRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      </td>
    </tr>
  );
}

export function AdminTableEmptyRow({
  colSpan,
  icon,
  title,
  description,
  action,
}: AdminTableEmptyRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16 text-center">
        <AdminEmptyState
          icon={icon}
          title={title}
          description={description}
          action={action}
          className="text-center"
        />
      </td>
    </tr>
  );
}
