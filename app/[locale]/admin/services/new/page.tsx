"use client";

import { useState } from 'react';
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
import { ArrowLeft, Plus, AlertCircle, Loader2, X } from 'lucide-react';
import { useCategories } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import {InputAdornment, TextField} from "@mui/material";

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
  const { data: categoriesData } = useCategories();

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
      setError(error.message || 'A apărut o eroare');
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
      setError('Nu s-a putut încărca categoria');
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
          <h1 className="text-3xl font-bold">Adaugă Serviciu Nou</h1>
          <p className="text-muted-foreground">
            Creează un serviciu - prestatorii își vor seta propriile tarife
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
              <CardDescription>
                Detaliile principale ale serviciului
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Titlu Serviciu *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="ex: Dezvoltare Website Modern cu React"
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
                  placeholder="Descrie serviciul în detaliu..."
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
                  placeholder="Ce informații ai nevoie de la client..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category_id">Categorie *</Label>
                <Select
                    value={String(formData.category_id)}
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
            </CardContent>
          </Card>

          {/* Skills și Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Skills și Tags</CardTitle>
              <CardDescription>
                Definește competențele necesare și cuvintele cheie
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Skills Necesare</Label>
                <div className="flex space-x-2 mb-3">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="ex: React, Node.js"
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
                <Label>Tags</Label>
                <div className="flex space-x-2 mb-3">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="ex: website, modern, responsive"
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
                    Tarife Flexibile
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    Prestatorii își vor seta propriile tarife pentru acest serviciu.
                    Ei pot alege între preț fix, tarif pe oră, pe zi, sau preț negociabil,
                    în funcție de natura proiectului și preferințele lor.
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
                  Se creează...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Creează Serviciul
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
