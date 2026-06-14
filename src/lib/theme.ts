export const THEME_STORAGE_KEY = "deskpro-theme";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") {
    return getSystemTheme();
  }

  return preference;
}

export function readStoredThemePreference(): ThemePreference | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return null;
}

export function applyResolvedTheme(theme: ResolvedTheme): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
