"use client";

import {
  Activity as ActivityIcon,
  CircleDollarSign,
  FileText,
  FolderKanban,
  type LucideIcon,
} from "lucide-react";

import type { Activity, ActivityType } from "@/lib/api";

type ActivityTranslator = (
  key: string,
  values?: Record<string, string | number>
) => string;

type ActivityVisual = {
  icon: LucideIcon;
  iconClassName: string;
  iconBackgroundClassName: string;
  badgeClassName: string;
  categoryKey: "project" | "finance" | "proposal" | "system";
};

type ActivityContextEntry = {
  label: string;
  value: string;
};

const ACTIVITY_VISUALS: Record<string, ActivityVisual> = {
  project_created: {
    icon: FolderKanban,
    iconClassName: "text-blue-600 dark:text-blue-300",
    iconBackgroundClassName: "bg-blue-500/10",
    badgeClassName:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    categoryKey: "project",
  },
  invoice_paid: {
    icon: CircleDollarSign,
    iconClassName: "text-emerald-600 dark:text-emerald-300",
    iconBackgroundClassName: "bg-emerald-500/10",
    badgeClassName:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    categoryKey: "finance",
  },
  proposal_received: {
    icon: FileText,
    iconClassName: "text-amber-600 dark:text-amber-300",
    iconBackgroundClassName: "bg-amber-500/10",
    badgeClassName:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    categoryKey: "proposal",
  },
  project_paid: {
    icon: CircleDollarSign,
    iconClassName: "text-teal-600 dark:text-teal-300",
    iconBackgroundClassName: "bg-teal-500/10",
    badgeClassName:
      "border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300",
    categoryKey: "finance",
  },
};

function formatMetadataKey(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getAdminActivityVisual(type: ActivityType | string): ActivityVisual {
  return (
    ACTIVITY_VISUALS[type] ?? {
      icon: ActivityIcon,
      iconClassName: "text-slate-600 dark:text-slate-300",
      iconBackgroundClassName: "bg-slate-500/10",
      badgeClassName:
        "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
      categoryKey: "system",
    }
  );
}

export function getAdminActivityMessage(activity: Activity, t: ActivityTranslator) {
  const projectName =
    activity.metadata.project_name || t("admin.activity.fallbacks.project");
  const invoiceId =
    activity.metadata.invoice_id || t("admin.activity.fallbacks.invoice");
  const amount = activity.metadata.amount || t("admin.activity.fallbacks.amount");

  switch (activity.type) {
    case "project_created":
      return t("admin.activity.messages.project_created", { projectName });
    case "invoice_paid":
      return t("admin.activity.messages.invoice_paid", { invoiceId, amount });
    case "proposal_received":
      return t("admin.activity.messages.proposal_received", { projectName });
    case "project_paid":
      return t("admin.activity.messages.project_paid", { projectName, amount });
    default:
      return t("admin.activity.messages.system_default");
  }
}

export function getAdminActivityContextEntries(
  activity: Activity,
  t: ActivityTranslator
): ActivityContextEntry[] {
  const projectName =
    activity.metadata.project_name || t("admin.activity.fallbacks.project");
  const invoiceId =
    activity.metadata.invoice_id || t("admin.activity.fallbacks.invoice");
  const amount = activity.metadata.amount || t("admin.activity.fallbacks.amount");

  switch (activity.type) {
    case "project_created":
      return [
        { label: t("admin.activity.context.project"), value: projectName },
        {
          label: t("admin.activity.context.status"),
          value: t("admin.activity.context.created"),
        },
      ];
    case "invoice_paid":
      return [
        { label: t("admin.activity.context.invoice"), value: invoiceId },
        { label: t("admin.activity.context.amount"), value: amount },
      ];
    case "proposal_received":
      return [
        { label: t("admin.activity.context.project"), value: projectName },
        {
          label: t("admin.activity.context.status"),
          value: t("admin.activity.context.received"),
        },
      ];
    case "project_paid":
      return [
        { label: t("admin.activity.context.project"), value: projectName },
        { label: t("admin.activity.context.amount"), value: amount },
      ];
    default: {
      const entries = Object.entries(activity.metadata || {}).slice(0, 2);

      return entries.length
        ? entries.map(([key, value]) => ({
            label: formatMetadataKey(key),
            value: String(value),
          }))
        : [];
    }
  }
}

export function getAdminActivityTypeKeys(): ActivityType[] {
  return [
    "project_created",
    "invoice_paid",
    "proposal_received",
    "project_paid",
  ];
}
