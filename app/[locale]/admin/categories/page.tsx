"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  FolderPlus,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  ArrowLeft,
  Folder,
} from 'lucide-react';
import { useAdminCategories } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { MuiIcon } from '@/components/MuiIcons';
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import { Locale } from '@/types/locale';

export default function AdminCategoriesPage() {
  const { data: categoriesData, loading: categoriesLoading, refetch: refetchCategories } = useAdminCategories();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';

  const manageTitle = useAsyncTranslation(locale, 'admin.categories.manage_title');
  const manageSubtitle = useAsyncTranslation(locale, 'admin.categories.manage_subtitle');
  const addCategory = useAsyncTranslation(locale, 'admin.categories.add_category');
  const listTitle = useAsyncTranslation(locale, 'admin.categories.list_title');
  const totalSummaryTemplate = useAsyncTranslation(locale, 'admin.categories.total_summary');
  const inactiveLabel = useAsyncTranslation(locale, 'admin.categories.inactive');
  const orderLabel = useAsyncTranslation(locale, 'admin.categories.order_label');
  const subcategoriesLabel = useAsyncTranslation(locale, 'admin.categories.subcategories_label');
  const iconLabel = useAsyncTranslation(locale, 'admin.categories.icon_label');
  const editLabel = useAsyncTranslation(locale, 'admin.categories.edit');
  const deleteLabel = useAsyncTranslation(locale, 'admin.categories.delete');
  const confirmDeleteText = useAsyncTranslation(locale, 'admin.categories.confirm_delete');
  const errorPrefix = useAsyncTranslation(locale, 'admin.categories.error_prefix');
  const noCategoriesTitle = useAsyncTranslation(locale, 'admin.categories.no_categories_title');
  const noCategoriesDescription = useAsyncTranslation(locale, 'admin.categories.no_categories_description');
  const addFirstCategory = useAsyncTranslation(locale, 'admin.categories.add_first_category');

  const handleCategoryAction = async (categoryId: string, action: string) => {
    try {
      if (action === 'delete') {
        if (confirm(confirmDeleteText)) {
          await apiClient.deleteCategory(categoryId);
          await refetchCategories();
        }
      }
    } catch (error: any) {
      alert(errorPrefix + error.message);
    }
  };

  const categories = useMemo(() => (categoriesData?.categories || []), [categoriesData?.categories]);
  const { parentCategories, childCategories, childrenMap } = useMemo(() => {
    const parents: any[] = [];
    const children: any[] = [];
    const map: Record<string, any[]> = {};
    for (const cat of categories) {
      if (!cat.parent_id) {
        parents.push(cat);
      } else {
        children.push(cat);
        if (!map[cat.parent_id]) map[cat.parent_id] = [];
        map[cat.parent_id].push(cat);
      }
    }
    return { parentCategories: parents, childCategories: children, childrenMap: map };
  }, [categories]);

  const getChildrenForParent = (parentId: string) => {
    return childrenMap[parentId] || [];
  };

  const getCategoryDepth = (category: any) => {
    let depth = 0;
    let current = category;

    while (current?.parent_id) {
      depth += 1;
      current = categories.find((item: any) => item.id === current.parent_id);
      if (!current) break;
    }

    return depth;
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_60%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Link href={`/${locale}/admin`}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border border-border/60 bg-white/80 text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-700 dark:border-slate-800/70 dark:bg-slate-950/70 dark:text-slate-100 dark:hover:border-sky-500/50 dark:hover:bg-sky-500/10 dark:hover:text-sky-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Trustora Admin
              </span>
            </div>
            <Link href={`/${locale}/admin/categories/new`}>
              <Button className="shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                {addCategory}
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{manageTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {manageSubtitle}
            </p>
          </div>
        </div>
      </div>

      <Card className="border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderPlus className="w-5 h-5" />
            <span>{listTitle}</span>
          </CardTitle>
          <CardDescription>
            {totalSummaryTemplate
              .replace('{count}', String(categories.length))
              .replace('{parents}', String(parentCategories.length))
              .replace('{children}', String(childCategories.length))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {parentCategories.map((category: any) => {
                const children = getChildrenForParent(category.id);

                return (
                  <div key={category.id} className="rounded-2xl border border-border/60 bg-background/70 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
                    {/* Parent Category */}
                    <div className="flex flex-col gap-4 border-b border-border/60 bg-muted/30 p-4 dark:border-slate-800/70 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-sky-500/20 dark:text-sky-200">
                          <MuiIcon icon={category.icon} size={20} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg">{category.name[locale]}</h3>
                            <Badge variant="outline" className="text-xs">
                              {category.slug}
                            </Badge>
                            {!category.isActive && (
                              <Badge variant="destructive" className="text-xs">{inactiveLabel}</Badge>
                            )}
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {category.description[locale]}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{orderLabel}: {category.sortOrder}</span>
                            {children.length > 0 && (
                              <span>{children.length} {subcategoriesLabel}</span>
                            )}
                            {category.icon && (
                              <span>{iconLabel}: {category.icon}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/categories/${category.id}`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            {editLabel}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCategoryAction(category.id, 'delete')}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {deleteLabel}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {children.length > 0 && (
                      <div className="border-t border-border/60 dark:border-slate-800/70">
                        {children.map((child: any) => {
                          const depth = getCategoryDepth(child);
                          const paddingLeft = Math.max(24, depth * 24);

                          return (
                          <div
                            key={child.id}
                            className="flex flex-col gap-4 border-b border-border/60 p-4 last:border-b-0 dark:border-slate-800/70 sm:flex-row sm:items-center sm:justify-between"
                            style={{ paddingLeft: `${paddingLeft}px` }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted dark:bg-slate-900/80">
                                <Folder className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium">{child.name[locale]}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {child.slug}
                                  </Badge>
                                  {!child.isActive && (
                                    <Badge variant="destructive" className="text-xs">{inactiveLabel}</Badge>
                                  )}
                                </div>
                                {child.description && (
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {child.description[locale]}
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>{orderLabel}: {child.sortOrder}</span>
                                  {child.icon && (
                                    <span>{iconLabel}: {child.icon}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/admin/categories/${child.id}`)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  {editLabel}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCategoryAction(child.id, 'delete')}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {deleteLabel}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {categories.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 py-12 text-center dark:border-slate-800/70 dark:bg-slate-950/60">
                  <FolderPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{noCategoriesTitle}</h3>
                  <p className="text-muted-foreground mb-4">
                    {noCategoriesDescription}
                  </p>
                  <Link href={`/${locale}/admin/categories/new`}>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      {addFirstCategory}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
