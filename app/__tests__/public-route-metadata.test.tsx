import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getProviderUserNameByProfileUrl } = vi.hoisted(() => ({
  getProviderUserNameByProfileUrl: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("../[locale]/(public)/services/services-page-client", () => ({
  ServicesPageClient: () => null,
}));

vi.mock("../[locale]/(public)/services/services-page-data", () => ({
  getServicesPageInitialData: vi.fn(),
  normalizeSearchParam: vi.fn(),
}));

vi.mock("../[locale]/(public)/projects/projects-page-client", () => ({
  ProjectsPageClient: () => null,
}));

vi.mock("../[locale]/(public)/open-soon/open-soon-client", () => ({
  default: () => null,
}));

vi.mock("../[locale]/(public)/contracts/contracts-client", () => ({
  default: () => null,
}));

vi.mock("../[locale]/(public)/provider/[id]/ProviderProfileClient", () => ({
  default: () => null,
}));

vi.mock("@/components/footer", () => ({
  Footer: () => null,
}));

vi.mock("@/components/header", () => ({
  Header: () => null,
}));

vi.mock("@/components/ProductCard", () => ({
  ProductCard: () => null,
}));

vi.mock("@/components/ProjectCard", () => ({
  ProjectCard: () => null,
}));

vi.mock("@/components/trustora/theme-styles", () => ({
  TrustoraThemeStyles: () => null,
}));

vi.mock("@/components/ui/alert", () => ({
  Alert: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  AlertDescription: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  AlertTitle: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/app/[locale]/(public)/projects/provider-card", () => ({
  default: () => null,
}));

vi.mock("@/components/search/SmartSearchInput", () => ({
  default: () => null,
}));

vi.mock("@/lib/fetch-client", () => ({
  fetchClient: {
    match: vi.fn(),
  },
  FetchError: class FetchError extends Error {},
}));

vi.mock("@/lib/server/api", () => ({
  cachedServerGet: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiClient: {
    getProviderUserNameByProfileUrl,
  },
  default: {
    getProviderUserNameByProfileUrl,
  },
}));

import { generateMetadata as generateServicesMetadata } from "../[locale]/(public)/services/page";
import { generateMetadata as generateProjectsMetadata } from "../[locale]/(public)/projects/page";
import { generateMetadata as generateAiSearchMetadata } from "../[locale]/(public)/search/ai/page";
import { generateMetadata as generateOpenSoonMetadata } from "../[locale]/(public)/open-soon/page";
import { generateMetadata as generateContractsMetadata } from "../[locale]/(public)/contracts/page";
import { generateMetadata as generateProviderMetadata } from "../[locale]/(public)/provider/[id]/page";

const makeLocaleParams = (locale: string) => Promise.resolve({ locale });

describe("public route metadata", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://site.example";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example";
    getProviderUserNameByProfileUrl.mockReset();
  });

  it("adds localized metadata for services and projects listing pages", async () => {
    const servicesEn = await generateServicesMetadata({
      params: makeLocaleParams("en"),
    });
    const projectsRo = await generateProjectsMetadata({
      params: makeLocaleParams("ro"),
    });

    expect(servicesEn.title).toContain("Services Marketplace");
    expect(servicesEn.openGraph?.url).toBe("https://app.example/en/services");
    expect(projectsRo.title).toContain("Proiecte");
    expect(projectsRo.openGraph?.url).toBe("https://app.example/ro/projects");
  });

  it("marks hidden search and preview pages as noindex", async () => {
    const searchMetadata = await generateAiSearchMetadata({
      params: Promise.resolve({ locale: "en" }),
    });
    const openSoonMetadata = await generateOpenSoonMetadata({
      params: makeLocaleParams("ro"),
    });
    const contractsMetadata = await generateContractsMetadata({
      params: makeLocaleParams("en"),
    });

    expect(searchMetadata.robots).toMatchObject({ index: false, follow: false });
    expect(openSoonMetadata.robots).toMatchObject({ index: false, follow: false });
    expect(contractsMetadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("builds provider metadata in the server page using the provider name", async () => {
    getProviderUserNameByProfileUrl.mockResolvedValue("Alex Ionescu");

    const metadata = await generateProviderMetadata({
      params: Promise.resolve({ locale: "ro", id: "alex-ionescu" }),
    });

    expect(getProviderUserNameByProfileUrl).toHaveBeenCalledWith("alex-ionescu");
    expect(metadata.title).toContain("Alex Ionescu");
    expect(metadata.description).toContain("Alex Ionescu");
    expect(metadata.alternates?.canonical).toBe(
      "https://app.example/ro/provider/alex-ionescu"
    );
  });
});
