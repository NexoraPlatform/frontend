"use client";

import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import { useRouter } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
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
  const t = useTranslations();
  const { data: categoriesData } = useAdminCategories();
  const containerRef = useRef<HTMLDivElement>(null);

  const addNewTitle = t('admin.categories.add_new_title');
  const addNewSubtitle = t('admin.categories.add_new_subtitle');
  const infoTitle = t('admin.categories.info_title');
  const infoDescription = t('admin.categories.info_description');
  const errorOccurred = t('admin.categories.error_occurred');
  const nameLabel = t('admin.categories.name_label');
  const namePlaceholder = t('admin.categories.name_placeholder');
  const slugLabel = t('admin.categories.slug_label');
  const slugPlaceholder = t('admin.categories.slug_placeholder');
  const slugHelp = t('admin.categories.slug_help');
  const descriptionLabel = t('admin.categories.description_label');
  const descriptionPlaceholder = t('admin.categories.description_placeholder');
  const iconLabel = t('admin.categories.icon_label');
  const previewLabel = t('admin.categories.preview');
  const sortOrderLabel = t('admin.categories.sort_order_label');
  const sortOrderPlaceholder = t('admin.categories.sort_order_placeholder');
  const parentCategoryLabel = t('admin.categories.parent_category_label');
  const parentCategoryPlaceholder = t('admin.categories.parent_category_placeholder');
  const noParent = t('admin.categories.no_parent');
  const noParentHelp = t('admin.categories.no_parent_help');
  const createCategoryLabel = t('admin.categories.create_category');
  const creatingLabel = t('admin.categories.creating');
  const cancelLabel = t('admin.categories.cancel');

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
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_60%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/admin/categories">
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
          <div>
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{addNewTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {addNewSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div>
        <Card className="border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
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
