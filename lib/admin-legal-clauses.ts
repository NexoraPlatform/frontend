import type { LegalClause } from "@/lib/api";

export const LEGAL_CLAUSE_LANGUAGE_OPTIONS = [
  { code: "all", labelKey: "admin.legal_clauses.languages.all" },
  { code: "en", labelKey: "admin.legal_clauses.languages.en" },
  { code: "ro", labelKey: "admin.legal_clauses.languages.ro" },
  { code: "de", labelKey: "admin.legal_clauses.languages.de" },
  { code: "it", labelKey: "admin.legal_clauses.languages.it" },
  { code: "fr", labelKey: "admin.legal_clauses.languages.fr" },
  { code: "es", labelKey: "admin.legal_clauses.languages.es" },
  { code: "pl", labelKey: "admin.legal_clauses.languages.pl" },
  { code: "nl", labelKey: "admin.legal_clauses.languages.nl" },
  { code: "ch", labelKey: "admin.legal_clauses.languages.ch" },
  { code: "ie", labelKey: "admin.legal_clauses.languages.ie" },
] as const;

export const LEGAL_CLAUSE_TRANSLATION_LANGUAGE_OPTIONS =
  LEGAL_CLAUSE_LANGUAGE_OPTIONS.filter((option) => option.code !== "all");

export const LEGAL_CLAUSE_LANGUAGE_CODES = new Set<string>(
  LEGAL_CLAUSE_TRANSLATION_LANGUAGE_OPTIONS.map((option) => option.code)
);

export const LEGAL_CLAUSE_SORT_OPTIONS = [
  "created_at",
  "updated_at",
  "identifier",
  "category",
] as const;

export const LEGAL_CLAUSE_SORT_DIRECTION_OPTIONS = ["desc", "asc"] as const;

export const LEGAL_CLAUSE_PER_PAGE_OPTIONS = [10, 15, 25, 50, 100] as const;

export function countLegalClauseTranslations(clause: Pick<LegalClause, "content">) {
  return Object.values(clause.content || {}).filter(
    (value) => typeof value === "string" && value.trim().length > 0
  ).length;
}

export function getLegalClausePreview(
  clause: Pick<LegalClause, "content">,
  language: string
) {
  if (!clause.content) return "";

  if (language === "all") {
    return (
      clause.content.ro ||
      clause.content.en ||
      Object.values(clause.content).find(
        (value) => typeof value === "string" && value.trim().length > 0
      ) ||
      ""
    );
  }

  return clause.content[language] || "";
}
