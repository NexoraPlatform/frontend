import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/auth/social-auth-buttons", () => ({
  AuthSocialButtons: () => <div>social-buttons</div>,
}));

vi.mock("@/components/homepage/trustora-landing/footer", () => ({
  TrustoraLandingFooter: () => null,
}));

vi.mock("@/components/homepage/trustora-landing/navigation", () => ({
  TrustoraLandingNavigation: () => null,
}));

vi.mock("@/components/homepage/trustora-landing/theme-styles", () => ({
  TrustoraLandingThemeStyles: () => null,
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

vi.mock("@/lib/backend-url", () => ({
  buildOAuthRedirectUrl: vi.fn(() => null),
}));

vi.mock("@/lib/navigation", () => ({
  Link: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import SignInPage from "../[locale]/(public)/auth/signin/page";

describe("Sign-in page light mode fields", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders visible light-mode field surfaces for email and password", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );

    render(<SignInPage />);

    const emailInput = screen.getByLabelText("auth.signin.email_label");
    const passwordInput = screen.getByLabelText("auth.signin.password_label");

    expect(emailInput.className).toContain("bg-white/95");
    expect(emailInput.className).toContain("border-slate-300/80");
    expect(passwordInput.className).toContain("bg-white/95");
    expect(passwordInput.className).toContain("border-slate-300/80");
  });
});
