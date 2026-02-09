import type { Metadata } from "next";
import type { Locale } from "@/types/locale";

export const SITE_NAME = "Trustora";
export const SITE_TITLE_SUFFIX = "Trustora - Marketplace IT";
export const SITE_TITLE_TEMPLATE = `%s | ${SITE_TITLE_SUFFIX}`;
export const SUPPORTED_LOCALES = ["ro", "en"] as const satisfies readonly Locale[];
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en";

const OG_LOCALE_MAP: Record<SupportedLocale, string> = {
  ro: "ro_RO",
  en: "en_US",
};

const DEFAULT_SOCIAL_PROFILES = [
  "https://www.facebook.com/trustora",
  "https://www.linkedin.com/company/trustora-platform",
] as const;

const DEFAULT_DESCRIPTIONS: Record<SupportedLocale, string> = {
  ro: "Marketplace de servicii IT și freelancing: experți verificați, plăți securizate prin escrow și livrare predictibilă.",
  en: "IT services and freelancing marketplace: verified experts, escrow-secured payments, and predictable delivery.",
};

const DEFAULT_KEYWORDS: string[] = [
  "Trustora",
  "marketplace servicii IT",
  "freelancing IT",
  "escrow plăți servicii",
  "dezvoltare web",
  "dezvoltare aplicații mobile",
  "UI UX design",
  "digital marketing",
  "IT freelancers Romania",
  "IT services marketplace",
];

type JsonLdNode = Record<string, unknown>;

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  pathname?: string;
  locale?: Locale | string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  noIndex?: boolean;
  robots?: {
    index?: boolean;
    follow?: boolean;
  };
}

