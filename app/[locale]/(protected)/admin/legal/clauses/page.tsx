"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  BookText,
  Globe2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  ScrollText,
  Trash2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Can } from "@/components/Can";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import {
  AdminSpinner,
  AdminTableEmptyRow,
  AdminTableLoadingRow,
} from "@/components/admin/admin-state";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { checkRequirement } from "@/lib/access";
import {
  LEGAL_CLAUSE_LANGUAGE_OPTIONS,
  LEGAL_CLAUSE_PER_PAGE_OPTIONS,
  LEGAL_CLAUSE_SORT_DIRECTION_OPTIONS,
  LEGAL_CLAUSE_SORT_OPTIONS,
  countLegalClauseTranslations,
  getLegalClausePreview,
} from "@/lib/admin-legal-clauses";
import { apiClient, type LegalClause } from "@/lib/api";
import { Link, useRouter } from "@/lib/navigation";

type PaginatedResponse = {
  current_page: number;
  data: LegalClause[];
  last_page: number;
  per_page: number;
  total: number;
};

function AdminLegalClausesContent() {
  const { user, loading, userLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [identifier, setIdentifier] = useState(searchParams.get("identifier") ?? "");
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort_by") ?? LEGAL_CLAUSE_SORT_OPTIONS[0]
  );
  const [sortDir, setSortDir] = useState(
    searchParams.get("sort_dir") ?? LEGAL_CLAUSE_SORT_DIRECTION_OPTIONS[0]
  );
  const [perPage, setPerPage] = useState(
    Number(searchParams.get("per_page") ?? LEGAL_CLAUSE_PER_PAGE_OPTIONS[1])
  );
  const [languageFilter, setLanguageFilter] = useState(
    searchParams.get("lang") ?? "all"
  );
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const canView = useMemo(
    () =>
      checkRequirement(user, {
        roles: ["admin", "legal"],
        permissions: ["legal.clauses.read"],
      }),
    [user]
  );

  useEffect(() => {
    if (userLoading) return;
    if (!canView) {
      router.replace(`/access-denied?from=${encodeURIComponent("/admin/legal/clauses")}`);
    }
  }, [canView, router, userLoading]);

  useEffect(() => {
    if (!canView) return;

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category !== "all") params.set("category", category);
    if (identifier.trim()) params.set("identifier", identifier.trim());
    if (sortBy !== LEGAL_CLAUSE_SORT_OPTIONS[0]) params.set("sort_by", sortBy);
    if (sortDir !== LEGAL_CLAUSE_SORT_DIRECTION_OPTIONS[0]) params.set("sort_dir", sortDir);
    if (perPage !== LEGAL_CLAUSE_PER_PAGE_OPTIONS[1]) params.set("per_page", String(perPage));
    if (page !== 1) params.set("page", String(page));
    if (languageFilter !== "all") params.set("lang", languageFilter);

    const query = params.toString();
    router.replace(query ? `/admin/legal/clauses?${query}` : "/admin/legal/clauses", {
      scroll: false,
    });
  }, [
    canView,
    category,
    identifier,
    languageFilter,
    page,
    perPage,
    router,
    search,
    sortBy,
    sortDir,
  ]);

  const fetchClauses = useCallback(async () => {
    setFetching(true);
    setError(null);

    try {
      const response = await apiClient.getAdminLegalClauses({
        search: search.trim() || undefined,
        category: category !== "all" ? category : undefined,
        identifier: identifier.trim() || undefined,
        sort_by: sortBy as (typeof LEGAL_CLAUSE_SORT_OPTIONS)[number],
        sort_dir: sortDir as (typeof LEGAL_CLAUSE_SORT_DIRECTION_OPTIONS)[number],
        per_page: perPage,
        lang: languageFilter !== "all" ? languageFilter : undefined,
        page,
      });

      setData(response as PaginatedResponse);
    } catch (err: any) {
      setError(err?.message || t("admin.legal_clauses.errors.load_list"));
    } finally {
      setFetching(false);
    }
  }, [category, identifier, languageFilter, page, perPage, search, sortBy, sortDir, t]);

  useEffect(() => {
    if (!canView) return;
    void fetchClauses();
  }, [canView, fetchClauses]);

  useEffect(() => {
    if (!canView) return;

    const fetchCategories = async () => {
      try {
        const response = await apiClient.getAdminLegalClauseCategory();
        setCategories(Array.isArray(response) ? response : []);
      } catch (err: any) {
        setError((previous) => previous || err?.message || t("admin.legal_clauses.errors.load_categories"));
      }
    };

    void fetchCategories();
  }, [canView, t]);

  const clauses = useMemo(() => data?.data ?? [], [data]);

  const filteredClauses = useMemo(() => {
    if (languageFilter === "all") return clauses;

    return clauses.filter((clause) => {
      const value = clause.content?.[languageFilter];
      return Boolean(value && String(value).trim().length > 0);
    });
  }, [clauses, languageFilter]);

  const summaryCards = useMemo(() => {
    const uniqueCategories = new Set(clauses.map((clause) => clause.category).filter(Boolean));
    const totalTranslations = clauses.reduce(
      (sum, clause) => sum + countLegalClauseTranslations(clause),
      0
    );
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentlyUpdated = clauses.filter((clause) => {
      const time = new Date(clause.updated_at).getTime();
      return Number.isFinite(time) && time >= thirtyDaysAgo;
    }).length;

    return [
      {
        title: t("admin.legal_clauses.summary.cards.total"),
        value: data?.total ?? clauses.length,
        icon: ScrollText,
        color: "bg-gradient-to-br from-primary to-emerald-400",
      },
      {
        title: t("admin.legal_clauses.summary.cards.categories"),
        value: uniqueCategories.size,
        icon: BookText,
        color: "bg-gradient-to-br from-blue-500 to-cyan-400",
      },
      {
        title: t("admin.legal_clauses.summary.cards.translations"),
        value: totalTranslations,
        icon: Globe2,
        color: "bg-gradient-to-br from-purple-500 to-pink-400",
      },
      {
        title: t("admin.legal_clauses.summary.cards.recently_updated"),
        value: recentlyUpdated,
        icon: RefreshCcw,
        color: "bg-gradient-to-br from-orange-500 to-amber-400",
      },
    ];
  }, [clauses, data?.total, t]);

  const hasPagination = Boolean(data && data.last_page > 1);

  const handleDelete = async (clauseId: number) => {
    if (!confirm(t("admin.legal_clauses.errors.delete_confirm"))) return;

    try {
      await apiClient.deleteAdminLegalClause(clauseId);
      await fetchClauses();
    } catch (err: any) {
      alert(err?.message || t("admin.legal_clauses.errors.delete_failed"));
    }
  };

  if (loading || userLoading || (!canView && !fetching)) {
    return (
      <ProjectAdminShell>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <AdminSpinner />
        </div>
      </ProjectAdminShell>
    );
  }

  if (!canView) {
    return null;
  }

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={t("admin.legal_clauses.manage_title")}
          description={t("admin.legal_clauses.manage_subtitle")}
          action={
            <Can roles={["admin", "legal"]} allPerms={["legal.clauses.create"]}>
              <Link href="/admin/legal/clauses/new">
                <Button className="bg-primary text-white hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("admin.legal_clauses.add_clause")}
                </Button>
              </Link>
            </Can>
          }
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <AdminSummaryCard
              key={String(card.title)}
              title={card.title}
              value={card.value}
              icon={card.icon}
              colorClassName={card.color}
              delay={index * 0.08}
            />
          ))}
        </div>

        <AdminSectionCard
          delay={0.15}
          title={t("admin.legal_clauses.filters.title")}
          description={t("admin.legal_clauses.filters.description")}
          action={
            <Button variant="outline" onClick={() => void fetchClauses()} disabled={fetching}>
              {fetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              {t("admin.legal_clauses.filters.apply")}
            </Button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <AdminSearchInput
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("admin.legal_clauses.filters.search")}
              className="relative md:col-span-2 xl:col-span-2"
            />

            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 border-border bg-transparent">
                <SelectValue placeholder={t("admin.legal_clauses.filters.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.legal_clauses.filters.all_categories")}</SelectItem>
                {categories.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setPage(1);
              }}
              className="h-11 border-border bg-transparent"
              placeholder={t("admin.legal_clauses.filters.identifier")}
            />

            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 border-border bg-transparent">
                <SelectValue placeholder={t("admin.legal_clauses.filters.sort_by")} />
              </SelectTrigger>
              <SelectContent>
                {LEGAL_CLAUSE_SORT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.legal_clauses.sort.${option}` as never)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={languageFilter}
              onValueChange={(value) => {
                setLanguageFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 border-border bg-transparent">
                <SelectValue placeholder={t("admin.legal_clauses.filters.language")} />
              </SelectTrigger>
              <SelectContent>
                {LEGAL_CLAUSE_LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortDir}
              onValueChange={(value) => {
                setSortDir(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 border-border bg-transparent">
                <SelectValue placeholder={t("admin.legal_clauses.filters.direction")} />
              </SelectTrigger>
              <SelectContent>
                {LEGAL_CLAUSE_SORT_DIRECTION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.legal_clauses.direction.${option}` as never)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(perPage)}
              onValueChange={(value) => {
                setPerPage(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 border-border bg-transparent">
                <SelectValue placeholder={t("admin.legal_clauses.filters.per_page")} />
              </SelectTrigger>
              <SelectContent>
                {LEGAL_CLAUSE_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          delay={0.22}
          title={t("admin.legal_clauses.list_title")}
          description={t("admin.legal_clauses.list_description", {
            count: filteredClauses.length,
          })}
        >
          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.legal_clauses.table.identifier")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.legal_clauses.table.category")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.legal_clauses.table.preview")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.legal_clauses.table.languages")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.legal_clauses.table.updated")}
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground">
                    {t("admin.legal_clauses.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {fetching && filteredClauses.length === 0 ? (
                  <AdminTableLoadingRow colSpan={6} />
                ) : null}

                {!fetching &&
                  filteredClauses.map((clause) => {
                    const preview = getLegalClausePreview(clause, languageFilter);
                    const previewText =
                      preview.length > 160 ? `${preview.slice(0, 160)}...` : preview;
                    const translationCodes = Object.entries(clause.content || {})
                      .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
                      .map(([code]) => code);

                    return (
                      <tr
                        key={clause.id}
                        className="border-b border-border/70 transition-colors hover:bg-secondary/20"
                      >
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-[180px] space-y-1">
                            <p className="font-semibold text-foreground">{clause.identifier}</p>
                            <p className="text-sm text-muted-foreground">#{clause.id}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-[140px]">
                            <Badge variant="outline">{clause.category}</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-[320px] max-w-[420px] space-y-2">
                            <p className="line-clamp-3 text-sm text-muted-foreground">
                              {previewText || "-"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-[180px] space-y-2">
                            <p className="text-sm text-muted-foreground">
                              {t("admin.legal_clauses.translations_count", {
                                count: countLegalClauseTranslations(clause),
                              })}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {translationCodes.slice(0, 4).map((code) => (
                                <Badge key={code} variant="secondary" className="uppercase">
                                  {code}
                                </Badge>
                              ))}
                              {translationCodes.length > 4 ? (
                                <Badge variant="secondary">+{translationCodes.length - 4}</Badge>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-[160px] text-sm text-muted-foreground">
                            {t("admin.legal_clauses.table.updated_label", {
                              date: new Date(clause.updated_at).toLocaleDateString(),
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right align-top">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <Can roles={["admin", "legal"]} allPerms={["legal.clauses.update"]}>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/admin/legal/clauses/${clause.id}${languageFilter !== "all" ? `?lang=${languageFilter}` : ""}`}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      {t("admin.legal_clauses.actions.edit")}
                                    </Link>
                                  </DropdownMenuItem>
                                </Can>
                                <Can roles={["admin", "legal"]} allPerms={["legal.clauses.delete"]}>
                                  <DropdownMenuItem
                                    onClick={() => void handleDelete(clause.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("admin.legal_clauses.actions.delete")}
                                  </DropdownMenuItem>
                                </Can>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!fetching && filteredClauses.length === 0 ? (
                  <AdminTableEmptyRow
                    colSpan={6}
                    icon={ScrollText}
                    title={t("admin.legal_clauses.empty_title")}
                    description={t("admin.legal_clauses.empty_description")}
                  />
                ) : null}
              </tbody>
            </table>
          </div>

          {hasPagination && data ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {t("admin.legal_clauses.table.page_label", {
                  current: data.current_page,
                  total: data.last_page,
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.current_page <= 1 || fetching}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  {t("admin.legal_clauses.actions.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.current_page >= data.last_page || fetching}
                  onClick={() => setPage((prev) => Math.min(data.last_page, prev + 1))}
                >
                  {t("admin.legal_clauses.actions.next")}
                </Button>
              </div>
            </div>
          ) : null}
        </AdminSectionCard>
      </div>
    </ProjectAdminShell>
  );
}

export default function AdminLegalClausesPage() {
  return (
    <Suspense
      fallback={
        <ProjectAdminShell>
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <AdminSpinner />
          </div>
        </ProjectAdminShell>
      }
    >
      <AdminLegalClausesContent />
    </Suspense>
  );
}
