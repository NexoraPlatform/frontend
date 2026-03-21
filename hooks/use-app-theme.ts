"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";

type AppTheme = "light" | "dark";

export function useAppTheme() {
  const { theme, resolvedTheme, setTheme: setConfiguredTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = useMemo<AppTheme>(() => {
    if (!mounted) {
      return "light";
    }

    if (resolvedTheme === "dark" || resolvedTheme === "light") {
      return resolvedTheme;
    }

    if (theme === "dark" || theme === "light") {
      return theme;
    }

    return "light";
  }, [mounted, resolvedTheme, theme]);

  const setTheme = useCallback(
    (nextTheme: AppTheme) => {
      setConfiguredTheme(nextTheme);
    },
    [setConfiguredTheme],
  );

  const toggleTheme = useCallback(() => {
    setConfiguredTheme(activeTheme === "dark" ? "light" : "dark");
  }, [activeTheme, setConfiguredTheme]);

  return {
    activeTheme,
    isDarkMode: activeTheme === "dark",
    isThemeMounted: mounted,
    setTheme,
    toggleTheme,
  };
}