export interface PageKnowledgeGraphOptions {
  locale?: Locale | string;
  pathname?: string;
  pageTitle: string;
  pageDescription?: string;
  breadcrumbs?: BreadcrumbItem[];
  includeGlobalEntities?: boolean;
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function containsBrand(value: string): boolean {
  return value.toLowerCase().includes(SITE_NAME.toLowerCase());
}

function cleanValue(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function toTitleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function resolveLocale(locale?: Locale | string | null): SupportedLocale {
  const normalized = locale?.toLowerCase();
  return SUPPORTED_LOCALES.includes(normalized as SupportedLocale)
    ? (normalized as SupportedLocale)
    : DEFAULT_LOCALE;
}

export function getBaseUrl(): string {
  const fallback = "https://trustora.ro";
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  return cleanValue(fromEnv || fallback);
}

export function normalizePathname(pathname: string = "/"): string {
  if (!pathname) return "/";
  const raw = pathname.trim();

  if (isAbsoluteUrl(raw)) {
    try {
      const url = new URL(raw);
      const withoutTrailing = url.pathname.replace(/\/+$/, "");
      return withoutTrailing || "/";
    } catch {
      return "/";
    }
  }

  const withoutHash = raw.split("#")[0] || "/";
  const withoutQuery = withoutHash.split("?")[0] || "/";
  const withLeadingSlash = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  const withoutTrailing = withLeadingSlash.replace(/\/+$/, "");
  return withoutTrailing || "/";
}

export function stripLocaleFromPath(pathname: string): string {
  const normalized = normalizePathname(pathname);
  const segments = normalized.split("/").filter(Boolean);
  const first = segments[0]?.toLowerCase();
  if (!first || !SUPPORTED_LOCALES.includes(first as SupportedLocale)) {
    return normalized;
  }

  const rest = segments.slice(1).join("/");
  return rest ? `/${rest}` : "/";
}

export function localizePath(pathname: string, locale: Locale | string): string {
  const resolvedLocale = resolveLocale(locale);
  const normalized = stripLocaleFromPath(pathname);
  return normalized === "/" ? `/${resolvedLocale}` : `/${resolvedLocale}${normalized}`;
}

export function toAbsoluteUrl(pathname: string): string {
  if (!pathname || pathname === "/") return getBaseUrl();
  if (isAbsoluteUrl(pathname)) return pathname;
  return `${getBaseUrl()}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function getSocialProfiles(): string[] {
  const fromEnv = (process.env.NEXT_PUBLIC_SOCIAL_SAME_AS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return fromEnv.length > 0 ? fromEnv : [...DEFAULT_SOCIAL_PROFILES];
}

export function getLanguageAlternates(pathname: string, locale: Locale | string) {
  const normalizedPath = stripLocaleFromPath(pathname);
  const resolvedLocale = resolveLocale(locale);

  return {
    canonical: toAbsoluteUrl(localizePath(normalizedPath, resolvedLocale)),
    languages: {
      ro: toAbsoluteUrl(localizePath(normalizedPath, "ro")),
      en: toAbsoluteUrl(localizePath(normalizedPath, "en")),
      "x-default": toAbsoluteUrl(normalizedPath),
    },
  };
}

function buildOpenGraphTitle(title?: string): string {
  if (!title) return SITE_TITLE_SUFFIX;
  return containsBrand(title) ? title : `${title} | ${SITE_NAME}`;
}

export function buildRootMetadata(): Metadata {
  const baseUrl = getBaseUrl();

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: SITE_TITLE_SUFFIX,
      template: SITE_TITLE_TEMPLATE,
    },
    description: DEFAULT_DESCRIPTIONS.ro,
    keywords: DEFAULT_KEYWORDS,
    applicationName: SITE_NAME,
    formatDetection: {
      email: false,
      telephone: false,
      address: false,
    },
    alternates: {
      canonical: baseUrl,
      languages: {
        ro: toAbsoluteUrl("/ro"),
        en: toAbsoluteUrl("/en"),
        "x-default": baseUrl,
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: SITE_TITLE_SUFFIX,
      description: DEFAULT_DESCRIPTIONS.ro,
      url: baseUrl,
      locale: OG_LOCALE_MAP.ro,
      alternateLocale: [OG_LOCALE_MAP.en],
      images: [
        {
          url: toAbsoluteUrl("/og-image.jpg"),
          width: 1200,
          height: 630,
          alt: SITE_TITLE_SUFFIX,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE_SUFFIX,
      description: DEFAULT_DESCRIPTIONS.ro,
      images: [toAbsoluteUrl("/og-image.jpg")],
      creator: "@trustora",
      site: "@trustora",
    },
    verification: {
      google: process.env.GOOGLE_VERIFICATION_ID,
      yandex: process.env.YANDEX_VERIFICATION_ID,
      yahoo: process.env.YAHOO_VERIFICATION_ID,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/trustora-logo2-60.avif", type: "image/avif" },
        { url: "/trustora-logo2-60.webp", type: "image/webp" },
      ],
      apple: [{ url: "/trustora-logo2-120.avif", type: "image/avif" }],
      shortcut: ["/trustora-logo2-60.webp"],
    },
    manifest: "/manifest.json",
  };
}

export function generateSEO({
  title,
  description,
  keywords = DEFAULT_KEYWORDS,
  image = "/og-image.jpg",
  url,
  pathname,
  locale,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  section,
  noIndex = false,
  robots,
}: SEOProps = {}): Metadata {
  const resolvedLocale = resolveLocale(locale);
  const baseUrl = getBaseUrl();
  const sourcePath = pathname ?? url ?? "/";
  const normalizedPath = normalizePathname(sourcePath);
  const alternates = getLanguageAlternates(normalizedPath, resolvedLocale);
  const canonical = isAbsoluteUrl(sourcePath) ? sourcePath : alternates.canonical;
  const ogTitle = buildOpenGraphTitle(title);
  const pageDescription = description ?? DEFAULT_DESCRIPTIONS[resolvedLocale];
  const imageUrl = toAbsoluteUrl(image);

  // Use robots prop if provided, otherwise fall back to noIndex
  const robotsIndex = robots?.index ?? !noIndex;
  const robotsFollow = robots?.follow ?? !noIndex;

  const alternateOgLocales = SUPPORTED_LOCALES.filter((entry) => entry !== resolvedLocale).map(
    (entry) => OG_LOCALE_MAP[entry]
  );

  return {
    metadataBase: new URL(baseUrl),
    title: title ? (containsBrand(title) ? { absolute: title } : title) : undefined,
    description: pageDescription,
    keywords,
    authors: authors?.length ? authors.map((name) => ({ name })) : [{ name: "Trustora Team" }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: ogTitle,
      description: pageDescription,
      url: canonical,
      siteName: SITE_NAME,
      locale: OG_LOCALE_MAP[resolvedLocale],
      alternateLocale: alternateOgLocales,
      type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
      ...(type === "article" && publishedTime
        ? {
          publishedTime,
          modifiedTime,
          authors,
          section,
        }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: pageDescription,
      images: [imageUrl],
      creator: "@trustora",
      site: "@trustora",
    },
    robots: {
      index: robotsIndex,
      follow: robotsFollow,
      googleBot: {
        index: robotsIndex,
        follow: robotsFollow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_VERIFICATION_ID,
      yandex: process.env.YANDEX_VERIFICATION_ID,
      yahoo: process.env.YAHOO_VERIFICATION_ID,
    },
  };
}

export function buildBreadcrumbs({
  locale,
  pathname = "/",
  breadcrumbs,
}: {
  locale?: Locale | string;
  pathname?: string;
  breadcrumbs?: BreadcrumbItem[];
}): BreadcrumbItem[] {
  if (breadcrumbs?.length) {
    return breadcrumbs.map((item) => ({
      name: item.name,
      path: normalizePathname(item.path),
    }));
  }

  const resolvedLocale = resolveLocale(locale);
  const normalizedPath = stripLocaleFromPath(pathname);
  const segments = normalizedPath.split("/").filter(Boolean);
  const homeLabel = resolvedLocale === "ro" ? "Acasă" : "Home";
  const result: BreadcrumbItem[] = [{ name: homeLabel, path: localizePath("/", resolvedLocale) }];

  let current = "";
  for (const segment of segments) {
    current += `/${segment}`;
    const decoded = decodeURIComponent(segment).replace(/-/g, " ");
    result.push({
      name: toTitleCase(decoded),
      path: localizePath(current, resolvedLocale),
    });
  }

  return result;
}

export function buildBreadcrumbListNode({
  locale,
  pathname = "/",
  breadcrumbs,
}: {
  locale?: Locale | string;
  pathname?: string;
  breadcrumbs?: BreadcrumbItem[];
}): JsonLdNode {
  const resolvedLocale = resolveLocale(locale);
  const normalizedPath = stripLocaleFromPath(pathname);
  const localizedPath = localizePath(normalizedPath, resolvedLocale);
  const pageUrl = toAbsoluteUrl(localizedPath);
  const items = buildBreadcrumbs({ locale: resolvedLocale, pathname: normalizedPath, breadcrumbs });

  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(normalizePathname(item.path)),
    })),
  };
}

export function buildGlobalKnowledgeGraph(locale?: Locale | string): JsonLdNode[] {
  const resolvedLocale = resolveLocale(locale);
  const baseUrl = getBaseUrl();

  return [
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      name: SITE_NAME,
      url: baseUrl,
      inLanguage: SUPPORTED_LOCALES,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/${resolvedLocale}/services?query={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      publisher: { "@id": `${baseUrl}/#professional-service` },
    },
    {
      "@type": "ProfessionalService",
      "@id": `${baseUrl}/#professional-service`,
      name: SITE_NAME,
      url: baseUrl,
      image: toAbsoluteUrl("/og-image.jpg"),
      logo: toAbsoluteUrl("/trustora-logo2-120.avif"),
      description:
        "Marketplace pentru servicii IT și freelancing cu escrow nativ, verificare experți și fluxuri end-to-end.",
      areaServed: ["RO", "EU"],
      availableLanguage: ["ro", "en"],
      serviceType: [
        "Web development",
        "Mobile app development",
        "UI/UX design",
        "Digital marketing",
      ],
      sameAs: getSocialProfiles(),
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        areaServed: "RO",
        availableLanguage: ["ro", "en"],
        email: "contact@trustora.ro",
      },
    },
  ];
}

