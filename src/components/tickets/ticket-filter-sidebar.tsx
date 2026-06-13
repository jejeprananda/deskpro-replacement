"use client";

import type { DateUserWaitingBucketItem } from "@/types/ticket-filter-count";

interface TicketFilterSidebarProps {
  buckets: DateUserWaitingBucketItem[];
  selectedBucket: string | null;
  onSelectBucket: (bucket: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export function TicketFilterSidebar({
  buckets,
  selectedBucket,
  onSelectBucket,
  isLoading = false,
  errorMessage = null,
}: TicketFilterSidebarProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            className="h-9 animate-pulse rounded-md bg-zinc-100"
          />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <p className="text-sm text-red-600">{errorMessage}</p>
    );
  }

  if (buckets.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No duration filters available.</p>
    );
  }

  return (
    <ul className="space-y-1">
      {buckets.map((bucket) => {
        const isSelected = selectedBucket === bucket.value;

        return (
          <li key={bucket.value}>
            <button
              type="button"
              onClick={() => onSelectBucket(bucket.value)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                isSelected
                  ? "bg-zinc-200 font-semibold text-zinc-900"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <span>{bucket.label}</span>
              <span>{bucket.count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
