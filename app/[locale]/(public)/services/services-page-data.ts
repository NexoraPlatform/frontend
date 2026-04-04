import { cachedServerGet } from "@/lib/server/api";
import {
  getServicesFromResponse,
  getServicesHasMore,
  type CategoryOption,
  type Service,
  type ServicesResponse,
} from "@/lib/server/public-listings";

export const ITEMS_PER_PAGE = 12;
export const PUBLIC_LISTINGS_REVALIDATE_SECONDS = 300;

type ServicesPageInitialData = {
  initialCategories: CategoryOption[];
  initialServices: Service[];
  initialHasMore: boolean;
  initialSearchTerm?: string;
};

function normalizeSearchTerm(value?: string | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : undefined;
}

export function decodeServiceSlugToSearchTerm(slug: string): string | undefined {
  if (typeof slug !== "string" || slug.trim().length === 0) {
    return undefined;
  }

  const decoded = (() => {
    try {
      return decodeURIComponent(slug);
    } catch {
      return slug;
    }
  })();

  return normalizeSearchTerm(decoded.replace(/[-_]+/g, " "));
}

export function normalizeSearchParam(
  value?: string | string[] | null
): string | undefined {
  if (Array.isArray(value)) {
    return normalizeSearchTerm(value[0]);
  }

  return normalizeSearchTerm(value);
}

export async function getServicesPageInitialData({
  locale,
  searchTerm,
}: {
  locale: string;
  searchTerm?: string;
}): Promise<ServicesPageInitialData> {
  const normalizedSearchTerm = normalizeSearchTerm(searchTerm);

  const [categoriesResult, servicesResult] = await Promise.allSettled([
    cachedServerGet<CategoryOption[]>("/categories", {
      next: { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS },
      language: locale,
    }),
    cachedServerGet<ServicesResponse | Service[] | Record<string, unknown>>("/services", {
      next: { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS },
      language: locale,
      query: {
        page: 1,
        limit: ITEMS_PER_PAGE,
        ...(normalizedSearchTerm ? { search: normalizedSearchTerm } : {}),
      },
    }),
  ]);

  const initialCategories =
    categoriesResult.status === "fulfilled" && Array.isArray(categoriesResult.value)
      ? categoriesResult.value
      : [];
  const servicesPayload =
    servicesResult.status === "fulfilled" ? servicesResult.value : null;
  const initialServices = getServicesFromResponse(servicesPayload);
  const initialHasMore = getServicesHasMore(servicesPayload, ITEMS_PER_PAGE);

  return {
    initialCategories,
    initialServices,
    initialHasMore,
    ...(normalizedSearchTerm ? { initialSearchTerm: normalizedSearchTerm } : {}),
  };
}
