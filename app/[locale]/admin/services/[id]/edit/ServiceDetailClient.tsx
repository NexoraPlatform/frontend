"use client";

import {useState, useEffect, useCallback, useMemo} from 'react';
import { useRouter } from '@/lib/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, AlertCircle, Loader2, X, Plus } from 'lucide-react';
import { useCategories } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import {InputAdornment, TextField} from "@mui/material";
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

export default function ServiceDetailClient({ id }: { id: string;}) {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        requirements: '',
        category_id: '',
        skills: [] as string[],
        tags: [] as string[],
        status: 'DRAFT'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [newSkill, setNewSkill] = useState('');
    const [newTag, setNewTag] = useState('');
    const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
    const router = useRouter();
    const locale = useLocale();
  const t = useTranslations();
    const { data: categoriesData } = useCategories();

    const pageTitle = t('admin.services.edit_service.title');
    const pageSubtitle = t('admin.services.edit_service.subtitle');
    const infoTitle = t('admin.services.info_title');
    const titleLabel = t('admin.services.title_label');
    const slugLabel = t('admin.services.slug_label');
    const slugPlaceholder = t('admin.services.slug_placeholder');
    const slugHelp = t('admin.services.slug_help');
    const descriptionLabel = t('admin.services.description_label');
    const requirementsLabel = t('admin.services.requirements_label');
    const categoryLabel = t('admin.services.category_label');
    const categoryPlaceholder = t('admin.services.category_placeholder');
    const statusLabel = t('admin.services.edit_service.status_label');
    const skillsTagsTitle = t('admin.services.skills_tags_title');
    const skillsLabel = t('admin.services.skills_label');
    const skillsPlaceholder = t('admin.services.skills_placeholder');
    const tagsLabel = t('admin.services.tags_label');
    const tagsPlaceholder = t('admin.services.tags_placeholder');
    const pricingNoteTitle = t('admin.services.pricing_note_title_edit');
    const pricingNoteDescription = t('admin.services.pricing_note_description_edit');
    const savingLabel = t('admin.services.saving');
    const saveChangesLabel = t('admin.services.save_changes');
    const cancelLabel = t('admin.services.cancel');
    const categoryLoadError = t('admin.services.category_load_error');
    const serviceLoadError = t('admin.services.service_load_error');
    const errorOccurred = t('admin.services.error_occurred');
    const statusActive = t('admin.services.statuses.ACTIVE');
    const statusDraft = t('admin.services.statuses.DRAFT');
    const statusSuspended = t('admin.services.statuses.SUSPENDED');

    const loadService = useCallback(async () => {
        try {
            const service = await apiClient.getService(id);
            setFormData({
                name: service.name[locale] || '',
                slug: service.slug || '',
                description: service.description[locale] || '',
                requirements: service.requirements || '',
                category_id: service.category_id || '',
                skills: service.skills || [],
                tags: service.tags || [],
                status: service.status || 'DRAFT'
            });
            setSelectedCategorySlug(service.category.slug || null);
        } catch (error: any) {
            setError(serviceLoadError);
        } finally {
            setLoading(false);
        }
    }, [id, locale, serviceLoadError]);

    useEffect(() => {
        loadService();
    }, [id, loadService]);

    const buildCategoryOptions = useCallback((categories: any[], parentId: number | null = null, level = 0): any[] => {
        let result: any[] = [];
        categories
            .filter(cat => cat.parent_id === parentId)
            .forEach(cat => {
                result.push({
                    ...cat,
                    displayName: `${'--'.repeat(level)} ${cat.name[locale]}`,
                });
                result = result.concat(buildCategoryOptions(categories, cat.id, level + 1));
            });
        return result;
    }, [locale]);


    const categoryOptions = useMemo(() => buildCategoryOptions(categoriesData || []), [buildCategoryOptions, categoriesData]);

    const handleNameChange = (title: string) => {
        setFormData(prev => ({
            ...prev,
            title,
            // Auto-generate slug if not manually set
            slug: prev.slug === generateSlug(prev.name) || prev.slug === ''
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

    const handleCategoryChange = async (categoryId: string) => {
        try {
            const categorySlug = await apiClient.getCategorySlugById(categoryId);

            setSelectedCategorySlug(categorySlug);
        } catch (error: any) {
            setError(categoryLoadError);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            await apiClient.updateService(id, formData);
            router.push('/admin/services');
        } catch (error: any) {
            setError(error.message || errorOccurred);
        } finally {
            setSaving(false);
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

    const removeTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }));
    };

    if (loading) {
        return (
            <>
                <TrustoraThemeStyles />
                <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14]">
                    <div className="container mx-auto px-4 py-10">
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <TrustoraThemeStyles />
            <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14]">
                <div className="container mx-auto px-4 py-10">
                    {/* Header */}
                    <div className="flex items-center space-x-4 mb-8">
                        <Link href="/admin/services">
                            <Button
                                variant="outline"
                                size="icon"
                                className="border-slate-200/70 bg-white/70 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{pageTitle}</h1>
                            <p className="text-sm text-muted-foreground">
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
                    <Card className="glass-card shadow-sm">
                        <CardHeader>
                            <CardTitle>{infoTitle}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label htmlFor="title">{titleLabel}</Label>
                                <Input
                                    id="title"
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    required
                                    className="bg-white/80 dark:bg-slate-900/60"
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
                                    rows={4}
                                    required
                                    className="bg-white/80 dark:bg-slate-900/60"
                                />
                            </div>

                            <div>
                                <Label htmlFor="requirements">{requirementsLabel}</Label>
                                <Textarea
                                    id="requirements"
                                    value={formData.requirements}
                                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                                    rows={3}
                                    className="bg-white/80 dark:bg-slate-900/60"
                                />
                            </div>

                            <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="category_id">{categoryLabel}</Label>
                                    <Select
                                        value={String(formData.category_id)}
                                        onValueChange={(value) => {
                                            setFormData({ ...formData, category_id: value });
                                            handleCategoryChange(value);
                                        }}
                                    >
                                        <SelectTrigger className="bg-white/80 dark:bg-slate-900/60">
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
                                <div>
                                    <Label htmlFor="status">{statusLabel}</Label>
                                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                                        <SelectTrigger className="bg-white/80 dark:bg-slate-900/60">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DRAFT">{statusDraft}</SelectItem>
                                            <SelectItem value="ACTIVE">{statusActive}</SelectItem>
                                            <SelectItem value="SUSPENDED">{statusSuspended}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skills și Tags */}
                    <Card className="glass-card shadow-sm">
                        <CardHeader>
                            <CardTitle>{skillsTagsTitle}</CardTitle>
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
                                        className="bg-white/80 dark:bg-slate-900/60"
                                    />
                                    <Button type="button" onClick={addSkill} variant="outline">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.skills.map((skill, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="flex items-center space-x-1 border border-slate-200/70 bg-slate-100 text-slate-700 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-200"
                                        >
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
                                        className="bg-white/80 dark:bg-slate-900/60"
                                    />
                                    <Button type="button" onClick={addTag} variant="outline">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.map((tag, index) => (
                                        <Badge
                                            key={index}
                                            variant="outline"
                                            className="flex items-center space-x-1 border-slate-200/70 text-slate-700 dark:border-slate-700/60 dark:text-slate-200"
                                        >
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
                    <Card className="border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-500/10">
                        <CardContent className="p-6">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Save className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                                        {pricingNoteTitle}
                                    </h3>
                                    <p className="text-emerald-800 dark:text-emerald-200 text-sm">
                                        {pricingNoteDescription}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex space-x-4 pt-6">
                        <Button type="submit" disabled={saving} className="flex-1 btn-primary">
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {savingLabel}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {saveChangesLabel}
                                </>
                            )}
                        </Button>
                        <Link href="/admin/services">
                            <Button type="button" variant="outline" className="border-slate-200/70 dark:border-slate-700/60">
                                {cancelLabel}
                            </Button>
                        </Link>
                    </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
