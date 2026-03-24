"use client";

import { Badge } from "@/components/ui/badge";
import type {
  AdminDisputePriority,
  AdminDisputeStatus,
} from "@/lib/admin-disputes-fallback";

const DISPUTE_STATUS_STYLES: Record<AdminDisputeStatus, string> = {
  OPEN: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  UNDER_REVIEW:
    "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
  ESCALATED:
    "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  RESOLVED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
};

const DISPUTE_PRIORITY_STYLES: Record<AdminDisputePriority, string> = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
  CRITICAL:
    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
};

export function AdminDisputeStatusBadge({
  status,
  label,
}: {
  status: AdminDisputeStatus;
  label: string;
}) {
  return <Badge className={DISPUTE_STATUS_STYLES[status]}>{label}</Badge>;
}

export function AdminDisputePriorityBadge({
  priority,
  label,
}: {
  priority: AdminDisputePriority;
  label: string;
}) {
  return <Badge className={DISPUTE_PRIORITY_STYLES[priority]}>{label}</Badge>;
}
