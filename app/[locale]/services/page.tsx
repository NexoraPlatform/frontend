"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Heart, Loader2, Share2 } from 'lucide-react';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import apiClient from '@/lib/api';
import { Locale } from '@/types/locale';

type LocalizedText = string | Record<string, string>;

interface ServiceCategory {
  id: number;
  name: LocalizedText;
}

interface ServiceProvider {
  id: number;
  firstName: string;
  lastName: string;
  avatar: string;
  rating: string;
}

interface Service {
  id: number;
  name: LocalizedText;
  description: LocalizedText;
  tags?: string[];
  skills?: LocalizedText[];
  isFeatured: boolean;
  category: ServiceCategory;
  providers: ServiceProvider[];
}

interface ServicesResponse {
  services: Service[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type Category = {
  id: string | number;
  name: LocalizedText;
};

type Technology = {
  id?: number | string;
  name?: LocalizedText;
  category_id?: number | string;
  categoryId?: number | string;
  category?: string;
  parent_category?: string;
};

const ITEMS_PER_PAGE = 12;

function getLocalizedText(value: LocalizedText | null | undefined, locale: Locale) {
    if (!value) {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    return value[locale] ?? value.ro ?? value.en ?? Object.values(value)[0] ?? '';
}

function extractTechnologiesFromServices(services: Service[], locale: Locale): Technology[] {
  const uniqueTechs = new Map<string, Technology>();

  services.forEach((service) => {
    const serviceName = getLocalizedText(service.name, locale);
    const skills = service.skills?.map((skill) => getLocalizedText(skill, locale)) ?? [];
    const tags = service.tags ?? [];
    const categoryName =
      typeof service.category === 'string'
        ? service.category
        : service.category
          ? getLocalizedText(service.category.name, locale) || String(service.category?.name ?? '')
          : '';

    [serviceName, ...skills, ...tags].forEach((name) => {
      const normalized = name?.trim();
      if (!normalized) {
        return;
      }
      const key = `${categoryName}::${normalized}`;
      if (!uniqueTechs.has(key)) {
        uniqueTechs.set(key, { name: normalized, category: categoryName || undefined });
      }
    });
  });

  return Array.from(uniqueTechs.values());
}

function normalizeServicesByCategoryResponse(response: Record<string, Technology[]>): Service[] {
  return Object.entries(response).flatMap(([category, services]) =>
    (services || []).map((service, index) => {
      const categoryName = service.category ?? category;
      const categoryIdRaw = service.category_id ?? service.categoryId ?? category;
      const categoryId =
        typeof categoryIdRaw === 'number'
          ? categoryIdRaw
          : Number.isFinite(Number(categoryIdRaw))
            ? Number(categoryIdRaw)
            : 0;
      const fallbackCategory: ServiceCategory = {
        id: categoryId,
        name: categoryName ?? category,
      };

      const numericId =
        typeof service.id === 'number'
          ? service.id
          : Number.isFinite(Number(service.id))
            ? Number(service.id)
            : index;

      return {
        id: numericId,
        name: service.name ?? categoryName ?? category,
        description: '',
        isFeatured: false,
        providers: [],
        category:
          typeof service.category === 'string' || !service.category
            ? fallbackCategory
            : service.category,
        tags: [],
        skills: [],
      };
    })
  );
}

function isServicesResponse(
  response: ServicesResponse | Service[] | Record<string, Technology[]> | null | undefined
): response is ServicesResponse {
  if (!response || typeof response !== 'object') {
    return false;
  }
  if (!('services' in response)) {
    return false;
  }
  const services = (response as ServicesResponse).services;
  return (
    Array.isArray(services) &&
    services.every((service) => service && typeof service === 'object' && 'description' in service)
  );
}

function getServicesFromResponse(
  response:
    | ServicesResponse
    | Service[]
    | Record<string, Technology[]>
    | null
    | undefined
): Service[] {
  if (!response) {
    return [];
  }
  if (Array.isArray(response)) {
    return response;
  }
  if (isServicesResponse(response)) {
    return response.services || [];
  }
  return normalizeServicesByCategoryResponse(response);
}

export default function ServicesPage() {
    const locale = useLocale() as Locale;
  const t = useTranslations();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [allTechnologies, setAllTechnologies] = useState<Technology[]>([]);

  const [selectedServiceType, setSelectedServiceType] = useState('All');
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>(['All']);

  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());

  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const mainAriaLabel = t('services.page.aria_label');
  const pageTitle = t('services.page.title');
  const pageSubtitle = t('services.page.subtitle');
  const noServicesText = t('services.results.no_services');
  const filterTitle = t('services.filters.title');
  const serviceTypeLabel = t('services.filters.service_type');
  const technologiesLabel = t('services.filters.technologies');
  const allLabel = t('services.filters.all');
  const showMoreLabel = t('services.filters.show_more');
  const showLessLabel = t('services.filters.show_less');
  const otherCategoryLabel = t('services.filters.other');
  const recommendedLabel = t('services.results.recommended');
  const standardLabel = t('services.results.standard');
  const moreLabelTemplate = t('services.results.more_label');
  const providersAvailableTemplate = t('services.results.providers_available');
  const providersMoreLabelTemplate = t('services.results.providers_more_label');
  const noProvidersLabel = t('services.results.no_providers');
  const wishlistedLabel = t('services.actions.wishlisted');
  const addLabel = t('services.actions.add');
  const shareLabel = t('services.actions.share');

  const fetchAllServices = useCallback(async () => {
    const firstResponse: ServicesResponse = await apiClient.getServices({
      page: 1,
      limit: ITEMS_PER_PAGE,
    });
    const firstPageServices = getServicesFromResponse(firstResponse);
    const totalPages = firstResponse?.totalPages ?? 1;

    if (totalPages <= 1) {
      return firstPageServices;
    }

    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        apiClient.getServices({ page: index + 2, limit: ITEMS_PER_PAGE })
      )
    );

    const remainingServices = remainingPages.flatMap((pageResponse) =>
      getServicesFromResponse(pageResponse)
    );

    return [...firstPageServices, ...remainingServices];
  }, []);

