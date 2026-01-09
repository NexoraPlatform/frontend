"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, Loader2 } from 'lucide-react';
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
    (services || []).map((service) => ({
      ...service,
      category: service.category ?? category,
    }))
  ) as Service[];
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
  if ('services' in response) {
    return response.services || [];
  }
  return normalizeServicesByCategoryResponse(response);
}

export default function ServicesPage() {
  const pathname = usePathname();
  const locale = (pathname?.split('/')?.[1] as Locale) || 'ro';
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
    () => [{ id: 'All', name: 'All' }, ...categories],
    [categories]
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

      <main className="pt-24 pb-16 px-6 bg-slate-50 min-h-screen" role="main" aria-label="Servicii disponibile">
        <div className="max-w-7xl mx-auto mb-12">
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0B1C2D] mb-3">
              Services Marketplace
            </h1>
            <p className="text-lg text-slate-600">
              Find expert developers across technologies and services
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
                  <p className="text-lg text-slate-500">
                    No services found matching your filters
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
  locale,
}: {
  serviceTypes: Category[];
  technologies: Technology[];
  selectedServiceType: string;
  selectedTechnologies: string[];
  onServiceTypeChange: (type: string) => void;
  onTechnologiesChange: (techs: string[]) => void;
  onTechnologiesUpdate: () => Promise<void>;
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
      const category = tech.category ?? 'Other';
      const items = grouped.get(category) ?? [];
      items.push(tech);
      grouped.set(category, items);
    });

    return Array.from(grouped.entries());
  }, [visibleTechs]);

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
    <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 p-6 h-fit lg:sticky lg:top-24">
      <h3 className="text-lg font-bold text-[#0B1C2D] mb-6">Filters</h3>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-[#0B1C2D] mb-3">
            Service Type
          </label>
          <select
            value={selectedServiceType}
            onChange={(event) => onServiceTypeChange(event.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1BC47D] focus:ring-2 focus:ring-[#1BC47D]/20 text-slate-700 bg-white"
          >
            {serviceTypes.map((type) => (
              <option key={type.id} value={String(type.id)}>
                {getLocalizedText(type.name, locale)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#0B1C2D] mb-4">
            Technologies
          </label>
          <div ref={techListRef} className="space-y-2 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTechnologies.includes('All')}
                onChange={() => handleTechToggle('All')}
                className="w-4 h-4 rounded border-slate-300 text-[#1BC47D] focus:ring-[#1BC47D] cursor-pointer"
              />
              <span className="text-sm text-slate-700">All</span>
            </label>
            {groupedTechs.map(([category, techs]) => (
              <div key={category} className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-4">
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
                      <span className="text-sm text-slate-700">{name}</span>
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
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-[#1BC47D] border border-[#1BC47D]/30 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
            >
              {expandedTechs ? 'Show Less' : 'Show More'}
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
}: {
  service: Service;
  locale: Locale;
  onWishlistToggle: (serviceId: number) => void;
  isWishlisted: boolean;
}) {
  const providerCount = service.providers?.length || 0;
  const tags = service.skills?.length ? service.skills : service.tags || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          {service.isFeatured && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-2">
              ⭐ Recomandat
            </span>
          )}
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {getLocalizedText(service.category?.name, locale)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onWishlistToggle(service.id)}
          className={`w-9 h-9 flex items-center justify-center rounded-full border ${
            isWishlisted ? 'border-[#1BC47D] text-[#1BC47D]' : 'border-slate-200 text-slate-500'
          } hover:border-[#1BC47D] hover:text-[#1BC47D] transition-colors`}
          aria-label="Toggle wishlist"
        >
          ♥
        </button>
      </div>

      <h3 className="text-lg font-bold text-[#0B1C2D] mb-2">
        {getLocalizedText(service.name, locale)}
      </h3>
      <p className="text-sm text-slate-600 line-clamp-3 mb-4">
        {getLocalizedText(service.description, locale)}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {tags.slice(0, 4).map((tag) => (
          <span
            key={getLocalizedText(tag, locale)}
            className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full"
          >
            {getLocalizedText(tag, locale)}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{providerCount} prestatori disponibili</span>
        <span className="text-[#1BC47D] font-semibold">Verified</span>
      </div>
    </div>
  );
}
