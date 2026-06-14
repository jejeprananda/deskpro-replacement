"use client";

import { Filter, SlidersHorizontal } from "lucide-react";

interface TicketsPageHeaderProps {
  subtitle: string | null;
}

export function TicketsPageHeader({ subtitle }: TicketsPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Tickets</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Filter className="h-4 w-4" />
          Filter
        </button>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Sort
        </button>
      </div>
    </div>
  );
}
