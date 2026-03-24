"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Edit,
  FileText,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { MuiIcon } from "@/components/MuiIcons";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import {
  AdminTableEmptyRow,
  AdminTableLoadingRow,
} from "@/components/admin/admin-state";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminCategories } from "@/hooks/use-api";
import { apiClient } from "@/lib/api";
import { getLocalizedAdminValue } from "@/lib/admin-format";
import { Link, useRouter } from "@/lib/navigation";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  parentName: string | null;
  childCount: number;
  depth: number;
};

type NormalizedCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
};

export default function AdminCategoriesPage() {
  const { data: categoriesData, loading: categoriesLoading, refetch: refetchCategories } = useAdminCategories();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState("");

  const manageTitle = t("admin.categories.manage_title");
  const manageSubtitle = t("admin.categories.manage_subtitle");
  const addCategory = t("admin.categories.add_category");
  const searchPlaceholder = t("admin.categories.search_placeholder");
  const listTitle = t("admin.categories.list_title");
  const inactiveLabel = t("admin.categories.inactive");
  const activeLabel = t("admin.categories.active");
  const editLabel = t("admin.categories.edit");
  const deleteLabel = t("admin.categories.delete");
  const confirmDeleteText = t("admin.categories.confirm_delete");
  const errorPrefix = t("admin.categories.error_prefix");
  const noCategoriesTitle = t("admin.categories.no_categories_title");
  const noCategoriesDescription = t("admin.categories.no_categories_description");
  const addFirstCategory = t("admin.categories.add_first_category");

  const categories = useMemo(() => {
    if (Array.isArray(categoriesData?.categories)) {
      return categoriesData.categories;
    }

    if (Array.isArray(categoriesData)) {
      return categoriesData;
    }

    return [];
  }, [categoriesData]);

  const { rows, totals } = useMemo(() => {
    const normalized: NormalizedCategory[] = categories.map((category: any) => ({
      id: String(category.id),
      name: getLocalizedAdminValue(category.name, locale),
      slug: String(category.slug ?? ""),
      description: getLocalizedAdminValue(category.description, locale),
      icon: String(category.icon ?? ""),
      sortOrder: Number(category.sortOrder ?? category.sort_order ?? 0),
      isActive: Boolean(category.isActive ?? category.is_active ?? true),
      parentId: category.parent_id || category.parentId ? String(category.parent_id ?? category.parentId) : null,
    }));

    const childrenMap = new Map<string, NormalizedCategory[]>();
    const byId = new Map<string, NormalizedCategory>(normalized.map((item: NormalizedCategory) => [item.id, item]));

    normalized.forEach((item: NormalizedCategory) => {
      if (!item.parentId) return;
      const current: NormalizedCategory[] = childrenMap.get(item.parentId) ?? [];
      current.push(item);
      childrenMap.set(item.parentId, current);
    });

    const ordered: CategoryRow[] = [];

    const appendChildren = (parentId: string, depth: number) => {
      const children: NormalizedCategory[] = (childrenMap.get(parentId) ?? []).sort(
        (a: NormalizedCategory, b: NormalizedCategory) => a.sortOrder - b.sortOrder
      );
      children.forEach((child: NormalizedCategory) => {
        ordered.push({
          ...child,
          parentName: byId.get(parentId)?.name ?? null,
          childCount: (childrenMap.get(child.id) ?? []).length,
          depth,
        });
        appendChildren(child.id, depth + 1);
      });
    };

    normalized
      .filter((item: NormalizedCategory) => !item.parentId)
      .sort((a: NormalizedCategory, b: NormalizedCategory) => a.sortOrder - b.sortOrder)
      .forEach((parent: NormalizedCategory) => {
        ordered.push({
          ...parent,
          parentName: null,
          childCount: (childrenMap.get(parent.id) ?? []).length,
          depth: 0,
        });
        appendChildren(parent.id, 1);
      });

    return {
      rows: ordered,
      totals: {
        total: normalized.length,
        parents: normalized.filter((item: NormalizedCategory) => !item.parentId).length,
        children: normalized.filter((item: NormalizedCategory) => !!item.parentId).length,
        inactive: normalized.filter((item: NormalizedCategory) => !item.isActive).length,
      },
    };
  }, [categories, locale]);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) =>
      [row.name, row.slug, row.description, row.parentName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [rows, searchTerm]);

  const summaryCards = [
    {
      title: t("admin.categories.summary.cards.total"),
      value: totals.total,
      icon: FolderPlus,
      color: "bg-gradient-to-br from-primary to-emerald-400",
    },
    {
      title: t("admin.categories.summary.cards.parents"),
      value: totals.parents,
      icon: Folder,
      color: "bg-gradient-to-br from-blue-500 to-cyan-400",
    },
    {
      title: t("admin.categories.summary.cards.children"),
      value: totals.children,
      icon: FileText,
      color: "bg-gradient-to-br from-purple-500 to-pink-400",
    },
    {
      title: t("admin.categories.summary.cards.inactive"),
      value: totals.inactive,
      icon: Trash2,
      color: "bg-gradient-to-br from-orange-500 to-amber-400",
    },
  ];

  const handleDelete = async (categoryId: string) => {
    try {
      if (!confirm(confirmDeleteText)) return;
      await apiClient.deleteCategory(categoryId);
      await refetchCategories();
    } catch (error: any) {
      alert(errorPrefix + error.message);
    }
  };

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={manageTitle}
          description={manageSubtitle}
          action={
            <Link href="/admin/categories/new">
              <Button className="bg-primary text-white hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                {addCategory}
              </Button>
            </Link>
          }
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <AdminSummaryCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              colorClassName={card.color}
              delay={index * 0.08}
            />
          ))}
        </div>

        <AdminSectionCard
          delay={0.2}
          title={listTitle}
          description={t("admin.categories.total_summary", {
            count: totals.total,
            parents: totals.parents,
            children: totals.children,
          })}
        >
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
            <AdminSearchInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.categories.table.category")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.categories.table.parent")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.categories.table.icon")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.categories.table.order")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.categories.table.status")}
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-muted-foreground">
                    {t("admin.categories.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {categoriesLoading ? (
                  <AdminTableLoadingRow colSpan={6} />
                ) : filteredRows.length === 0 ? (
                  <AdminTableEmptyRow
                    colSpan={6}
                    icon={FolderPlus}
                    title={noCategoriesTitle}
                    description={noCategoriesDescription}
                    action={
                      <Link href="/admin/categories/new" className="inline-flex">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          {addFirstCategory}
                        </Button>
                      </Link>
                    }
                  />
                ) : (
                  filteredRows.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + index * 0.04, duration: 0.35 }}
                      className="group border-b border-border/50 transition-colors hover:bg-secondary/30"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3" style={{ paddingLeft: `${row.depth * 20}px` }}>
                          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            {row.icon ? <MuiIcon icon={row.icon} size={18} /> : <Folder className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium">{row.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {row.slug}
                              </Badge>
                              {row.childCount > 0 ? (
                                <Badge className="bg-primary/15 text-primary">{row.childCount}</Badge>
                              ) : null}
                            </div>
                            <p className="mt-1 max-w-md text-xs text-muted-foreground line-clamp-2">
                              {row.description || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {row.parentName || t("admin.categories.no_parent")}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {row.icon ? <MuiIcon icon={row.icon} size={18} /> : null}
                          <span>{row.icon || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{row.sortOrder}</td>
                      <td className="px-4 py-4">
                        {row.isActive ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {activeLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-destructive/20 px-3 py-1 text-xs font-medium text-destructive">
                            {inactiveLabel}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-70 transition-opacity group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => router.push(`/admin/categories/${row.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {editLabel}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(row.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deleteLabel}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </AdminSectionCard>
      </div>
    </ProjectAdminShell>
  );
}