export function buildPageKnowledgeGraph({
  locale,
  pathname = "/",
  pageTitle,
  pageDescription,
  breadcrumbs,
  includeGlobalEntities = true,
}: PageKnowledgeGraphOptions): JsonLdNode[] {
  const resolvedLocale = resolveLocale(locale);
  const baseUrl = getBaseUrl();
  const normalizedPath = stripLocaleFromPath(pathname);
  const localizedPath = localizePath(normalizedPath, resolvedLocale);
  const pageUrl = toAbsoluteUrl(localizedPath);
  const breadcrumb = buildBreadcrumbListNode({
    locale: resolvedLocale,
    pathname: normalizedPath,
    breadcrumbs,
  });

  const graph: JsonLdNode[] = includeGlobalEntities ? buildGlobalKnowledgeGraph(resolvedLocale) : [];

  graph.push({
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: pageTitle,
    description: pageDescription,
    inLanguage: resolvedLocale,
    isPartOf: { "@id": `${baseUrl}/#website` },
    about: { "@id": `${baseUrl}/#professional-service` },
    breadcrumb: { "@id": breadcrumb["@id"] },
  });
  graph.push(breadcrumb);

  return graph;
}

export function serializeJsonLd(data: JsonLdNode | JsonLdNode[]): string {
  if (Array.isArray(data)) {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@graph": data,
    });
  }

  return JSON.stringify({
    "@context": "https://schema.org",
    ...data,
  });
}

export function generateStructuredData(data: {
  type?: string;
  [key: string]: unknown;
}) {
  const type = data.type ?? (typeof data["@type"] === "string" ? (data["@type"] as string) : "Thing");
  const payload = { ...data };
  delete (payload as { type?: string }).type;

  return {
    "@context": "https://schema.org",
    "@type": type,
    ...payload,
  };
}
