import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/navigation", () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("framer-motion", async () => {
  const ReactModule = await import("react");

  const createMotionComponent = (tag: string) => {
    return ReactModule.forwardRef<HTMLElement, Record<string, unknown>>(
      (
        {
          children,
          initial: _initial,
          animate: _animate,
          transition: _transition,
          whileInView: _whileInView,
          viewport: _viewport,
          whileHover: _whileHover,
          whileTap: _whileTap,
          ...props
        },
        ref
      ) => ReactModule.createElement(tag, { ...props, ref }, children)
    );
  };

  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => createMotionComponent(tag),
    }
  );

  const useMotionValue = (initial: number) => {
    let current = initial;

    return {
      get: () => current,
      set: (value: number) => {
        current = value;
      },
    };
  };

  return {
    motion,
    useMotionValue,
    useSpring: (value: unknown) => value,
    useReducedMotion: () => true,
    animate: () => ({ stop: () => undefined }),
  };
});

import { TrustoraLandingHeroSection } from "@/components/homepage/trustora-landing/hero-section";

describe("TrustoraLandingHeroSection", () => {
  it("renders hero content and the animated panel structure", () => {
    const { container } = render(<TrustoraLandingHeroSection />);
    const primaryCta = screen.getByRole("link", { name: /hero.primary_cta/i }) as HTMLAnchorElement;
    const secondaryCta = screen.getByRole("link", {
      name: /hero.secondary_cta/i,
    }) as HTMLAnchorElement;

    expect(screen.getByText("hero.title")).toBeTruthy();
    expect(primaryCta.getAttribute("href")).toBe("/projects");
    expect(secondaryCta.getAttribute("href")).toBe("#how-it-works");
    expect(screen.getByText("hero.panel.browser_url")).toBeTruthy();
    expect(screen.getByText("hero.panel.chart.title")).toBeTruthy();
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
