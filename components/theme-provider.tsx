"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Keep this wrapper on public APIs only; importing Next internals here can break SSR in hosted builds.
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
