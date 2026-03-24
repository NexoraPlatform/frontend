import {
  History,
  PencilLine,
  PlusCircle,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import type { AuditLog } from "@/lib/api";

type AuditLogEventVisual = {
  icon: LucideIcon;
  iconClassName: string;
  iconBackgroundClassName: string;
  badgeClassName: string;
};

const AUDIT_EVENT_VISUALS: Record<AuditLog["event"], AuditLogEventVisual> = {
  created: {
    icon: PlusCircle,
    iconClassName: "text-emerald-600 dark:text-emerald-300",
    iconBackgroundClassName: "bg-emerald-500/10",
    badgeClassName:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  updated: {
    icon: PencilLine,
    iconClassName: "text-blue-600 dark:text-blue-300",
    iconBackgroundClassName: "bg-blue-500/10",
    badgeClassName:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  deleted: {
    icon: Trash2,
    iconClassName: "text-rose-600 dark:text-rose-300",
    iconBackgroundClassName: "bg-rose-500/10",
    badgeClassName:
      "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
};

export function getAuditEventVisual(event: AuditLog["event"]) {
  return (
    AUDIT_EVENT_VISUALS[event] ?? {
      icon: History,
      iconClassName: "text-slate-600 dark:text-slate-300",
      iconBackgroundClassName: "bg-slate-500/10",
      badgeClassName:
        "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    }
  );
}

export function formatAuditSubjectType(subjectType: string) {
  const cleanValue = subjectType.split(/[\\/]/).filter(Boolean).pop() || subjectType;

  return cleanValue
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatAuditValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function getAuditDiffEntries(log: AuditLog) {
  const oldValues = log.old_values ?? {};
  const newValues = log.new_values ?? {};
  const keys = Array.from(
    new Set([...Object.keys(oldValues), ...Object.keys(newValues)])
  );

  return keys
    .filter((key) => JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key]))
    .map((key) => ({
      key,
      oldValue: oldValues[key],
      newValue: newValues[key],
    }));
}
