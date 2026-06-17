"use client";

import { useUiStore } from "@/stores/ui.store";
import { TicketFilterSidebar } from "@/components/tickets/ticket-filter-sidebar";
import type { DateUserWaitingBucketItem } from "@/types/ticket-filter-count";

interface TicketFiltersNavSectionProps {
  buckets: DateUserWaitingBucketItem[];
  selectedBucket: string | null;
  onSelectBucket: (bucket: string) => void;
  isLoading?: boolean;
  remainingTicketCount?: number | null;
  errorMessage?: string | null;
}

function RemainingTicketsLabel({
  count,
  isLoading,
}: {
  count: number | null | undefined;
  isLoading: boolean;
}) {
  const labelClassName =
    "px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted";

  if (isLoading) {
    return (
      <div className={labelClassName}>
        <div className="h-3 w-32 animate-pulse rounded bg-surface-muted" />
      </div>
    );
  }

  if (count == null) {
    return null;
  }

  return (
    <p className={labelClassName}>
      {count} tiket tersisa
    </p>
  );
}

export function TicketFiltersNavSection({
  buckets,
  selectedBucket,
  onSelectBucket,
  isLoading = false,
  remainingTicketCount = null,
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
    const collapsedTitle =
      remainingTicketCount != null
        ? `${remainingTicketCount} tiket tersisa`
        : "Show ticket filters";

    return (
      <div className="p-2">
        <button
          type="button"
          onClick={handleExpandFilters}
          title={collapsedTitle}
          className={`relative flex w-full flex-col items-center rounded-lg px-2 py-2 text-xs transition-colors ${
            selectedBucket
              ? "bg-blue-50 font-semibold text-blue-700"
              : "text-muted hover:bg-surface-muted"
          }`}
        >
          <span>F</span>
          {remainingTicketCount != null ? (
            <span className="mt-1 tabular-nums">{remainingTicketCount}</span>
          ) : selectedBucketItem ? (
            <span className="mt-1 tabular-nums">{selectedBucketItem.count}</span>
          ) : null}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <RemainingTicketsLabel
        count={remainingTicketCount}
        isLoading={isLoading}
      />

      <button
        type="button"
        onClick={toggleTicketFiltersOpen}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted hover:bg-surface-muted"
        aria-expanded={ticketFiltersOpen}
      >
        <span>Waiting duration</span>
        <span className="text-[10px] normal-case tracking-normal text-muted">
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
            className="flex w-full items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"
          >
            <span>{selectedBucketItem.label}</span>
            <span>{selectedBucketItem.count}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
