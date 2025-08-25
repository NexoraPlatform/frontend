"use client";

import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import { useRouter } from 'next/navigation';
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
  const { data: categoriesData } = useAdminCategories();
  const containerRef = useRef<HTMLDivElement>(null);

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
        parentId: formData.parentId === 'none' ? undefined : formData.parentId, // Convertim 'none' înapoi la undefined
        sortOrder: formData.sortOrder || 0
      });
      router.push('/admin/categories');
    } catch (error: any) {
      setError(error.message || 'A apărut o eroare');
    } finally {
      setLoading(false);
    }
  };

  const parentCategories = (categoriesData?.categories || []).filter((cat: any) => !cat.parentId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin/categories">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Adaugă Categorie Nouă</h1>
          <p className="text-muted-foreground">
            Creează o categorie nouă pentru servicii
          </p>
        </div>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FolderPlus className="w-5 h-5" />
              <span>Informații Categorie</span>
            </CardTitle>
            <CardDescription>
              Completează informațiile pentru noua categorie
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
                <Label htmlFor="name">Nume Categorie *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="ex: Dezvoltare Web"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  placeholder="ex: dezvoltare-web"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Se generează automat din nume. Folosit în URL-uri.
                </p>
              </div>

              <div>
                <Label htmlFor="description">Descriere</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrierea categoriei..."
                  rows={3}
                />
              </div>

              <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                <div ref={containerRef}>
                  <Label htmlFor="icon">Iconiță</Label>

                  <IconSearchDropdown collections={collections} onChangeAction={handleSelect} />
                  <div className="flex items-center gap-2">
                    <span>Preview:</span>
                    {formData.icon ? <MuiIcon icon={formData.icon} size={24} /> : <span className="text-muted-foreground">—</span>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="sortOrder">Ordine Sortare</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="parentId">Categorie Părinte</Label>
                <Select value={formData.parentId} onValueChange={(value) => setFormData({...formData, parentId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează categoria părinte (opțional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Fără părinte (categorie principală)</SelectItem>
                    {parentCategories.map((category: any) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Lasă gol pentru o categorie principală
                </p>
              </div>

              <div className="flex space-x-4 pt-6">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Se creează...
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4 mr-2" />
                      Creează Categoria
                    </>
                  )}
                </Button>
                <Link href="/admin/categories">
                  <Button type="button" variant="outline">
                    Anulează
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
