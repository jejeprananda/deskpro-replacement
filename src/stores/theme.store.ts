import { create } from "zustand";
import {
  applyResolvedTheme,
  getSystemTheme,
  readStoredThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

interface ThemeState {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  initialized: boolean;
  initializeTheme: () => void;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}

function persistPreference(preference: ThemePreference): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
}

function applyPreference(preference: ThemePreference): ResolvedTheme {
  const resolvedTheme = resolveTheme(preference);
  applyResolvedTheme(resolvedTheme);
  return resolvedTheme;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: "system",
  resolvedTheme: "light",
  initialized: false,

  initializeTheme: () => {
    if (get().initialized) {
      return;
    }

    const stored = readStoredThemePreference();
    const preference = stored ?? "system";
    const resolvedTheme = applyPreference(preference);

    set({ preference, resolvedTheme, initialized: true });
  },

  setPreference: (preference) => {
    persistPreference(preference);
    const resolvedTheme = applyPreference(preference);
    set({ preference, resolvedTheme });
  },

  toggleTheme: () => {
    const nextResolved: ResolvedTheme =
      get().resolvedTheme === "dark" ? "light" : "dark";
    get().setPreference(nextResolved);
  },
}));

export function subscribeToSystemThemeChanges(): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = () => {
    const { preference } = useThemeStore.getState();

    if (preference !== "system") {
      return;
    }

    const resolvedTheme = getSystemTheme();
    applyResolvedTheme(resolvedTheme);
    useThemeStore.setState({ resolvedTheme });
  };

  mediaQuery.addEventListener("change", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
}
