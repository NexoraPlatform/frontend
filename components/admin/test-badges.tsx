"use client";

import { AlertCircle, BookOpen, CheckCircle, CheckSquare, Code, Square, Type, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type {
  AdminTestLevel,
  AdminTestQuestionType,
  AdminTestStatus,
} from "@/lib/admin-tests";

export function getAdminTestQuestionIcon(type: string) {
  switch (type) {
    case "SINGLE_CHOICE":
      return Square;
    case "MULTIPLE_CHOICE":
      return CheckSquare;
    case "CODE_WRITING":
      return Code;
    case "TEXT_INPUT":
      return Type;
    default:
      return BookOpen;
  }
}

export function AdminTestStatusBadge({ status }: { status: string }) {
  const t = useTranslations();
  const normalizedStatus = String(status).toUpperCase() as AdminTestStatus;

  if (normalizedStatus === "ACTIVE") {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
        <CheckCircle className="mr-1 h-3 w-3" />
        {t("admin.tests.statuses.ACTIVE")}
      </Badge>
    );
  }

  if (normalizedStatus === "INACTIVE") {
    return (
      <Badge className="bg-muted text-muted-foreground">
        <XCircle className="mr-1 h-3 w-3" />
        {t("admin.tests.statuses.INACTIVE")}
      </Badge>
    );
  }

  return (
    <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400">
      <AlertCircle className="mr-1 h-3 w-3" />
      {t("admin.tests.statuses.DRAFT")}
    </Badge>
  );
}

export function AdminTestLevelBadge({ level }: { level: string }) {
  const t = useTranslations();
  const normalizedLevel = String(level).toUpperCase() as AdminTestLevel;

  const colorClassName =
    normalizedLevel === "JUNIOR"
      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
      : normalizedLevel === "MEDIU"
        ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
        : normalizedLevel === "SENIOR"
          ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
          : "bg-orange-500/20 text-orange-600 dark:text-orange-400";

  return (
    <Badge className={colorClassName}>{t(`admin.tests.levels.${normalizedLevel}`)}</Badge>
  );
}

export function AdminTestQuestionTypeBadge({ type }: { type: string }) {
  const t = useTranslations();
  const Icon = getAdminTestQuestionIcon(type);
  const normalizedType = String(type).toUpperCase() as AdminTestQuestionType;

  return (
    <Badge variant="outline" className="gap-1">
      <Icon className="h-3 w-3" />
      {t(`admin.tests.question_types.${normalizedType}`)}
    </Badge>
  );
}
