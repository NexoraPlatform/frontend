import { AlertCircle, Loader2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { ProductCard } from '@/components/ProductCard';
import { ProjectCard } from '@/components/ProjectCard';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { fetchClient, FetchError } from '@/lib/fetch-client';
import type { Locale } from '@/types/locale';
import {
  mapProjectResource,
  mapProviderResource,
  mapServiceResource,
  resolveAiSearchNamespace,
  type AiSearchMatchResponse,
  type AiSearchNamespace,
  type AiSearchResponseByNamespace,
} from '@/types/ai-search';
import ProviderCard from '@/app/[locale]/projects/provider-card';
import SmartSearchInput from '@/components/search/SmartSearchInput';

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const RESULTS_LIMIT = 12;
const BROADENING_THRESHOLD = 3;

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const normalizeScore = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  if (value <= 1) {
    return Math.round(value * 100);
  }

  return Math.round(value);
};

const extractServicePrice = (item: Record<string, unknown>): number => {
  const priceCandidates = [
    item.price,
    item.base_price,
    item.starting_price,
    item.minimum_price,
    item.min_price,
  ];

  for (const candidate of priceCandidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === 'string') {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
};

const createEmptyMatchResponse = (namespace: AiSearchNamespace): AiSearchMatchResponse => {
  if (namespace === 'services') {
    return { namespace, data: [], total: 0 };
  }

  if (namespace === 'projects') {
    return { namespace, data: [], total: 0 };
  }

  return { namespace, data: [], total: 0 };
};

export default async function AiSearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const queryParams = (await searchParams) ?? {};

  const query = (getSingleParam(queryParams.q) ?? '').trim();
  const categoryId = getSingleParam(queryParams.category_id);
  const requestedType = resolveAiSearchNamespace(getSingleParam(queryParams.type));
  const requestedNamespace: AiSearchNamespace =
    requestedType === 'services' ? requestedType : 'services';

  const t = await getTranslations({ locale, namespace: 'search.ai' });

  let results = createEmptyMatchResponse(requestedNamespace);
  let errorMessage: string | null = null;

  if (query) {
    try {
      results = await fetchClient.match(query, RESULTS_LIMIT, categoryId);
    } catch (error) {
      if (error instanceof FetchError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = t('generic_error');
      }
    }
  }

  const noResults = query.length > 0 && results.total === 0;
  const isBroadeningSearch =
    query.length > 0 && !errorMessage && results.total > 0 && results.total <= BROADENING_THRESHOLD;

  const resultsFactory: {
    [K in AiSearchNamespace]: (items: AiSearchResponseByNamespace[K]) => ReactNode;
  } = {
    services: (items) => (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {items.map((item, index) => {
          const service = mapServiceResource(item, locale);
          const score = normalizeScore(item.score);
          const price = extractServicePrice(item as Record<string, unknown>);

          return (
            <div
              key={`service-${service.id}-${index}`}
              className="relative"
            >
              {score !== null ? (
                <Badge className="absolute right-3 top-3 z-10 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {t('match_score', { score })}
                </Badge>
              ) : null}
              <ProductCard
                title={service.name}
                description={service.description || service.category}
                price={price}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
                {service.tags.slice(0, 4).map((tag) => (
                  <span
                    key={`${service.id}-${tag}`}
                    className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                  >
                    {tag}
                  </span>
                ))}
                {service.isFeatured ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                    {t('service.featured')}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    ),
    projects: (items) => (
      <div className="space-y-4">
        {items.map((item, index) => {
          const score = normalizeScore(item.score);
          return (
            <div key={`project-${item.id}-${index}`} className="relative">
              {score !== null ? (
                <Badge className="absolute right-3 top-3 z-10 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {t('match_score', { score })}
                </Badge>
              ) : null}
              <ProjectCard project={mapProjectResource(item)} prioritizeClientImage={index < 3} />
            </div>
          );
        })}
      </div>
    ),
    providers: (items) => (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item, index) => {
          const score = normalizeScore(item.score);
          return (
            <div key={`provider-${item.id}-${index}`} className="relative">
              {score !== null ? (
                <Badge className="absolute right-3 top-3 z-10 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {t('match_score', { score })}
                </Badge>
              ) : null}
              <ProviderCard provider={mapProviderResource(item)} avatarPriority={index < 3} />
            </div>
          );
        })}
      </div>
    ),
    provider_profiles: (items) => (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item, index) => {
          const score = normalizeScore(item.score);
          return (
            <div key={`provider-profile-${item.id}-${index}`} className="relative">
              {score !== null ? (
                <Badge className="absolute right-3 top-3 z-10 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {t('match_score', { score })}
                </Badge>
              ) : null}
              <ProviderCard provider={mapProviderResource(item)} avatarPriority={index < 3} />
            </div>
          );
        })}
      </div>
    ),
  };

  const renderedResults =
    results.namespace === 'services'
      ? resultsFactory.services(results.data)
      : results.namespace === 'projects'
        ? resultsFactory.projects(results.data)
        : results.namespace === 'providers'
          ? resultsFactory.providers(results.data)
          : resultsFactory.provider_profiles(results.data);

  const activeNamespaceLabel = t(`namespaces.${results.namespace}`);

  return (
    <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
      <TrustoraThemeStyles />
      <Header />

      <main className="pt-24 pb-16">
        <section className="mx-auto max-w-7xl px-6">
          <div className="mb-6">
            <Badge className="mb-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
              {t('badge')}
            </Badge>
            <h1 className="text-3xl font-bold text-midnight-blue dark:text-[#E6EDF3] sm:text-4xl">
              {t('title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-[#A3ADC2] sm:text-base">
              {t('subtitle')}
            </p>
          </div>

          <SmartSearchInput
            targetNamespace={requestedNamespace}
            initialQuery={query}
            allowedNamespaces={['services']}
            className="mb-8"
          />

          {query ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                {t('results_meta', {
                  count: results.total,
                  query,
                  namespace: activeNamespaceLabel,
                })}
              </div>

              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('error_title')}</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              {isBroadeningSearch ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('broadening_title')}
                  </div>
                  <p className="mt-1 text-xs text-emerald-700/90 dark:text-emerald-200/90">
                    {t('broadening_description')}
                  </p>
                </div>
              ) : null}

              {!errorMessage && renderedResults}

              {noResults && !errorMessage ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('empty_title')}</AlertTitle>
                  <AlertDescription>{t('empty_description')}</AlertDescription>
                </Alert>
              ) : null}

            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600 dark:border-[#1E2A3D] dark:bg-[#0B1220] dark:text-[#A3ADC2]">
              {t('initial_state')}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
