"use client";

import { useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from '@/lib/navigation';
import { useAuth } from '@/contexts/auth-context';
import { checkRequirement } from '@/lib/access';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ro', label: 'Romanian' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'pl', label: 'Polish' },
  { code: 'nl', label: 'Dutch' },
  { code: 'ch', label: 'Chinese' },
  { code: 'ie', label: 'Irish' },
];

export default function NewLegalClausePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = useMemo(
    () => checkRequirement(user, { roles: ['admin', 'legal'], permissions: ['legal.clauses.create'] }),
    [user]
  );

  useEffect(() => {
    if (!loading && !canCreate) {
      router.replace(`/access-denied?from=${encodeURIComponent('/admin/legal/clauses/new')}`);
    }
  }, [loading, canCreate, router]);

  const handleContentChange = (language: string, value: string) => {
    setContent((prev) => ({ ...prev, [language]: value }));
  };

  const buildContentPayload = () => {
    const entries = Object.entries(content)
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(([, value]) => value.length > 0);
    return Object.fromEntries(entries);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedIdentifier = identifier.trim();
    const trimmedCategory = category.trim();
    const payloadContent = buildContentPayload();

    if (!trimmedIdentifier || !trimmedCategory || Object.keys(payloadContent).length === 0) {
      setError('Identifier, category, and at least one translation are required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiClient.createAdminLegalClause({
        identifier: trimmedIdentifier,
        category: trimmedCategory,
        content: payloadContent,
      });
      router.push('/admin/legal/clauses');
    } catch (err: any) {
      setError(err?.message || 'Failed to create the legal clause.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !canCreate) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_60%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/admin/legal/clauses">
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
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Create legal clause</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Provide an identifier, category, and at least one translation. The backend will normalize and auto-fill
              missing translations to match the legal clause seed format.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
          <CardHeader>
            <CardTitle>Clause details</CardTitle>
            <CardDescription>Identifier and category should match the legal engine naming standards.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Identifier</label>
              <Input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="custom_clause"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="scope"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
          <CardHeader>
            <CardTitle>Translations</CardTitle>
            <CardDescription>Fill in as many languages as you have available. Empty fields are ignored.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {LANGUAGES.map((language) => (
              <div key={language.code} className="space-y-2">
                <label className="text-sm font-medium">{language.label}</label>
                <Textarea
                  value={content[language.code] || ''}
                  onChange={(event) => handleContentChange(language.code, event.target.value)}
                  placeholder={`Clause text in ${language.label}`}
                  className="min-h-[120px]"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/legal/clauses">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Create clause
          </Button>
        </div>
      </form>
    </div>
  );
}
