"use client";

import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FolderPlus, AlertCircle, Loader2 } from 'lucide-react';
import { useAdminCategories } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import {MuiIcon} from '@/components/MuiIcons';
import {IconSearchDropdown} from "@/components/IconSearchDropdown";
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import { Locale } from '@/types/locale';

export default function NewCategoryPage() {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    parentId: 'none',
    sortOrder: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';
  const { data: categoriesData } = useAdminCategories();
  const containerRef = useRef<HTMLDivElement>(null);

  const addNewTitle = useAsyncTranslation(locale, 'admin.categories.add_new_title');
  const addNewSubtitle = useAsyncTranslation(locale, 'admin.categories.add_new_subtitle');
  const infoTitle = useAsyncTranslation(locale, 'admin.categories.info_title');
  const infoDescription = useAsyncTranslation(locale, 'admin.categories.info_description');
  const errorOccurred = useAsyncTranslation(locale, 'admin.categories.error_occurred');
  const nameLabel = useAsyncTranslation(locale, 'admin.categories.name_label');
  const namePlaceholder = useAsyncTranslation(locale, 'admin.categories.name_placeholder');
  const slugLabel = useAsyncTranslation(locale, 'admin.categories.slug_label');
  const slugPlaceholder = useAsyncTranslation(locale, 'admin.categories.slug_placeholder');
  const slugHelp = useAsyncTranslation(locale, 'admin.categories.slug_help');
  const descriptionLabel = useAsyncTranslation(locale, 'admin.categories.description_label');
  const descriptionPlaceholder = useAsyncTranslation(locale, 'admin.categories.description_placeholder');
  const iconLabel = useAsyncTranslation(locale, 'admin.categories.icon_label');
  const previewLabel = useAsyncTranslation(locale, 'admin.categories.preview');
  const sortOrderLabel = useAsyncTranslation(locale, 'admin.categories.sort_order_label');
  const sortOrderPlaceholder = useAsyncTranslation(locale, 'admin.categories.sort_order_placeholder');
  const parentCategoryLabel = useAsyncTranslation(locale, 'admin.categories.parent_category_label');
  const parentCategoryPlaceholder = useAsyncTranslation(locale, 'admin.categories.parent_category_placeholder');
  const noParent = useAsyncTranslation(locale, 'admin.categories.no_parent');
  const noParentHelp = useAsyncTranslation(locale, 'admin.categories.no_parent_help');
  const createCategoryLabel = useAsyncTranslation(locale, 'admin.categories.create_category');
  const creatingLabel = useAsyncTranslation(locale, 'admin.categories.creating');
  const cancelLabel = useAsyncTranslation(locale, 'admin.categories.cancel');

  const collections = useMemo(() => ['material-symbols','mdi','lucide'], []);

  const handleSelect = (iconName: string) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
  };

  const generateSlug = useCallback((name: string, parentId: string) => {
    const parentName = categoriesData?.categories?.find(
        (category: any) => category.id === Number(parentId)
    )?.name;

    const slugify = (text: string) =>
        text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();

    const nameSlug = slugify(name);
    const parentSlug = parentName ? slugify(parentName) : null;

    return parentSlug ? `${parentSlug}/${nameSlug}` : `${nameSlug}`;
  }, [categoriesData?.categories]);

  useEffect(() => {
    const newSlug = generateSlug(formData.name, formData.parentId);
    setFormData((prev) => ({ ...prev, slug: newSlug }));
  }, [formData.name, formData.parentId, generateSlug]);

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === generateSlug(prev.name, prev.parentId) || prev.slug === ''
        ? generateSlug(name, prev.parentId)
        : prev.slug
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const slug = formData.slug || generateSlug(formData.name, formData.parentId);
      await apiClient.createCategory({
        ...formData,
        slug,
        parentId: formData.parentId === 'none' ? undefined : formData.parentId, // Convert 'none' back to undefined
        sortOrder: formData.sortOrder || 0
      });
      router.push('/admin/categories');
    } catch (error: any) {
      setError(error.message || errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  const parentCategories = useMemo(() => (categoriesData?.categories || []).filter((cat: any) => !cat.parentId), [categoriesData?.categories]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin/categories">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{addNewTitle}</h1>
          <p className="text-muted-foreground">
            {addNewSubtitle}
          </p>
        </div>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FolderPlus className="w-5 h-5" />
              <span>{infoTitle}</span>
            </CardTitle>
            <CardDescription>
              {infoDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">{nameLabel}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={namePlaceholder}
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">{slugLabel}</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  placeholder={slugPlaceholder}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {slugHelp}
                </p>
              </div>

              <div>
                <Label htmlFor="description">{descriptionLabel}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={descriptionPlaceholder}
                  rows={3}
                />
              </div>

              <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                <div ref={containerRef}>
                  <Label htmlFor="icon">{iconLabel}</Label>

                  <IconSearchDropdown collections="*" onChangeAction={handleSelect} />
                  <div className="flex items-center gap-2">
                    <span>{previewLabel}:</span>
                    {formData.icon ? <MuiIcon icon={formData.icon} size={24} /> : <span className="text-muted-foreground">—</span>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="sortOrder">{sortOrderLabel}</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                    placeholder={sortOrderPlaceholder}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="parentId">{parentCategoryLabel}</Label>
                <Select value={formData.parentId} onValueChange={(value) => setFormData({...formData, parentId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={parentCategoryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{noParent}</SelectItem>
                    {parentCategories.map((category: any) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  {noParentHelp}
                </p>
              </div>

              <div className="flex space-x-4 pt-6">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {creatingLabel}
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4 mr-2" />
                      {createCategoryLabel}
                    </>
                  )}
                </Button>
                <Link href="/admin/categories">
                  <Button type="button" variant="outline">
                    {cancelLabel}
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
