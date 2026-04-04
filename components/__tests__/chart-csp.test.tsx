import { render, waitFor } from "@testing-library/react";
import { ThemeProvider } from "next-themes";
import { describe, expect, it } from "vitest";

import { ChartContainer } from "@/components/ui/chart";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

describe("ChartContainer", () => {
  it("sets chart colors through inline CSS variables instead of style tags", async () => {
    const { container } = render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <ChartContainer
          config={{
            current: { color: "#1BC47D", label: "Current" },
          }}
          className="h-40"
        >
          <div data-testid="chart-child" />
        </ChartContainer>
      </ThemeProvider>
    );

    await waitFor(() => {
      const chartRoot = container.querySelector("[data-chart]");
      expect(chartRoot).not.toBeNull();
      expect(chartRoot?.getAttribute("style")).toContain("--color-current: #1BC47D");
    });

    expect(container.querySelector("style")).toBeNull();
  });
});
