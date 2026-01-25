"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useRouter } from '@/lib/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { checkRequirement } from '@/lib/access';
import { apiClient, type LegalClause } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Can } from '@/components/Can';
import {
  ArrowLeft,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Pencil,
  Trash2,
} from 'lucide-react';

type PaginatedResponse = {
  current_page: number;
  data: LegalClause[];
  last_page: number;
  per_page: number;
  total: number;
};

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Created at' },
  { value: 'updated_at', label: 'Updated at' },
  { value: 'identifier', label: 'Identifier' },
  { value: 'category', label: 'Category' },
];

const SORT_DIR_OPTIONS = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
];

const PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];
const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'All languages' },
  { value: 'en', label: 'English' },
  { value: 'ro', label: 'Romanian' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'pl', label: 'Polish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'ch', label: 'Chinese' },
  { value: 'ie', label: 'Irish' },
];

export default function AdminLegalClausesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const didInitFromQuery = useRef(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [perPage, setPerPage] = useState(15);
  const [languageFilter, setLanguageFilter] = useState('all');
  const [draftSearch, setDraftSearch] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftIdentifier, setDraftIdentifier] = useState('');
  const [draftSortBy, setDraftSortBy] = useState('created_at');
  const [draftSortDir, setDraftSortDir] = useState('desc');
  const [draftPerPage, setDraftPerPage] = useState(15);
  const [draftLanguage, setDraftLanguage] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const canView = useMemo(
    () => checkRequirement(user, { roles: ['admin', 'legal'], permissions: ['legal.clauses.read'] }),
    [user]
  );

  useEffect(() => {
    if (!loading && !canView) {
      router.replace(`/access-denied?from=${encodeURIComponent('/admin/legal/clauses')}`);
    }
  }, [loading, canView, router]);

  useEffect(() => {
    if (didInitFromQuery.current) return;
    const initialSearch = searchParams.get('search') ?? '';
    const initialCategory = searchParams.get('category') ?? '';
    const initialIdentifier = searchParams.get('identifier') ?? '';
    const initialSortBy = searchParams.get('sort_by') ?? 'created_at';
    const initialSortDir = searchParams.get('sort_dir') ?? 'desc';
    const initialPerPage = Number(searchParams.get('per_page') ?? 15);
    const initialPage = Number(searchParams.get('page') ?? 1);
    const initialLanguage = searchParams.get('lang') ?? 'all';

    setSearch(initialSearch);
    setCategory(initialCategory);
    setIdentifier(initialIdentifier);
    setSortBy(initialSortBy);
    setSortDir(initialSortDir);
    setPerPage(Number.isNaN(initialPerPage) ? 15 : initialPerPage);
    setPage(Number.isNaN(initialPage) ? 1 : initialPage);
    setLanguageFilter(initialLanguage);
    didInitFromQuery.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (!didInitFromQuery.current) return;
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (category.trim()) params.set('category', category.trim());
    if (identifier.trim()) params.set('identifier', identifier.trim());
    if (sortBy !== 'created_at') params.set('sort_by', sortBy);
    if (sortDir !== 'desc') params.set('sort_dir', sortDir);
    if (perPage !== 15) params.set('per_page', String(perPage));
    if (page !== 1) params.set('page', String(page));
    if (languageFilter !== 'all') params.set('lang', languageFilter);

    const query = params.toString();
    router.replace(query ? `/admin/legal/clauses?${query}` : '/admin/legal/clauses');
  }, [search, category, identifier, sortBy, sortDir, perPage, page, languageFilter, router]);

  const fetchClauses = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const response = await apiClient.getAdminLegalClauses({
        search: search.trim() || undefined,
        category: category.trim() || undefined,
        identifier: identifier.trim() || undefined,
        sort_by: sortBy as any,
        sort_dir: sortDir as any,
        per_page: perPage,
        lang: languageFilter,
        page,
      });
      setData(response as PaginatedResponse);
    } catch (err: any) {
      setError(err?.message || 'Unable to load legal clauses.');
    } finally {
      setFetching(false);
    }
  }, [category, identifier, languageFilter, page, perPage, search, sortBy, sortDir]);

  useEffect(() => {
    if (!canView) return;
    fetchClauses();
  }, [fetchClauses, canView]);

  useEffect(() => {
    const fetchLegalClauseCategory = async () => {
      setFetching(true);
      setError(null);

      try {
        const response = await apiClient.getAdminLegalClauseCategory();
        setCategories(response);
      } catch (err: any) {
        setError(err?.message || 'Failed to load legal clause category.');
      } finally {
        setFetching(false);
      }
    };

    fetchLegalClauseCategory();
  }, []);

  const handleDelete = async (clauseId: number) => {
    if (!confirm('Delete this legal clause? This action cannot be undone.')) return;
    try {
      await apiClient.deleteAdminLegalClause(clauseId);
      await fetchClauses();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete the legal clause.');
    }
  };

  const clauses = data?.data ?? [];
  const filteredClauses = useMemo(() => {
    if (languageFilter === 'all') return clauses;
    return clauses.filter((clause) => {
      const value = clause.content?.[languageFilter as keyof typeof clause.content];
      return Boolean(value && String(value).trim().length > 0);
    });
  }, [clauses, languageFilter]);
  const hasPagination = data && data.last_page > 1;

  const applyFilters = () => {
    setSearch(draftSearch);
    setCategory(draftCategory);
    setIdentifier(draftIdentifier);
    setSortBy(draftSortBy);
    setSortDir(draftSortDir);
    setPerPage(draftPerPage);
    setLanguageFilter(draftLanguage);
    setPage(1);
  };

  if (loading || (!canView && !fetching)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_60%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/admin">
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
            <Can roles={['admin', 'legal']} allPerms={['legal.clauses.create']}>
              <Link href="/admin/legal/clauses/new">
                <Button className="shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add clause
                </Button>
              </Link>
            </Can>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Legal clauses</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Manage the legal clause library, filter by category or identifier, and keep translations up to date.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>Search by identifier, category, or clause content.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                value={draftSearch}
                onChange={(event) => {
                  setDraftSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search identifiers or content"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                  value={draftCategory}
                  onValueChange={(value) => {
                    setDraftCategory(value);
                    setPage(1);
                  }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((option, key) => (
                      <SelectItem key={key} value={option}>
                        {option}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Identifier</label>
              <Input
                value={draftIdentifier}
                onChange={(event) => {
                  setDraftIdentifier(event.target.value);
                  setPage(1);
                }}
                placeholder="scope_standard"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort by</label>
              <Select
                value={draftSortBy}
                onValueChange={(value) => {
                  setDraftSortBy(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select
                value={draftLanguage}
                onValueChange={(value) => {
                  setDraftLanguage(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Direction</label>
              <Select
                value={draftSortDir}
                onValueChange={(value) => {
                  setDraftSortDir(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_DIR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Per page</label>
              <Select
                value={String(draftPerPage)}
                onValueChange={(value) => {
                  setDraftPerPage(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  {PER_PAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={applyFilters} className="w-full">
                {fetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
          <CardHeader>
            <CardTitle>Clauses</CardTitle>
            <CardDescription>
              {data ? `Showing ${filteredClauses.length} of ${data.total} clauses.` : 'Manage legal clauses for contracts.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
                {error}
              </div>
            )}
            {fetching && filteredClauses.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredClauses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
                No clauses found. Adjust the filters or add a new clause.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredClauses.map((clause) => (
                  <div
                    key={clause.id}
                    className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background/50 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">{clause.identifier}</h3>
                        <Badge variant="outline">{clause.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {(languageFilter === 'all'
                          ? clause.content?.ro || clause.content?.ro || ''
                          : clause.content?.[languageFilter])?.slice(0, 140) || ''}
                        {(languageFilter === 'all'
                          ? clause.content?.ro || clause.content?.en || ''
                          : clause.content?.[languageFilter])?.length > 140
                          ? '…'
                          : ''}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>Updated {new Date(clause.updated_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                          {Object.keys(clause.content || {}).length} translations
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Can roles={['admin', 'legal']} allPerms={['legal.clauses.update']}>
                        <Link
                          href={`/admin/legal/clauses/${clause.id}${
                            languageFilter !== 'all' ? `?lang=${languageFilter}` : ''
                          }`}
                        >
                          <Button variant="outline" size="sm">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                      </Can>
                      <Can roles={['admin', 'legal']} allPerms={['legal.clauses.delete']}>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(clause.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </Can>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasPagination && data ? (
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {data.current_page} of {data.last_page}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.current_page <= 1 || fetching}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.current_page >= data.last_page || fetching}
                    onClick={() => setPage((prev) => Math.min(data.last_page, prev + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
