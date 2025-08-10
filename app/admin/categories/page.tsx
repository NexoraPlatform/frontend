"use client";

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
import {useRouter} from "next/navigation";
import {MuiIcon} from "@/components/MuiIcons";

export default function AdminCategoriesPage() {
  const { data: categoriesData, loading: categoriesLoading, refetch: refetchCategories } = useAdminCategories();
  const router = useRouter();

  const handleCategoryAction = async (categoryId: string, action: string) => {
    try {
      if (action === 'delete') {
        if (confirm('Ești sigur că vrei să ștergi această categorie?')) {
          await apiClient.deleteCategory(categoryId);
          refetchCategories();
        }
      }
    } catch (error: any) {
      alert('Eroare: ' + error.message);
    }
  };

  const categories = categoriesData?.categories || [];
  const parentCategories = categories.filter((cat: any) => !cat.parent_id);
  const childCategories = categories.filter((cat: any) => cat.parent_id);

  const getChildrenForParent = (parentId: string) => {
    return childCategories.filter((cat: any) => cat.parent_id === parentId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Gestionare Categorii</h1>
            <p className="text-muted-foreground">
              Administrează categoriile de servicii
            </p>
          </div>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Adaugă Categorie
          </Button>
        </Link>
      </div>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderPlus className="w-5 h-5" />
            <span>Lista Categorii</span>
          </CardTitle>
          <CardDescription>
            {categories.length} categorii în total ({parentCategories.length} categorii principale, {childCategories.length} subcategorii)
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
                          {/*<FolderOpen className="w-5 h-5 text-primary" />*/}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg">{category.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {category.slug}
                            </Badge>
                            {!category.isActive && (
                              <Badge variant="destructive" className="text-xs">Inactiv</Badge>
                            )}
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {category.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Ordine: {category.sortOrder}</span>
                            {children.length > 0 && (
                              <span>{children.length} subcategorii</span>
                            )}
                            {category.icon && (
                              <span>Iconiță: {category.icon}</span>
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
                            Editează
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCategoryAction(category.id, 'delete')}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Șterge
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Child Categories */}
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
                                    <Badge variant="destructive" className="text-xs">Inactiv</Badge>
                                  )}
                                </div>
                                {child.description && (
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {child.description}
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>Ordine: {child.sortOrder}</span>
                                  {child.icon && (
                                    <span>Iconiță: {child.icon}</span>
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
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editează
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCategoryAction(child.id, 'delete')}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Șterge
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
                  <h3 className="text-lg font-medium mb-2">Nu există categorii</h3>
                  <p className="text-muted-foreground mb-4">
                    Începe prin a crea prima categorie pentru servicii
                  </p>
                  <Link href="/admin/categories/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adaugă Prima Categorie
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
