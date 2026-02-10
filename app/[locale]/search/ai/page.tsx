import { AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
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

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

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
  const requestedType = resolveAiSearchNamespace(getSingleParam(queryParams.type));
  const requestedNamespace: AiSearchNamespace =
    requestedType === 'services' ? requestedType : 'services';

  const t = await getTranslations({ locale, namespace: 'search.ai' });

  let results = createEmptyMatchResponse(requestedNamespace);
  let errorMessage: string | null = null;

  if (query) {
    try {
      results = await fetchClient.match(query, requestedNamespace, RESULTS_LIMIT);
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

  const resultsFactory: {
    [K in AiSearchNamespace]: (items: AiSearchResponseByNamespace[K]) => ReactNode;
  } = {
    services: (items) => (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {items.map((item, index) => {
          const service = mapServiceResource(item, locale);

          return (
            <article
              key={`service-${service.id}-${index}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <Badge variant="secondary" className="text-xs">
                  {service.category}
                </Badge>
                {service.isFeatured ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                    {t('service.featured')}
                  </span>
                ) : null}
              </div>

              <h3 className="text-lg font-semibold text-slate-900 dark:text-[#E6EDF3]">
                {service.name}
              </h3>

              {service.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-[#A3ADC2]">
                  {service.description}
                </p>
              ) : null}

              {service.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {service.tags.slice(0, 4).map((tag) => (
                    <span
                      key={`${service.id}-${tag}`}
                      className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-[#1E2A3D]">
                <p className="text-xs text-slate-500 dark:text-[#A3ADC2]">
                  {t('service.providers', { count: service.providerCount })}
                </p>

                <div className="flex -space-x-2">
                  {service.providers.slice(0, 3).map((provider, providerIndex) => {
                    const providerName = `${provider.firstName ?? ''} ${provider.lastName ?? ''}`.trim();
                    return (
                      <div
                        key={`${service.id}-provider-${provider.id}-${providerIndex}`}
                        className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-slate-100 dark:border-[#0B1220] dark:bg-[#111B2D]"
                      >
                        {provider.avatar ? (
                          <Image
                            src={provider.avatar}
                            alt={providerName || t('service.provider_avatar_alt')}
                            fill
                            sizes="32px"
                            priority={index < 3 && providerIndex === 0}
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    ),
    projects: (items) => (
      <div className="space-y-4">
        {items.map((item, index) => (
          <ProjectCard
            key={`project-${item.id}-${index}`}
            project={mapProjectResource(item)}
            prioritizeClientImage={index < 3}
          />
        ))}
      </div>
    ),
    providers: (items) => (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item, index) => (
          <ProviderCard
            key={`provider-${item.id}-${index}`}
            provider={mapProviderResource(item)}
            avatarPriority={index < 3}
          />
        ))}
      </div>
    ),
    provider_profiles: (items) => (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item, index) => (
          <ProviderCard
            key={`provider-profile-${item.id}-${index}`}
            provider={mapProviderResource(item)}
            avatarPriority={index < 3}
          />
        ))}
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

  const activeNamespaceLabel = t(`namespaces.${requestedNamespace}`);

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
