import { beforeEach, describe, expect, it, vi } from "vitest";

const { cachedServerGet } = vi.hoisted(() => ({
  cachedServerGet: vi.fn(),
}));

vi.mock("@/lib/server/api", () => ({
  cachedServerGet,
}));

import {
  decodeServiceSlugToSearchTerm,
  getServicesPageInitialData,
  normalizeSearchParam,
} from "../[locale]/(public)/services/services-page-data";

describe("services page data", () => {
  beforeEach(() => {
    cachedServerGet.mockReset();
  });

  it("normalizes slug and search inputs safely", () => {
    expect(decodeServiceSlugToSearchTerm("web-development")).toBe("web development");
    expect(decodeServiceSlugToSearchTerm("ui_ux-design")).toBe("ui ux design");
    expect(normalizeSearchParam(["  mobile apps  ", "ignored"])).toBe("mobile apps");
    expect(normalizeSearchParam("   ")).toBeUndefined();
  });

  it("loads initial services with the search filter when present", async () => {
    cachedServerGet
      .mockResolvedValueOnce([{ id: 10, name: { en: "Web Development" } }])
      .mockResolvedValueOnce({
        services: [
          {
            id: 1,
            name: { en: "Web Development" },
            description: { en: "Build sites" },
            is_featured: true,
            category: {
              id: 10,
              name: { en: "Development" },
            },
            providers: [],
          },
        ],
        page: 1,
        totalPages: 1,
        total: 1,
        limit: 12,
      });

    const result = await getServicesPageInitialData({
      locale: "en",
      searchTerm: "web development",
    });

    expect(cachedServerGet).toHaveBeenNthCalledWith(
      2,
      "/services",
      expect.objectContaining({
        language: "en",
        query: expect.objectContaining({
          page: 1,
          limit: 12,
          search: "web development",
        }),
      })
    );
    expect(result.initialSearchTerm).toBe("web development");
    expect(result.initialServices).toHaveLength(1);
    expect(result.initialHasMore).toBe(false);
  });
});
