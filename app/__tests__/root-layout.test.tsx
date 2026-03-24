import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Manrope: () => ({ variable: "font-manrope" }),
  Space_Grotesk: () => ({ variable: "font-space-grotesk" }),
}));

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(),
}));

import { getLocale } from "next-intl/server";
import RootLayout, { generateMetadata } from "../layout";

describe("Root layout locale handling", () => {
  beforeEach(() => {
    vi.mocked(getLocale).mockReset();
    process.env.NEXT_PUBLIC_SITE_URL = "https://site.example";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example";
  });

  it("renders the html lang attribute from the resolved locale", async () => {
    vi.mocked(getLocale).mockResolvedValue("ro");

    const element = await RootLayout({ children: <div>content</div> });

    expect(element.props.lang).toBe("ro");
  });

  it("falls back to the default locale for unsupported values", async () => {
    vi.mocked(getLocale).mockResolvedValue("de");

    const element = await RootLayout({ children: <div>content</div> });
    const metadata = await generateMetadata();

    expect(element.props.lang).toBe("en");
    expect(metadata.description).toContain("IT services and freelancing marketplace");
    expect(metadata.openGraph?.locale).toBe("en_US");
  });

  it("builds root metadata using the request locale", async () => {
    vi.mocked(getLocale).mockResolvedValue("ro");

    const metadata = await generateMetadata();

    expect(metadata.description).toContain("Marketplace de servicii IT");
    expect(metadata.openGraph?.locale).toBe("ro_RO");
    expect(metadata.twitter?.description).toContain("Marketplace de servicii IT");
  });
});
