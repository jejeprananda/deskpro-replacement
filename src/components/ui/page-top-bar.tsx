"use client";

import { Bell, Moon, Search, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/theme.store";

interface PageTopBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function PageTopBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search tickets...",
}: PageTopBarProps) {
  const searchEnabled = onSearchChange != null;
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex items-center justify-end gap-2 border-b border-border bg-surface px-6 py-3">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder={searchPlaceholder}
          disabled={!searchEnabled}
          className="w-full rounded-lg border border-border bg-surface-muted py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-blue-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <button
        type="button"
        aria-label="Notifications"
        className="rounded-lg border border-border p-2 text-muted hover:bg-surface-muted hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={isDark}
        className="rounded-lg border border-border p-2 text-muted hover:bg-surface-muted hover:text-foreground"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </div>
  );
}
