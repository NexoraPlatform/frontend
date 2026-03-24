"use client";

import type { FormEvent, ReactNode } from "react";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";

import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LEGAL_CLAUSE_TRANSLATION_LANGUAGE_OPTIONS } from "@/lib/admin-legal-clauses";

type LegalClauseEditorFormProps = {
  mode: "create" | "edit";
  identifier: string;
  category: string;
  content: Record<string, string>;
  selectedLanguage?: string;
  onIdentifierChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onContentChange: (language: string, value: string) => void;
  onLanguageChange?: (language: string) => void;
  onSubmit: (event: FormEvent) => void;
  cancelHref: string;
  error?: string | null;
  saving: boolean;
  sidebar?: ReactNode;
};

export function LegalClauseEditorForm({
  mode,
  identifier,
  category,
  content,
  selectedLanguage,
  onIdentifierChange,
  onCategoryChange,
  onContentChange,
  onLanguageChange,
  onSubmit,
  cancelHref,
  error,
  saving,
  sidebar,
}: LegalClauseEditorFormProps) {
  const t = useTranslations();
  const isSingleLanguageMode = mode === "edit" && selectedLanguage && onLanguageChange;

  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <div className="space-y-6">
          <AdminSectionCard
            title={t("admin.legal_clauses.form.details_title")}
            description={t("admin.legal_clauses.form.details_description")}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("admin.legal_clauses.form.identifier")}
                </label>
                <Input
                  value={identifier}
                  onChange={(event) => onIdentifierChange(event.target.value)}
                  placeholder={t("admin.legal_clauses.form.identifier_placeholder")}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("admin.legal_clauses.form.category")}
                </label>
                <Input
                  value={category}
                  onChange={(event) => onCategoryChange(event.target.value)}
                  placeholder={t("admin.legal_clauses.form.category_placeholder")}
                />
              </div>
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            title={
              isSingleLanguageMode
                ? t("admin.legal_clauses.form.translation_title")
                : t("admin.legal_clauses.form.translations_title")
            }
            description={
              isSingleLanguageMode
                ? t("admin.legal_clauses.form.translation_description")
                : t("admin.legal_clauses.form.translations_description")
            }
          >
            {isSingleLanguageMode ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("admin.legal_clauses.form.language")}
                  </label>
                  <Select value={selectedLanguage} onValueChange={onLanguageChange}>
                    <SelectTrigger className="border-slate-300/80 bg-white shadow-sm dark:border-border dark:bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEGAL_CLAUSE_TRANSLATION_LANGUAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
                          {t(option.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("admin.legal_clauses.form.text_label", {
                      language: t(
                        LEGAL_CLAUSE_TRANSLATION_LANGUAGE_OPTIONS.find(
                          (option) => option.code === selectedLanguage
                        )?.labelKey || "admin.legal_clauses.languages.en"
                      ),
                    })}
                  </label>
                  <Textarea
                    value={content[selectedLanguage] || ""}
                    onChange={(event) =>
                      onContentChange(selectedLanguage, event.target.value)
                    }
                    className="min-h-[220px]"
                    placeholder={t("admin.legal_clauses.form.text_placeholder")}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {LEGAL_CLAUSE_TRANSLATION_LANGUAGE_OPTIONS.map((language) => (
                  <div key={language.code} className="space-y-2">
                    <label className="text-sm font-medium">{t(language.labelKey)}</label>
                    <Textarea
                      value={content[language.code] || ""}
                      onChange={(event) =>
                        onContentChange(language.code, event.target.value)
                      }
                      placeholder={t("admin.legal_clauses.form.text_placeholder")}
                      className="min-h-[160px]"
                    />
                  </div>
                ))}
              </div>
            )}
          </AdminSectionCard>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button variant="outline" asChild>
              <Link href={cancelHref}>{t("admin.legal_clauses.actions.cancel")}</Link>
            </Button>

            <Button type="submit" disabled={saving} className="bg-primary text-white hover:bg-primary/90">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving
                ? t("admin.legal_clauses.actions.saving")
                : mode === "create"
                  ? t("admin.legal_clauses.actions.create")
                  : t("admin.legal_clauses.actions.save")}
            </Button>
          </div>
        </div>

        <div>{sidebar}</div>
      </div>
    </form>
  );
}
