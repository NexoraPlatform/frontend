'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import {
  AI_SEARCH_NAMESPACES,
  type AiSearchNamespace,
  resolveAiSearchNamespace,
} from '@/types/ai-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SmartSearchInputProps {
  targetNamespace: AiSearchNamespace;
  initialQuery?: string;
  className?: string;
  onNamespaceChange?: (namespace: AiSearchNamespace) => void;
  allowedNamespaces?: AiSearchNamespace[];
}

const ADMIN_ROLE_SLUG = 'admin';

export function SmartSearchInput({
  targetNamespace,
  initialQuery,
  className,
  onNamespaceChange,
  allowedNamespaces,
}: SmartSearchInputProps) {
  const router = useRouter();
  const t = useTranslations();
  const { user } = useAuth();

  const [query, setQuery] = useState(initialQuery ?? '');
  const [namespace, setNamespace] = useState<AiSearchNamespace>(targetNamespace);

  const isAdmin = useMemo(() => {
    if (user?.is_superuser) {
      return true;
    }

    const roleSlugs: unknown[] = Array.isArray(user?.role_slugs)
      ? (user?.role_slugs ?? [])
      : [];

    const normalizedRoleSlugs = roleSlugs.map((role) => String(role).toLowerCase());

    if (normalizedRoleSlugs.includes(ADMIN_ROLE_SLUG)) {
      return true;
    }

    const roles: unknown[] = Array.isArray(user?.roles) ? (user?.roles ?? []) : [];

    return roles.some((role: unknown) => {
      if (typeof role === 'string') {
        return role.toLowerCase() === ADMIN_ROLE_SLUG;
      }

      if (role && typeof role === 'object') {
        const slug = (role as { slug?: string }).slug;
        return String(slug ?? '').toLowerCase() === ADMIN_ROLE_SLUG;
      }

      return false;
    });
  }, [user]);

  const namespaceOptions = useMemo<AiSearchNamespace[]>(() => {
    const requestedAllowed = Array.isArray(allowedNamespaces)
      ? allowedNamespaces.filter((value): value is AiSearchNamespace =>
          AI_SEARCH_NAMESPACES.includes(value)
        )
      : [];

    if (requestedAllowed.length > 0) {
      return requestedAllowed;
    }

    return [...AI_SEARCH_NAMESPACES];
  }, [allowedNamespaces]);

  const visibleNamespaces = isAdmin
    ? namespaceOptions
    : namespaceOptions.includes(targetNamespace)
      ? [targetNamespace]
      : [namespaceOptions[0] ?? targetNamespace];

  useEffect(() => {
    const nextNamespace = visibleNamespaces.includes(targetNamespace)
      ? targetNamespace
      : visibleNamespaces[0] ?? targetNamespace;
    setNamespace(nextNamespace);
  }, [targetNamespace, visibleNamespaces]);

  useEffect(() => {
    setQuery(initialQuery ?? '');
  }, [initialQuery]);

  const currentPlaceholder = t(`search.ai.${namespace}.placeholder`);
  const currentContextLabel = t(`search.ai.${namespace}.context`);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return;
    }

    const params = new URLSearchParams();
    params.set('q', normalizedQuery);
    params.set('type', namespace);

    router.push(`/search/ai?${params.toString()}`);
  };

  return (
    <section
      className={cn(
        'rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]/90',
        className
      )}
      aria-label={t('search.ai.aria_label')}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
          {currentContextLabel}
        </p>

        {isAdmin && (
          <div className="min-w-[170px]">
            <Select
              value={namespace}
              onValueChange={(value) => {
                const nextNamespace = resolveAiSearchNamespace(value);
                if (!visibleNamespaces.includes(nextNamespace)) {
                  return;
                }
                setNamespace(nextNamespace);
                onNamespaceChange?.(nextNamespace);
              }}
            >
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder={t('search.ai.namespaces.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {visibleNamespaces.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`search.ai.namespaces.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={currentPlaceholder}
            className="h-11 pl-10"
          />
        </div>

        <Button type="submit" className="h-11 px-6">
          {t('search.ai.submit')}
        </Button>
      </form>
    </section>
  );
}

export default SmartSearchInput;
