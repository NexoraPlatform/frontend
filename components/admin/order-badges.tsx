"use client";

import { AlertCircle, CheckCircle2, Clock3, type LucideIcon, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  AdminOrderStatus,
  AdminPaymentStatus,
} from "@/lib/admin-orders-fallback";

const ORDER_STATUS_STYLE_MAP: Record<
  AdminOrderStatus,
  { className: string; icon: LucideIcon }
> = {
  PENDING: {
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
    icon: Clock3,
  },
  ACCEPTED: {
    className:
      "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
    icon: CheckCircle2,
  },
  IN_PROGRESS: {
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200",
    icon: Clock3,
  },
  DELIVERED: {
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    icon: CheckCircle2,
  },
  COMPLETED: {
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    icon: CheckCircle2,
  },
  CANCELLED: {
    className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
    icon: XCircle,
  },
  DISPUTED: {
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200",
    icon: AlertCircle,
  },
};

const PAYMENT_STATUS_STYLE_MAP: Record<AdminPaymentStatus, string> = {
  PENDING:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  FAILED: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  REFUNDED:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
};

export function AdminOrderStatusBadge({
  status,
  label,
}: {
  status: AdminOrderStatus;
  label: string;
}) {
  const style = ORDER_STATUS_STYLE_MAP[status] ?? ORDER_STATUS_STYLE_MAP.PENDING;
  const Icon = style.icon;

  return (
    <Badge className={style.className}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
}

export function AdminPaymentStatusBadge({
  status,
  label,
}: {
  status: AdminPaymentStatus;
  label: string;
}) {
  return (
    <Badge className={PAYMENT_STATUS_STYLE_MAP[status] ?? PAYMENT_STATUS_STYLE_MAP.PENDING}>
      {label}
    </Badge>
  );
}