  useEffect(() => {
    const initializeFilters = async () => {
      try {
        const [categoriesResponse, servicesList] = await Promise.all([
          apiClient.getCategories(),
          fetchAllServices(),
        ]);

        setCategories(categoriesResponse || []);
        const extractedTechnologies = extractTechnologiesFromServices(servicesList, locale);
        setAllTechnologies(extractedTechnologies);
        setTechnologies(extractedTechnologies);

      } catch (error) {
        console.error('Failed to load filters:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeFilters();
  }, [fetchAllServices, locale]);

  const loadServices = useCallback(
    async (pageNum: number, isReset = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        const response: ServicesResponse = await apiClient.getServices({
          categoryId: selectedServiceType !== 'All' ? selectedServiceType : undefined,
          skills:
            selectedTechnologies.length > 0 && !selectedTechnologies.includes('All')
              ? selectedTechnologies
              : undefined,
          page: pageNum + 1,
          limit: ITEMS_PER_PAGE,
        });

        const newServices = response?.services || [];

        if (newServices.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }

        if (isReset) {
          setServices(newServices);
        } else {
          setServices((prev) => [...prev, ...newServices]);
        }
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [selectedServiceType, selectedTechnologies]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    loadServices(0, true);
  }, [selectedServiceType, selectedTechnologies, loadServices]);

  useEffect(() => {
    if (page > 0) {
      loadServices(page);
    }
  }, [page, loadServices]);

  const handleServiceTypeChange = async (serviceType: string) => {
    setSelectedServiceType(serviceType);
    setSelectedTechnologies(['All']);

    if (serviceType === 'All') {
      setTechnologies(allTechnologies);
      return;
    }

    try {
      const servicesResponse = await apiClient.getServicesByCategoryId(serviceType);
      const servicesList = getServicesFromResponse(servicesResponse);
      setTechnologies(extractTechnologiesFromServices(servicesList, locale));
    } catch (error) {
      console.error('Failed to update technologies:', error);
    }
  };

  const handleTechnologiesUpdate = async () => {
    const servicesList =
      selectedServiceType === 'All'
        ? await fetchAllServices()
        : getServicesFromResponse(
            await apiClient.getServicesByCategoryId(selectedServiceType)
          );

    const extractedTechnologies = extractTechnologiesFromServices(servicesList, locale);
    setTechnologies(extractedTechnologies);
    if (selectedServiceType === 'All') {
      setAllTechnologies(extractedTechnologies);
    }
  };

  const handleWishlistToggle = (serviceId: number) => {
    setWishlist((prev) => {
      const updated = new Set(prev);
      if (updated.has(serviceId)) {
        updated.delete(serviceId);
      } else {
        updated.add(serviceId);
      }
      return updated;
    });
  };

  const serviceTypeOptions = useMemo(
    () => [{ id: 'All', name: allLabel }, ...categories],
    [allLabel, categories]
  );

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
        <TrustoraThemeStyles />
        <Header />
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#1BC47D] animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
      <TrustoraThemeStyles />
      <Header />

      <main className="pt-8 pb-16 px-6 bg-slate-50 dark:bg-[#070C14] min-h-screen" role="main" aria-label={mainAriaLabel}>
        <div className="max-w-7xl mx-auto mb-12">
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3] mb-3">
              {pageTitle}
            </h1>
            <p className="text-lg text-slate-600 dark:text-[#A3ADC2]">
              {pageSubtitle}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <FilterSidebar
              serviceTypes={serviceTypeOptions}
              technologies={technologies}
              selectedServiceType={selectedServiceType}
              selectedTechnologies={selectedTechnologies}
              onServiceTypeChange={handleServiceTypeChange}
              onTechnologiesChange={setSelectedTechnologies}
              onTechnologiesUpdate={handleTechnologiesUpdate}
              labels={{
                filterTitle,
                serviceTypeLabel,
                technologiesLabel,
                allLabel,
                showMoreLabel,
                showLessLabel,
                otherCategoryLabel,
              }}
              locale={locale}
            />

            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    locale={locale}
                    onWishlistToggle={handleWishlistToggle}
                    isWishlisted={wishlist.has(service.id)}
                    labels={{
                      recommendedLabel,
                      standardLabel,
                      moreLabelTemplate,
                      providersAvailableTemplate,
                      providersMoreLabelTemplate,
                      noProvidersLabel,
                      wishlistedLabel,
                      addLabel,
                      shareLabel,
                    }}
                  />
                ))}
              </div>

              {isLoading && (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#1BC47D] animate-spin" />
                </div>
              )}

              {!isLoading && services.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-lg text-slate-500 dark:text-[#A3ADC2]">
                    {noServicesText}
                  </p>
                </div>
              )}

              <div ref={observerTarget} className="h-4" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FilterSidebar({
  serviceTypes,
  technologies,
  selectedServiceType,
  selectedTechnologies,
  onServiceTypeChange,
  onTechnologiesChange,
  onTechnologiesUpdate,
  labels,
  locale,
}: {
  serviceTypes: Category[];
  technologies: Technology[];
  selectedServiceType: string;
  selectedTechnologies: string[];
  onServiceTypeChange: (type: string) => void;
  onTechnologiesChange: (techs: string[]) => void;
  onTechnologiesUpdate: () => Promise<void>;
  labels: {
    filterTitle: string;
    serviceTypeLabel: string;
    technologiesLabel: string;
    allLabel: string;
    showMoreLabel: string;
    showLessLabel: string;
    otherCategoryLabel: string;
  };
  locale: Locale;
}) {
  const [expandedTechs, setExpandedTechs] = useState(false);
  const [isUpdatingTechs, setIsUpdatingTechs] = useState(false);

  const INITIAL_TECH_DISPLAY = 6;
  const visibleTechs = expandedTechs ? technologies : technologies.slice(0, INITIAL_TECH_DISPLAY);
  const hasMoreTechs = technologies.length > INITIAL_TECH_DISPLAY;
  const groupedTechs = useMemo(() => {
    const grouped = new Map<string, Technology[]>();

    visibleTechs.forEach((tech) => {
      const category = tech.category ?? labels.otherCategoryLabel;
      const items = grouped.get(category) ?? [];
      items.push(tech);
      grouped.set(category, items);
    });

    return Array.from(grouped.entries());
  }, [labels.otherCategoryLabel, visibleTechs]);

  const techListRef = useRef<HTMLDivElement>(null);
  const showMoreButtonRef = useRef<HTMLButtonElement>(null);

  const handleTechToggle = (tech: string) => {
    if (tech === 'All') {
      onTechnologiesChange(['All']);
      return;
    }

    const updated = selectedTechnologies.includes(tech)
      ? selectedTechnologies.filter((t) => t !== tech)
      : [...selectedTechnologies.filter((t) => t !== 'All'), tech];

    onTechnologiesChange(updated.length > 0 ? updated : ['All']);
  };

  const handleShowMore = async () => {
    if (!expandedTechs) {
      setIsUpdatingTechs(true);
      try {
        await onTechnologiesUpdate();
      } finally {
        setIsUpdatingTechs(false);
      }
      setExpandedTechs(true);
      return;
    }
    setExpandedTechs(false);
  };

  useEffect(() => {
    if (!expandedTechs || !techListRef.current) return;
    const lastItem = techListRef.current.querySelector('label:last-of-type');
    if (lastItem) {
      lastItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    showMoreButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [expandedTechs]);

  return (
    <div className="w-full lg:w-80 bg-white dark:bg-[#0B1220] rounded-xl border border-slate-200 dark:border-[#1E2A3D] p-6 h-fit lg:sticky lg:top-24">
      <h3 className="text-lg font-bold text-[#0B1C2D] dark:text-[#E6EDF3] mb-6">{labels.filterTitle}</h3>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-[#0B1C2D] dark:text-[#E6EDF3] mb-3">
            {labels.serviceTypeLabel}
          </label>
          <select
            value={selectedServiceType}
            onChange={(event) => onServiceTypeChange(event.target.value)}
            className="w-full px-4 py-2 border border-slate-200 dark:border-[#1E2A3D] rounded-lg focus:outline-none focus:border-[#1BC47D] focus:ring-2 focus:ring-[#1BC47D]/20 text-slate-700 dark:text-[#E6EDF3] bg-white dark:bg-[#0B1220]"
          >
            {serviceTypes.map((type) => (
              <option key={type.id} value={String(type.id)}>
                {getLocalizedText(type.name, locale)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#0B1C2D] dark:text-[#E6EDF3] mb-4">
            {labels.technologiesLabel}
          </label>
          <div ref={techListRef} className="space-y-2 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTechnologies.includes('All')}
                onChange={() => handleTechToggle('All')}
                className="w-4 h-4 rounded border-slate-300 text-[#1BC47D] focus:ring-[#1BC47D] cursor-pointer"
              />
              <span className="text-sm text-slate-700 dark:text-[#E6EDF3]">{labels.allLabel}</span>
            </label>
            {groupedTechs.map(([category, techs]) => (
              <div key={category} className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-[#6B7285] uppercase tracking-wide mt-4">
                  {category}
                </p>
                {techs.map((tech) => {
                  const name = getLocalizedText(tech.name ?? '', locale) || String(tech.id ?? '');
                  return (
                    <label key={name} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTechnologies.includes(name)}
                        onChange={() => handleTechToggle(name)}
                        className="w-4 h-4 rounded border-slate-300 text-[#1BC47D] focus:ring-[#1BC47D] cursor-pointer"
                      />
                      <span className="text-sm text-slate-700 dark:text-[#E6EDF3]">{name}</span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>

          {hasMoreTechs && (
            <button
              ref={showMoreButtonRef}
              onClick={handleShowMore}
              disabled={isUpdatingTechs}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-[#1BC47D] border border-[#1BC47D]/30 rounded-lg hover:bg-emerald-50 dark:hover:bg-[rgba(27,196,125,0.1)] transition-colors disabled:opacity-50"
            >
              {expandedTechs ? labels.showLessLabel : labels.showMoreLabel}
              <ChevronDown
                size={16}
                className={`transition-transform ${expandedTechs ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  locale,
  onWishlistToggle,
  isWishlisted,
  labels,
}: {
  service: Service;
  locale: Locale;
  onWishlistToggle: (serviceId: number) => void;
  isWishlisted: boolean;
  labels: {
    recommendedLabel: string;
    standardLabel: string;
    moreLabelTemplate: string;
    providersAvailableTemplate: string;
    providersMoreLabelTemplate: string;
    noProvidersLabel: string;
    wishlistedLabel: string;
    addLabel: string;
    shareLabel: string;
  };
}) {
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const providerCount = service.providers?.length || 0;
  const technologies = [
    ...(service.skills?.map((skill) => getLocalizedText(skill, locale)) ?? []),
    ...(service.tags ?? []),
  ].filter(Boolean);
  const uniqueTechnologies = Array.from(new Set(technologies));
  const remainingProviders = Math.max(0, providerCount - 3);
  const serviceType = service.isFeatured ? labels.recommendedLabel : labels.standardLabel;
  const moreLabel = labels.moreLabelTemplate.replace('{count}', String(uniqueTechnologies.length - 3));
  const providersAvailableParts = labels.providersAvailableTemplate.split('{count}');
  const providersMoreLabel = labels.providersMoreLabelTemplate.replace('{count}', String(remainingProviders));

  const handleWishlist = async () => {
    setIsWishlistLoading(true);
    try {
      onWishlistToggle(service.id);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0B1220] rounded-xl border border-slate-200 dark:border-[#1E2A3D] overflow-visible hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-[#111B2D] text-slate-700 dark:text-[#E6EDF3] text-xs font-bold rounded-full">
            {getLocalizedText(service.category?.name, locale)}
          </span>
          <span className="text-slate-400 dark:text-[#6B7285] text-sm font-medium">{serviceType}</span>
        </div>

        <h3 className="text-lg font-bold text-midnight-blue dark:text-[#E6EDF3] mb-2 line-clamp-2">
          {getLocalizedText(service.name, locale)}
        </h3>

        <p className="text-sm text-slate-600 dark:text-[#A3ADC2] mb-4 line-clamp-2 leading-relaxed">
          {getLocalizedText(service.description, locale)}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {uniqueTechnologies.slice(0, 3).map((tech) => (
            <span key={tech} className="text-xs bg-emerald-50 dark:bg-[rgba(27,196,125,0.1)] text-emerald-700 dark:text-[#1BC47D] px-2 py-1 rounded">
              {tech}
            </span>
          ))}
          {uniqueTechnologies.length > 3 && (
            <span className="text-xs text-slate-500 dark:text-[#A3ADC2]">
              {moreLabel}
            </span>
          )}
        </div>

        <div className="mb-6 pb-6 border-b border-slate-200 dark:border-[#1E2A3D]">
          <p className="text-sm text-slate-500 dark:text-[#A3ADC2] mb-3">
            {providersAvailableParts[0]}
            <span className="font-bold text-midnight-blue dark:text-[#E6EDF3]">{providerCount}</span>
            {providersAvailableParts[1] ?? ''}
          </p>

          <div className="flex items-center gap-2">
            {service.providers && service.providers.length > 0 ? (
              <>
                <div className="flex -space-x-2">
                  {service.providers.slice(0, 3).map((provider) => {
                    const providerName = `${provider.firstName} ${provider.lastName}`;
                    return (
                      <div key={provider.id} className="relative group">
                        <Image
                          src={provider.avatar || '/placeholder-avatar.png'}
                          alt={providerName}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full border-2 border-white object-cover"
                        />
                        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100">
                          {providerName}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {remainingProviders > 0 && (
                  <span className="text-xs text-slate-600 dark:text-[#A3ADC2] font-medium">
                    {providersMoreLabel}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-slate-500 dark:text-[#A3ADC2]">{labels.noProvidersLabel}</span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleWishlist}
            disabled={isWishlistLoading}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              isWishlisted
                ? 'bg-red-50 text-error-red border border-error-red'
                : 'bg-slate-50 dark:bg-[#111B2D] text-slate-600 dark:text-[#A3ADC2] border border-slate-200 dark:border-[#1E2A3D] hover:border-error-red hover:bg-red-50'
            } ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart size={16} className={isWishlisted ? 'fill-current' : ''} />
            <span className="text-sm font-medium">
              {isWishlisted ? labels.wishlistedLabel : labels.addLabel}
            </span>
          </button>

          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-50 dark:bg-[#111B2D] text-slate-600 dark:text-[#A3ADC2] border border-slate-200 dark:border-[#1E2A3D] hover:border-emerald-green hover:bg-emerald-50 hover:text-emerald-green transition-all duration-200"
          >
            <Share2 size={16} />
            <span className="text-sm font-medium">{labels.shareLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
