"use client";

import { useEffect } from "react";
import {
  subscribeToSystemThemeChanges,
  useThemeStore,
} from "@/stores/theme.store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    initializeTheme();
    return subscribeToSystemThemeChanges();
  }, [initializeTheme]);

  return children;
}
