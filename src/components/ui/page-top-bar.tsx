"use client";

import { Bell, Search, Sun } from "lucide-react";

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

  return (
    <div className="flex items-center justify-end gap-2 border-b border-zinc-200 bg-white px-6 py-3">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder={searchPlaceholder}
          disabled={!searchEnabled}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <button
        type="button"
        aria-label="Notifications"
        className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
      >
        <Bell className="h-4 w-4" />
      </button>

      <button
        type="button"
        aria-label="Toggle theme"
        className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
      >
        <Sun className="h-4 w-4" />
      </button>
    </div>
  );
}
