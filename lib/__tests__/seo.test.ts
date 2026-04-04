import { beforeEach, describe, expect, it } from "vitest";

import { buildGlobalKnowledgeGraph, serializeJsonLd } from "@/lib/seo";

const getGraphNode = (graph: ReturnType<typeof buildGlobalKnowledgeGraph>, type: string) =>
  graph.find((node) => node["@type"] === type);

describe("SEO global knowledge graph", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://site.example";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example";
  });

  it("localizes the global knowledge graph for Romanian pages", () => {
    const graph = buildGlobalKnowledgeGraph("ro");
    const website = getGraphNode(graph, "WebSite");
    const professionalService = getGraphNode(graph, "ProfessionalService");

    expect(website?.inLanguage).toBe("ro");
    expect(website?.potentialAction).toMatchObject({
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://app.example/ro/search/ai?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    });
    expect(professionalService?.description).toContain("Marketplace pentru servicii IT");
    expect(professionalService?.inLanguage).toBe("ro");
    expect(serializeJsonLd(graph)).toContain('"@graph"');
  });

  it("localizes the global knowledge graph for English pages", () => {
    const graph = buildGlobalKnowledgeGraph("en");
    const website = getGraphNode(graph, "WebSite");
    const professionalService = getGraphNode(graph, "ProfessionalService");

    expect(website?.inLanguage).toBe("en");
    expect(website?.potentialAction).toMatchObject({
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://app.example/en/search/ai?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    });
    expect(professionalService?.description).toContain("Marketplace for IT services");
    expect(professionalService?.inLanguage).toBe("en");
  });
});
