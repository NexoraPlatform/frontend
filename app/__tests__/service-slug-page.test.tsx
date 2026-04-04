import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServicesPageInitialData } = vi.hoisted(() => ({
  getServicesPageInitialData: vi.fn(),
}));

vi.mock("../[locale]/(public)/services/services-page-client", () => ({
  ServicesPageClient: (props: Record<string, unknown>) => props,
}));

vi.mock("../[locale]/(public)/services/services-page-data", () => {
  return {
    getServicesPageInitialData,
    decodeServiceSlugToSearchTerm: (slug: string) =>
      slug.replace(/[-_]+/g, " ").trim() || undefined,
  };
});

import ServiceSlugPage, {
  generateMetadata,
} from "../[locale]/(public)/services/[slug]/page";

describe("service slug page", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://site.example";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example";
    getServicesPageInitialData.mockReset();
  });

  it("generates localized metadata for service landing routes", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: "web-development" }),
    });

    expect(metadata.title).toContain("Web Development services");
    expect(metadata.alternates?.canonical).toBe(
      "https://app.example/en/services/web-development"
    );
    expect(metadata.openGraph?.url).toBe(
      "https://app.example/en/services/web-development"
    );
  });

  it("passes the decoded slug search term into the shared services page", async () => {
    getServicesPageInitialData.mockResolvedValue({
      initialCategories: [{ id: 1, name: { en: "Development" } }],
      initialServices: [],
      initialHasMore: false,
      initialSearchTerm: "web development",
    });

    const element = await ServiceSlugPage({
      params: Promise.resolve({ locale: "en", slug: "web-development" }),
    });

    expect(getServicesPageInitialData).toHaveBeenCalledWith({
      locale: "en",
      searchTerm: "web development",
    });
    expect(element.props.initialSearchTerm).toBe("web development");
  });
});
