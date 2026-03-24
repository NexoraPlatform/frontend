import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedModules = vi.hoisted(() => ({
  notFound: vi.fn(),
  setRequestLocale: vi.fn(),
  loadMessagesForNamespaces: vi.fn(async () => ({})),
  buildGlobalKnowledgeGraph: vi.fn(() => [{ "@type": "WebSite" }]),
  serializeJsonLd: vi.fn(() => '{"@context":"https://schema.org","@graph":[{"@type":"WebSite"}]}'),
}));

vi.mock("next/navigation", () => ({
  notFound: mockedModules.notFound,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: mockedModules.setRequestLocale,
}));

vi.mock("@/components/analytics/google-tag-manager-loader", () => ({
  GoogleTagManagerLoader: () => null,
}));

vi.mock("@/components/LocaleSync", () => ({
  LocaleSync: () => null,
}));

vi.mock("@/components/seo/json-ld-script", () => ({
  JsonLdScript: () => null,
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

vi.mock("@/contexts/CurrencyContext", () => ({
  CurrencyProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/lib/i18n", () => ({
  loadMessagesForNamespaces: mockedModules.loadMessagesForNamespaces,
  sharedClientNamespaces: ["common"],
}));

vi.mock("@/lib/navigation", () => ({
  locales: ["en", "ro"],
}));

vi.mock("@/lib/seo", () => ({
  buildGlobalKnowledgeGraph: mockedModules.buildGlobalKnowledgeGraph,
  serializeJsonLd: mockedModules.serializeJsonLd,
}));

import { render, screen } from "@testing-library/react";

import LocaleLayout from "../[locale]/layout";

describe("Locale layout JSON-LD", () => {
  beforeEach(() => {
    mockedModules.notFound.mockReset();
    mockedModules.setRequestLocale.mockReset();
    mockedModules.loadMessagesForNamespaces.mockClear();
    mockedModules.buildGlobalKnowledgeGraph.mockClear();
    mockedModules.serializeJsonLd.mockClear();
  });

  it("builds the global knowledge graph with the resolved locale", async () => {
    await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({ locale: "ro" }),
    });

    expect(mockedModules.notFound).not.toHaveBeenCalled();
    expect(mockedModules.setRequestLocale).toHaveBeenCalledWith("ro");
    expect(mockedModules.loadMessagesForNamespaces).toHaveBeenCalledWith("ro", ["common"]);
    expect(mockedModules.buildGlobalKnowledgeGraph).toHaveBeenCalledWith("ro");
    expect(mockedModules.serializeJsonLd).toHaveBeenCalledWith([{ "@type": "WebSite" }]);
  });

  it("provides a shared skip-link target for nested pages", async () => {
    const element = await LocaleLayout({
      children: <section>content</section>,
      params: Promise.resolve({ locale: "en" }),
    });

    render(element);

    const mainContentTarget = document.getElementById("main-content");
    expect(mainContentTarget).not.toBeNull();
    expect(mainContentTarget?.getAttribute("tabindex")).toBe("-1");
    expect(screen.getByText("content")).toBeTruthy();
  });
});
