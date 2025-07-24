"use client";

import {useEffect, useState, useRef, useCallback} from 'react';
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

export default function NewCategoryPage() {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    parentId: 'none', // Schimbat din '' în 'none'
    sortOrder: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: categoriesData } = useAdminCategories();
  const [icons, setIcons] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const perPage = 10;
  const fetchIcons = useCallback(async (searchTerm: string, pageNum: number) => {
    const url = new URL('http://127.0.0.1:8000/api/general/mui-icons');
    url.searchParams.set('search', searchTerm);
    url.searchParams.set('page', pageNum.toString());
    url.searchParams.set('per_page', perPage.toString());

    const res = await fetch(url.toString());
    const data = await res.json();
    return data;
  }, []);

  // Cand se schimba cautarea, reseteaza lista si pagina
  useEffect(() => {
    setPage(1);
    setHasMore(true);

    fetchIcons(search, 1).then(data => {
      setIcons(data.data);
      setHasMore(data.has_more);
    });
  }, [search, fetchIcons]);

  // Cand pagina se schimba (mai mare decat 1), incarca mai multe iconuri
  useEffect(() => {
    if (page === 1) return; // deja incarcat la cautare

    fetchIcons(search, page).then(data => {
      setIcons(prev => [...prev, ...data.data]);
      setHasMore(data.has_more);
    });
  }, [page, search, fetchIcons]);

  // Detecteaza scroll la capatul containerului pentru lazy load
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) { // 10px prag
      if (hasMore) {
        setPage(prev => prev + 1);
      }
    }
  };

  const handleSelect = (iconName: string) => {
    setFormData({...formData, icon: iconName})
    setSearch(iconName);
    setHasMore(false);
    setPage(1);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate slug if not manually set
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
      {/* Header */}
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

      <div className="max-w-2xl">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div ref={containerRef}>
                  <Label htmlFor="icon">Iconiță</Label>
                  <Input
                      type="text"
                      placeholder="Caută icon..."
                      value={search}
                      onChange={e => {
                        setSearch(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                  />
                  {showDropdown && icons.length > 0 && (
                  <div
                      onScroll={onScroll}
                      style={{
                        border: '1px solid #ccc',
                        maxHeight: 200,
                        overflowY: 'auto',
                        borderRadius: 8,
                        backgroundColor: 'white',
                      }}
                  >
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {icons.map(iconName => (
                          <li
                              key={iconName}
                              onClick={() => {
                                handleSelect(iconName);
                                setShowDropdown(false);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee',
                              }}
                              onMouseDown={e => e.preventDefault()}
                          >
                            <MuiIcon icon={iconName} size={20} />
                            <span>{iconName}</span>
                          </li>
                      ))}
                      {!hasMore && icons.length === 0 && (
                          <li style={{ padding: 12, textAlign: 'center', color: '#888' }}>
                            Niciun icon găsit
                          </li>
                      )}
                    </ul>
                  </div>
                      )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Numele iconiței (opțional)
                  </p>
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
                      <SelectItem key={category.id} value={category.id}>
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
