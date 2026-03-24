import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      whileInView: _whileInView,
      viewport: _viewport,
      transition: _transition,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

import { TrustoraLandingHowItWorksSection } from "@/components/homepage/trustora-landing/how-it-works-section";

describe("TrustoraLandingHowItWorksSection", () => {
  it("renders localized glass surfaces for the how it works area", () => {
    const { container } = render(<TrustoraLandingHowItWorksSection />);

    expect(container.querySelector("#how-it-works")).toBeTruthy();
    expect(screen.getByText("how_it_works.title")).toBeTruthy();

    const glassSurfaces = container.querySelectorAll('div[class*="backdrop-blur-2xl"]');
    expect(glassSurfaces.length).toBeGreaterThanOrEqual(5);

    const stepTitles = [
      "how_it_works.steps.first.title",
      "how_it_works.steps.second.title",
      "how_it_works.steps.third.title",
    ];

    for (const title of stepTitles) {
      expect(screen.getByText(title)).toBeTruthy();
    }
  });
});
