import { ServicesPageClient } from './services-page-client';

import { cachedServerGet } from '@/lib/server/api';
import {
  getServicesFromResponse,
  getServicesHasMore,
  type CategoryOption,
  type Service,
  type ServicesResponse,
} from '@/lib/server/public-listings';

type ServicesPageProps = {
  params: Promise<{ locale: string }>;
};

const ITEMS_PER_PAGE = 12;
const PUBLIC_LISTINGS_REVALIDATE_SECONDS = 300;

export const revalidate = 300;

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { locale } = await params;

  const [categoriesResult, servicesResult] = await Promise.allSettled([
    cachedServerGet<CategoryOption[]>('/categories', {
      next: { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS },
      language: locale,
    }),
    cachedServerGet<ServicesResponse | Service[] | Record<string, unknown>>('/services', {
      next: { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS },
      language: locale,
      query: {
        page: 1,
        limit: ITEMS_PER_PAGE,
      },
    }),
  ]);

  const initialCategories =
    categoriesResult.status === 'fulfilled' && Array.isArray(categoriesResult.value)
      ? categoriesResult.value
      : [];
  const servicesPayload =
    servicesResult.status === 'fulfilled' ? servicesResult.value : null;
  const initialServices = getServicesFromResponse(servicesPayload);
  const initialHasMore = getServicesHasMore(servicesPayload, ITEMS_PER_PAGE);

  return (
    <ServicesPageClient
      initialCategories={initialCategories}
      initialServices={initialServices}
      initialHasMore={initialHasMore}
    />
  );
}
