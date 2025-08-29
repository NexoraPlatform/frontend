"use client";

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useRouter, usePathname} from 'next/navigation';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Textarea} from '@/components/ui/textarea';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {AlertCircle, ArrowLeft, FolderEdit, Loader2} from 'lucide-react';
import {useAdminCategories} from '@/hooks/use-api';
import {apiClient} from '@/lib/api';
import {IconSearchDropdown} from "@/components/IconSearchDropdown";
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import { Locale } from '@/types/locale';

export default function CategoryDetailPage({ id }: { id: string }) {
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

    const modifyTitle = useAsyncTranslation(locale, 'admin.categories.modify_title');
    const modifySubtitle = useAsyncTranslation(locale, 'admin.categories.modify_subtitle');
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
    const sortOrderLabel = useAsyncTranslation(locale, 'admin.categories.sort_order_label');
    const sortOrderPlaceholder = useAsyncTranslation(locale, 'admin.categories.sort_order_placeholder');
    const parentCategoryLabel = useAsyncTranslation(locale, 'admin.categories.parent_category_label');
    const parentCategoryPlaceholder = useAsyncTranslation(locale, 'admin.categories.parent_category_placeholder');
    const noParent = useAsyncTranslation(locale, 'admin.categories.no_parent');
    const noParentHelp = useAsyncTranslation(locale, 'admin.categories.no_parent_help');
    const modifyButton = useAsyncTranslation(locale, 'admin.categories.modify_button');
    const modifyingLabel = useAsyncTranslation(locale, 'admin.categories.modifying');
    const cancelLabel = useAsyncTranslation(locale, 'admin.categories.cancel');

    const handleSelect = (iconName: string) => {
        setFormData(prev => ({ ...prev, icon: iconName }));
    };

    useEffect(() => {
        const loadCategory = async () => {
            try {
                const response = await apiClient.getCategoryById(id);

                setFormData({
                    name: response.name[locale] || '',
                    slug: response.slug || generateSlug(response.name[locale] || ''),
                    description: response.description[locale] || '',
                    icon: response.icon || '',
                    parentId: response.parent_id || 'none',
                    sortOrder: response.sortOrder || 0
                });
            } catch (err) {
                console.error(errorOccurred, err);
            }
        };

        loadCategory();
    }, [errorOccurred, id, locale]);

    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            slug: prev.slug === generateSlug(prev.name) || prev.slug === ''
                ? generateSlug(name)
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const slug = formData.slug || generateSlug(formData.name);
            await apiClient.updateCategory(id, {
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
                    <h1 className="text-3xl font-bold">{modifyTitle}</h1>
                    <p className="text-muted-foreground">
                        {modifySubtitle}
                    </p>
                </div>
            </div>

            <div className="w-full">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <FolderEdit className="w-5 h-5" />
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
                                    <IconSearchDropdown collections="*" value={formData.icon} onChangeAction={handleSelect} />
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
                                        {parentCategories
                                            .filter((category: any) => category.id !== id)
                                            .map((category: any) => (
                                                <SelectItem key={category.id} value={String(category.id)}>
                                                    {category.name[locale]}
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
                                            {modifyingLabel}
                                        </>
                                    ) : (
                                        <>
                                            <FolderEdit className="w-4 h-4 mr-2" />
                                            {modifyButton}
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
