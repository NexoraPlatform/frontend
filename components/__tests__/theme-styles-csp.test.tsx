import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrustoraLandingThemeStyles } from "@/components/homepage/trustora-landing/theme-styles";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";

describe("theme style helpers", () => {
  it("does not inject inline style tags for landing pages", () => {
    const { container } = render(
      <TrustoraLandingThemeStyles scopeClassName="trustora-homepage" />
    );

    expect(container.innerHTML).toBe("");
    expect(document.head.querySelector("style")).toBeNull();
  });

  it("does not inject inline style tags for trustora shared pages", () => {
    const { container } = render(<TrustoraThemeStyles />);

    expect(container.innerHTML).toBe("");
    expect(document.head.querySelector("style")).toBeNull();
  });
});
