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

  const categories = categoriesData?.categories || [];
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{manageTitle}</h1>
            <p className="text-muted-foreground">
              {manageSubtitle}
            </p>
          </div>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {addCategory}
          </Button>
        </Link>
      </div>

      <Card>
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
                  <div key={category.id} className="border rounded-lg">
                    {/* Parent Category */}
                    <div className="flex items-center justify-between p-4 bg-muted/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MuiIcon icon={category.icon} size={20} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg">{category.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {category.slug}
                            </Badge>
                            {!category.isActive && (
                              <Badge variant="destructive" className="text-xs">{inactiveLabel}</Badge>
                            )}
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {category.description}
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
                          <Button variant="ghost" size="icon">
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
                      <div className="border-t">
                        {children.map((child: any) => (
                          <div key={child.id} className="flex items-center justify-between p-4 pl-16 border-b last:border-b-0">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                <Folder className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium">{child.name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {child.slug}
                                  </Badge>
                                  {!child.isActive && (
                                    <Badge variant="destructive" className="text-xs">{inactiveLabel}</Badge>
                                  )}
                                </div>
                                {child.description && (
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {child.description}
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
                                <Button variant="ghost" size="icon">
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
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {categories.length === 0 && (
                <div className="text-center py-12">
                  <FolderPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{noCategoriesTitle}</h3>
                  <p className="text-muted-foreground mb-4">
                    {noCategoriesDescription}
                  </p>
                  <Link href="/admin/categories/new">
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
