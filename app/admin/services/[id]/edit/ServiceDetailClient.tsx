"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    const { data: categoriesData } = useCategories();

    useEffect(() => {
        loadService();
    }, [id]);

    const loadService = async () => {
        try {
            const service = await apiClient.getService(id);
            setFormData({
                name: service.name || '',
                slug: service.slug || '',
                description: service.description || '',
                requirements: service.requirements || '',
                category_id: service.category_id || '',
                skills: service.skills || [],
                tags: service.tags || [],
                status: service.status || 'DRAFT'
            });
            setSelectedCategorySlug(service.category.slug || null);
        } catch (error: any) {
            setError('Nu s-a putut încărca serviciul');
        } finally {
            setLoading(false);
        }
    };

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
            setError('Nu s-a putut încărca categoria');
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
            setError(error.message || 'A apărut o eroare');
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
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            </div>
        );
    }

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


    const categoryOptions = buildCategoryOptions(categoriesData || []);

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
                    <h1 className="text-3xl font-bold">Editează Serviciu</h1>
                    <p className="text-muted-foreground">
                        Modifică detaliile serviciului (tarifele sunt setate de prestatori)
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
                            <CardTitle>Informații de Bază</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label htmlFor="title">Titlu Serviciu *</Label>
                                <Input
                                    id="title"
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="slug">Slug (URL) *</Label>
                                <TextField
                                    required
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="ex: creare-aplicatie"
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
                                    Se generează automat din nume. Folosit în URL-uri.
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="description">Descriere *</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows={4}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="requirements">Cerințe și Specificații</Label>
                                <Textarea
                                    id="requirements"
                                    value={formData.requirements}
                                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="category_id">Categorie *</Label>
                                    <Select
                                        value={typeof formData.category_id === 'string' ? formData.category_id : String(formData.category_id)}
                                        onValueChange={(value) => {
                                            setFormData({ ...formData, category_id: value });
                                            handleCategoryChange(value);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selectează categoria" />
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
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DRAFT">Draft</SelectItem>
                                            <SelectItem value="ACTIVE">Activ</SelectItem>
                                            <SelectItem value="SUSPENDED">Suspendat</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skills și Tags */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Skills și Tags</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label>Skills</Label>
                                <div className="flex space-x-2 mb-3">
                                    <Input
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        placeholder="Adaugă skill"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
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
                                <Label>Tags</Label>
                                <div className="flex space-x-2 mb-3">
                                    <Input
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        placeholder="Adaugă tag"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
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
                                    <Save className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                        Tarife Personalizate
                                    </h3>
                                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                                        Prestatorii își gestionează propriile tarife pentru acest serviciu.
                                        Modificările de aici afectează doar informațiile generale, nu prețurile.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex space-x-4 pt-6">
                        <Button type="submit" disabled={saving} className="flex-1">
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Se salvează...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvează Modificările
                                </>
                            )}
                        </Button>
                        <Link href="/admin/services">
                            <Button type="button" variant="outline">
                                Anulează
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
