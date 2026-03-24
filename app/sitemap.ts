import type { MetadataRoute } from "next";

import { getBaseUrl, localizePath, SUPPORTED_LOCALES } from "@/lib/seo";

type DynamicSitemapRoutes = {
  services: string[];
  projects: string[];
  providers: string[];
};

const STATIC_PUBLIC_PATHS = [
  "/",
  "/about",
  "/services",
  "/projects",
  "/help",
  "/contact",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

const FALLBACK_DYNAMIC_ROUTES: DynamicSitemapRoutes = {
  services: [],
  projects: ["sample-project"],
  providers: ["top-react-expert"],
};

function sanitizeSlugs(input?: string[]): string[] {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.map((slug) => slug.trim().toLowerCase()).filter(Boolean))];
}

async function getDynamicRoutes(): Promise<DynamicSitemapRoutes> {
  const endpoint = process.env.SITEMAP_API_ENDPOINT?.trim();
  if (!endpoint) {
    return FALLBACK_DYNAMIC_ROUTES;
  }

  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return FALLBACK_DYNAMIC_ROUTES;
    }

    const payload = (await response.json()) as Partial<DynamicSitemapRoutes>;

    return {
      services: sanitizeSlugs(payload.services),
      projects: sanitizeSlugs(payload.projects),
      providers: sanitizeSlugs(payload.providers),
    };
  } catch {
    return FALLBACK_DYNAMIC_ROUTES;
  }
}

function buildAlternates(pathname: string, baseUrl: string) {
  return {
    languages: Object.fromEntries(
      SUPPORTED_LOCALES.map((locale) => [locale, `${baseUrl}${localizePath(pathname, locale)}`])
    ),
  };
}

function buildLocalizedEntries(
  pathname: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
  baseUrl: string
): MetadataRoute.Sitemap {
  const now = new Date();
  return SUPPORTED_LOCALES.map((locale) => ({
    url: `${baseUrl}${localizePath(pathname, locale)}`,
    lastModified: now,
    changeFrequency,
    priority,
    alternates: buildAlternates(pathname, baseUrl),
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const dynamicRoutes = await getDynamicRoutes();

  const entries: MetadataRoute.Sitemap = [];

  for (const staticPath of STATIC_PUBLIC_PATHS) {
    entries.push(...buildLocalizedEntries(staticPath, "weekly", staticPath === "/" ? 1 : 0.85, baseUrl));
  }

  for (const serviceSlug of dynamicRoutes.services) {
    entries.push(...buildLocalizedEntries(`/services/${serviceSlug}`, "weekly", 0.75, baseUrl));
  }

  for (const projectSlug of dynamicRoutes.projects) {
    entries.push(...buildLocalizedEntries(`/projects/${projectSlug}`, "daily", 0.7, baseUrl));
  }

  for (const providerSlug of dynamicRoutes.providers) {
    entries.push(...buildLocalizedEntries(`/provider/${providerSlug}`, "daily", 0.65, baseUrl));
  }

  return entries;
}
