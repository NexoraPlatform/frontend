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

export default function ServicesPage() {
  const pathname = usePathname();
  const locale = (pathname?.split('/')?.[1] as Locale) || 'ro';
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>(['All']);
  const [technologies, setTechnologies] = useState<Technology[]>([]);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedServiceType, setSelectedServiceType] = useState('All');
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);

  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());

  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    const initializeFilters = async () => {
      try {
        const [categoriesResponse, technologiesResponse] = await Promise.all([
          apiClient.getCategories(),
          apiClient.getTechnologies(),
        ]);

        setCategories(categoriesResponse || []);
        setTechnologies(technologiesResponse || []);

        const uniqueTypes = new Set<string>();
        (categoriesResponse || []).forEach((category: Category) => {
          const name = getLocalizedText(category.name, locale);
          if (name) {
            uniqueTypes.add(name);
          }
        });
        setServiceTypes(['All', ...Array.from(uniqueTypes)]);
      } catch (error) {
        console.error('Failed to load filters:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeFilters();
  }, []);

  const loadServices = useCallback(
    async (pageNum: number, isReset = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        const response: ServicesResponse = await apiClient.getServices({
          categoryId: selectedCategory !== 'All' ? selectedCategory : undefined,
          skills: selectedTechnologies.length > 0 ? selectedTechnologies : undefined,
          page: pageNum + 1,
          limit: ITEMS_PER_PAGE,
        });

        const newServices = response?.services || [];
        const tagSet = new Set<string>();
        newServices.forEach((service) => {
          (service.tags || []).forEach((tag) => tagSet.add(tag));
        });
        if (tagSet.size > 0) {
          setServiceTypes((prev) => {
            const existing = new Set(prev.filter((type) => type !== 'All'));
            tagSet.forEach((tag) => existing.add(tag));
            return ['All', ...Array.from(existing)];
          });
        }

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
    [selectedCategory, selectedTechnologies]
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
  }, [selectedCategory, selectedServiceType, selectedTechnologies, loadServices]);

  useEffect(() => {
    if (page > 0) {
      loadServices(page);
    }
  }, [page, loadServices]);

  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    setSelectedTechnologies([]);

    try {
      const updatedTechnologies = await apiClient.getTechnologies();
      setTechnologies(updatedTechnologies || []);
    } catch (error) {
      console.error('Failed to update technologies:', error);
    }
  };

  const handleTechnologiesUpdate = async () => {
    const updatedTechnologies = await apiClient.getTechnologies();
    setTechnologies(updatedTechnologies || []);
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

  const filteredTechnologies = useMemo(() => {
    if (selectedCategory === 'All') {
      return technologies;
    }
    return technologies.filter((tech) => {
      const categoryId = tech.category_id ?? tech.categoryId;
      return categoryId ? String(categoryId) === selectedCategory : true;
    });
  }, [selectedCategory, technologies]);

  const visibleServices = useMemo(() => {
    if (selectedServiceType === 'All') {
      return services;
    }
    return services.filter((service) => service.tags?.includes(selectedServiceType));
  }, [selectedServiceType, services]);

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
              categories={[{ id: 'All', name: 'All' }, ...categories]}
              serviceTypes={serviceTypes}
              technologies={filteredTechnologies}
              selectedCategory={selectedCategory}
              selectedServiceType={selectedServiceType}
              selectedTechnologies={selectedTechnologies}
              onCategoryChange={handleCategoryChange}
              onServiceTypeChange={setSelectedServiceType}
              onTechnologiesChange={setSelectedTechnologies}
              onTechnologiesUpdate={handleTechnologiesUpdate}
              locale={locale}
            />

            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {visibleServices.map((service) => (
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

              {!isLoading && visibleServices.length === 0 && (
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
  categories,
  serviceTypes,
  technologies,
  selectedCategory,
  selectedServiceType,
  selectedTechnologies,
  onCategoryChange,
  onServiceTypeChange,
  onTechnologiesChange,
  onTechnologiesUpdate,
  locale,
}: {
  categories: Category[];
  serviceTypes: string[];
  technologies: Technology[];
  selectedCategory: string;
  selectedServiceType: string;
  selectedTechnologies: string[];
  onCategoryChange: (category: string) => void;
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

  const handleTechToggle = (tech: string) => {
    const updated = selectedTechnologies.includes(tech)
      ? selectedTechnologies.filter((t) => t !== tech)
      : [...selectedTechnologies, tech];
    onTechnologiesChange(updated);
  };

  const handleShowMore = async () => {
    if (!expandedTechs) {
      setIsUpdatingTechs(true);
      try {
        await onTechnologiesUpdate();
      } finally {
        setIsUpdatingTechs(false);
      }
    }
    setExpandedTechs(!expandedTechs);
  };

  return (
    <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 p-6 h-fit lg:sticky lg:top-24">
      <h3 className="text-lg font-bold text-[#0B1C2D] mb-6">Filters</h3>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-[#0B1C2D] mb-3">
            Backend / Frontend
          </label>
          <select
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1BC47D] focus:ring-2 focus:ring-[#1BC47D]/20 text-slate-700 bg-white"
          >
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {getLocalizedText(category.name, locale)}
              </option>
            ))}
          </select>
        </div>

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
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#0B1C2D] mb-4">
            Technologies
          </label>
          <div className="space-y-2 mb-4">
            {visibleTechs.map((tech) => {
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

          {hasMoreTechs && (
            <button
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
