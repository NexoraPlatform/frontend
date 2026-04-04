import { AlertCircle, type LucideIcon } from "lucide-react";

import { AdminTableEmptyRow } from "@/components/admin/admin-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { extractFileNameFromContentDisposition } from "@/lib/contracts";

export const humanizeCode = (value: string | null | undefined) =>
  String(value ?? "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

export const getToneClass = (value: string | null | undefined) => {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (
    normalized.includes("approved") ||
    normalized.includes("accepted") ||
    normalized.includes("signed") ||
    normalized.includes("valid")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    normalized.includes("reject") ||
    normalized.includes("failed") ||
    normalized.includes("declined") ||
    normalized.includes("blocked") ||
    normalized.includes("cancel")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    normalized.includes("awaiting") ||
    normalized.includes("pending") ||
    normalized.includes("open") ||
    normalized.includes("review") ||
    normalized.includes("sent") ||
    normalized.includes("partial")
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
};

export const formatDateTime = (value: string | null, locale: string) => {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
};

export const formatMoney = (
  value: number | null,
  currency: string | null,
  locale: string
) => {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  try {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "ro-RO", {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || ""}`.trim();
  }
};

export const extractValidationMessage = (data: unknown) => {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;
  const directMessage = payload.message ?? payload.error;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage;
  }

  const errors = payload.errors;
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) {
    return null;
  }

  const firstList = Object.values(errors).find((entry) => Array.isArray(entry));
  if (!Array.isArray(firstList)) {
    return null;
  }

  const firstMessage = firstList.find((entry) => typeof entry === "string");
  return typeof firstMessage === "string" && firstMessage.trim()
    ? firstMessage
    : null;
};

export const downloadResponseBlob = async (
  response: Response,
  fallbackFileName: string
) => {
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const fileName =
    extractFileNameFromContentDisposition(
      response.headers.get("content-disposition")
    ) ?? fallbackFileName;

  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
};

export const normalizeLines = (value: string) =>
  value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

export function AdminErrorBanner({
  title,
  message,
}: {
  title: string;
  message: string | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function EmptyTableMessage({
  icon: Icon,
  title,
  description,
  colSpan,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  colSpan: number;
}) {
  return (
    <AdminTableEmptyRow
      colSpan={colSpan}
      icon={Icon}
      title={title}
      description={description}
    />
  );
}
