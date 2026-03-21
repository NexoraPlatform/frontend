"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Heart, Loader2, Share2 } from 'lucide-react';
import Image from 'next/image';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import apiClient from '@/lib/api';
import {
  dedupeServices,
  getLocalizedText,
  getServiceProviderCount,
  getServicesFromResponse,
  mergeUniqueServices,
  type CategoryOption,
  type Service,
  type ServicesResponse,
} from '@/lib/server/public-listings';
import { Locale } from '@/types/locale';

type ServicesPageClientProps = {
  initialCategories: CategoryOption[];
  initialServices: Service[];
  initialHasMore: boolean;
};

const ITEMS_PER_PAGE = 12;

export function ServicesPageClient({
  initialCategories,
  initialServices,
  initialHasMore,
}: ServicesPageClientProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const [services, setServices] = useState<Service[]>(() => dedupeServices(initialServices));
  const [categories] = useState<CategoryOption[]>(initialCategories);
  const [selectedServiceType, setSelectedServiceType] = useState('All');

  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());

  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const didUseInitialPayloadRef = useRef(true);
  const wishlistedLabel = t('services.actions.wishlisted');
  const addLabel = t('services.actions.add');
  const shareLabel = t('services.actions.share');

  const loadServices = useCallback(
    async (pageNum: number, isReset = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        const response: ServicesResponse = await apiClient.getServices({
          categoryId: selectedServiceType !== 'All' ? selectedServiceType : undefined,
          page: pageNum + 1,
          limit: ITEMS_PER_PAGE,
        });

        const newServices = dedupeServices(getServicesFromResponse(response));

        if ((response?.totalPages ?? 0) > 0) {
          setHasMore((response.page ?? pageNum + 1) < response.totalPages);
        } else {
          setHasMore(newServices.length >= ITEMS_PER_PAGE);
        }

        if (isReset) {
          setServices(newServices);
        } else {
          setServices((prev) => mergeUniqueServices(prev, newServices));
        }
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [selectedServiceType]
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
    if (didUseInitialPayloadRef.current) {
      didUseInitialPayloadRef.current = false;
      return;
    }

    setPage(0);
    setHasMore(true);
    void loadServices(0, true);
  }, [selectedServiceType, loadServices]);

  useEffect(() => {
    if (page > 0) {
      void loadServices(page);
    }
  }, [page, loadServices]);

  const handleServiceTypeChange = (serviceType: string) => {
    setSelectedServiceType(serviceType);
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
    () => [{ id: 'All', name: t('services.filters.all') }, ...categories],
    [t, categories]
  );

  return (
    <div className="mt-16 min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
      <TrustoraThemeStyles />
      <Header />

      <main className="pt-8 pb-16 px-6 bg-slate-50 dark:bg-[#070C14] min-h-screen" role="main" aria-label={t('services.page.aria_label')}>
        <div className="max-w-7xl mx-auto mb-12">
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3] mb-3">
              {t('services.page.title')}
            </h1>
            <p className="text-lg text-slate-600 dark:text-[#A3ADC2]">
              {t('services.page.subtitle')}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <FilterSidebar
              serviceTypes={serviceTypeOptions}
              selectedServiceType={selectedServiceType}
              onServiceTypeChange={handleServiceTypeChange}
              labels={{
                filterTitle: t('services.filters.title'),
                serviceTypeLabel: t('services.filters.service_type'),
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
                    {t('services.results.no_services')}
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
  selectedServiceType,
  onServiceTypeChange,
  labels,
  locale,
}: {
  serviceTypes: CategoryOption[];
  selectedServiceType: string;
  onServiceTypeChange: (type: string) => void;
  labels: {
    filterTitle: string;
    serviceTypeLabel: string;
  };
  locale: Locale;
}) {
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
    wishlistedLabel: string;
    addLabel: string;
    shareLabel: string;
  };
}) {
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const t = useTranslations('services.results');
  const providerPreview = Array.isArray(service.providers) ? service.providers.slice(0, 3) : [];
  const providerCount = getServiceProviderCount(service);
  const remainingProviders = Math.max(0, providerCount - providerPreview.length);
  const serviceType = service.isFeatured ? t('recommended') : t('standard');

  const providersAvailableTemplate = t.raw('providers_available');
  const providersAvailableParts = typeof providersAvailableTemplate === 'string'
    ? providersAvailableTemplate.split('{count}')
    : ['', ''];

  const providersMoreLabel = t('providers_more_label', { count: remainingProviders });

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

        <div className="mb-6 pb-6 border-b border-slate-200 dark:border-[#1E2A3D]">
          <p className="text-sm text-slate-500 dark:text-[#A3ADC2] mb-3">
            {providersAvailableParts[0]}
            <span className="font-bold text-midnight-blue dark:text-[#E6EDF3]">{providerCount}</span>
            {providersAvailableParts[1] ?? ''}
          </p>

          <div className="flex items-center gap-2">
            {providerPreview.length > 0 ? (
              <>
                <div className="flex -space-x-2">
                  {providerPreview.map((provider) => {
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
            ) : providerCount === 0 ? (
              <span className="text-sm text-slate-500 dark:text-[#A3ADC2]">{t('no_providers')}</span>
            ) : null}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleWishlist}
            disabled={isWishlistLoading}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all duration-200 ${isWishlisted
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
