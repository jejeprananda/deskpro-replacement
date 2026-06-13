"use client";

import { useUiStore } from "@/stores/ui.store";
import { TicketFilterSidebar } from "@/components/tickets/ticket-filter-sidebar";
import type { DateUserWaitingBucketItem } from "@/types/ticket-filter-count";

interface TicketFiltersNavSectionProps {
  buckets: DateUserWaitingBucketItem[];
  selectedBucket: string | null;
  onSelectBucket: (bucket: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export function TicketFiltersNavSection({
  buckets,
  selectedBucket,
  onSelectBucket,
  isLoading = false,
  errorMessage = null,
}: TicketFiltersNavSectionProps) {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const ticketFiltersOpen = useUiStore((state) => state.ticketFiltersOpen);
  const toggleTicketFiltersOpen = useUiStore(
    (state) => state.toggleTicketFiltersOpen,
  );
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const setTicketFiltersOpen = useUiStore((state) => state.setTicketFiltersOpen);

  const selectedBucketItem = buckets.find(
    (bucket) => bucket.value === selectedBucket,
  );

  function handleExpandFilters() {
    setSidebarOpen(true);
    setTicketFiltersOpen(true);
  }

  if (!sidebarOpen) {
    return (
      <div className="p-2">
        <button
          type="button"
          onClick={handleExpandFilters}
          title="Show ticket filters"
          className={`relative flex w-full flex-col items-center rounded-md px-2 py-2 text-xs transition-colors ${
            selectedBucket
              ? "bg-zinc-200 font-semibold text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          <span>F</span>
          {selectedBucketItem ? (
            <span className="mt-1 tabular-nums">{selectedBucketItem.count}</span>
          ) : null}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <button
        type="button"
        onClick={toggleTicketFiltersOpen}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:bg-zinc-50"
        aria-expanded={ticketFiltersOpen}
      >
        <span>Waiting duration</span>
        <span className="text-[10px] normal-case tracking-normal text-zinc-400">
          {ticketFiltersOpen ? "Hide" : "Show"}
        </span>
      </button>

      {ticketFiltersOpen ? (
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <TicketFilterSidebar
            buckets={buckets}
            selectedBucket={selectedBucket}
            onSelectBucket={onSelectBucket}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </div>
      ) : selectedBucketItem ? (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={toggleTicketFiltersOpen}
            className="flex w-full items-center justify-between rounded-md bg-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-900"
          >
            <span>{selectedBucketItem.label}</span>
            <span>{selectedBucketItem.count}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
