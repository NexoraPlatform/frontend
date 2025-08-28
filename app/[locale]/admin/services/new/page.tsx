"use client";

import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, AlertCircle, Loader2, X } from 'lucide-react';
import { useCategories } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import { InputAdornment, TextField } from "@mui/material";
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import { Locale } from '@/types/locale';

export default function NewServicePage() {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    requirements: '',
    category_id: '',
    skills: [] as string[],
    tags: [] as string[]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';
  const { data: categoriesData } = useCategories();

  const pageTitle = useAsyncTranslation(locale, 'admin.services.new_service.title');
  const pageSubtitle = useAsyncTranslation(locale, 'admin.services.new_service.subtitle');
  const errorOccurred = useAsyncTranslation(locale, 'admin.services.error_occurred');
  const infoTitle = useAsyncTranslation(locale, 'admin.services.info_title');
  const infoDescription = useAsyncTranslation(locale, 'admin.services.info_description');
  const titleLabel = useAsyncTranslation(locale, 'admin.services.title_label');
  const titlePlaceholder = useAsyncTranslation(locale, 'admin.services.title_placeholder');
  const slugLabel = useAsyncTranslation(locale, 'admin.services.slug_label');
  const slugPlaceholder = useAsyncTranslation(locale, 'admin.services.slug_placeholder');
  const slugHelp = useAsyncTranslation(locale, 'admin.services.slug_help');
  const descriptionLabel = useAsyncTranslation(locale, 'admin.services.description_label');
  const descriptionPlaceholder = useAsyncTranslation(locale, 'admin.services.description_placeholder');
  const requirementsLabel = useAsyncTranslation(locale, 'admin.services.requirements_label');
  const requirementsPlaceholder = useAsyncTranslation(locale, 'admin.services.requirements_placeholder');
  const categoryLabel = useAsyncTranslation(locale, 'admin.services.category_label');
  const categoryPlaceholder = useAsyncTranslation(locale, 'admin.services.category_placeholder');
  const skillsTagsTitle = useAsyncTranslation(locale, 'admin.services.skills_tags_title');
  const skillsTagsDescription = useAsyncTranslation(locale, 'admin.services.skills_tags_description');
  const skillsLabel = useAsyncTranslation(locale, 'admin.services.skills_label');
  const skillsPlaceholder = useAsyncTranslation(locale, 'admin.services.skills_placeholder');
  const tagsLabel = useAsyncTranslation(locale, 'admin.services.tags_label');
  const tagsPlaceholder = useAsyncTranslation(locale, 'admin.services.tags_placeholder');
  const pricingNoteTitle = useAsyncTranslation(locale, 'admin.services.pricing_note_title');
  const pricingNoteDescription = useAsyncTranslation(locale, 'admin.services.pricing_note_description');
  const creatingLabel = useAsyncTranslation(locale, 'admin.services.creating');
  const createServiceLabel = useAsyncTranslation(locale, 'admin.services.create_service');
  const cancelLabel = useAsyncTranslation(locale, 'admin.services.cancel');
  const categoryLoadError = useAsyncTranslation(locale, 'admin.services.category_load_error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const serviceData = {
        ...formData,
        // Prestatorii își vor seta propriile tarife
        basePrice: 0, // Placeholder - va fi setat de prestator
        pricingType: 'CUSTOM' // Permite prestatorului să își seteze tipul
      };

      await apiClient.createService(serviceData);
      router.push('/admin/services');
    } catch (error: any) {
      setError(error.message || errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleNameChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      // Auto-generate slug if not manually set
      slug: prev.slug === generateSlug(prev.title) || prev.slug === ''
          ? generateSlug(title)
          : prev.slug
    }));
  };

  const generateSlug = (name: string) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    try {
      const categorySlug = await apiClient.getCategorySlugById(categoryId);

      setSelectedCategorySlug(categorySlug);
    } catch (error: any) {
      setError(categoryLoadError);
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const buildCategoryOptions = (categories: any[], parentId: number | null = null, level = 0): any[] => {
    let result: any[] = [];
    categories
        .filter(cat => cat.parent_id === parentId)
        .forEach(cat => {
          result.push({
            ...cat,
            displayName: `${'--'.repeat(level)} ${cat.name}`,
          });
          result = result.concat(buildCategoryOptions(categories, cat.id, level + 1));
        });
    return result;
  };


  const categoryOptions = useMemo(() => buildCategoryOptions(categoriesData || []), [categoriesData]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin/services">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">
            {pageSubtitle}
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Informații de bază */}
          <Card>
            <CardHeader>
              <CardTitle>{infoTitle}</CardTitle>
              <CardDescription>
                {infoDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">{titleLabel}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={titlePlaceholder}
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">{slugLabel}</Label>
                <TextField
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder={slugPlaceholder}
                    slotProps={{
                      input: {
                        startAdornment: selectedCategorySlug ? (
                            <InputAdornment position="start">
                              {selectedCategorySlug}/
                            </InputAdornment>
                        ) : undefined,
                      },
                    }}
                    fullWidth
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
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="requirements">{requirementsLabel}</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  placeholder={requirementsPlaceholder}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category_id">{categoryLabel}</Label>
                <Select
                    value={String(formData.category_id)}
                    onValueChange={(value) => {
                      setFormData({ ...formData, category_id: value });
                      handleCategoryChange(value);
                    }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={categoryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category: any) => (
                        <SelectItem
                            key={category.id}
                            value={typeof category.id === 'string' ? category.id : String(category.id)}
                        >
                          {category.displayName.trim()}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Skills și Tags */}
          <Card>
            <CardHeader>
              <CardTitle>{skillsTagsTitle}</CardTitle>
              <CardDescription>
                {skillsTagsDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>{skillsLabel}</Label>
                <div className="flex space-x-2 mb-3">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder={skillsPlaceholder}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSkill} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>{tagsLabel}</Label>
                <div className="flex space-x-2 mb-3">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder={tagsPlaceholder}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notă despre tarife */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    {pricingNoteTitle}
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    {pricingNoteDescription}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex space-x-4 pt-6">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {creatingLabel}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {createServiceLabel}
                </>
              )}
            </Button>
            <Link href="/admin/services">
              <Button type="button" variant="outline">
                {cancelLabel}
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
