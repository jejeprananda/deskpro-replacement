"use client";

import { useUiStore } from "@/stores/ui.store";
import { TicketFilterSidebar } from "@/components/tickets/ticket-filter-sidebar";
import type { DateUserWaitingBucketItem } from "@/types/ticket-filter-count";
import type { TicketScope } from "@/types/ticket-list";

interface TicketFiltersNavSectionProps {
  buckets: DateUserWaitingBucketItem[];
  selectedBucket: string | null;
  onSelectBucket: (bucket: string) => void;
  scope: TicketScope;
  onScopeChange: (scope: TicketScope) => void;
  isLoading?: boolean;
  ticketCount?: number | null;
  errorMessage?: string | null;
}

function ScopeTabs({
  scope,
  onScopeChange,
}: {
  scope: TicketScope;
  onScopeChange: (scope: TicketScope) => void;
}) {
  return (
    <div className="flex gap-1 px-3 pt-3">
      <button
        type="button"
        onClick={() => onScopeChange("all")}
        className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
          scope === "all"
            ? "bg-blue-50 text-blue-700"
            : "text-muted hover:bg-surface-muted hover:text-foreground"
        }`}
      >
        All
      </button>
      <button
        type="button"
        onClick={() => onScopeChange("mine")}
        className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
          scope === "mine"
            ? "bg-blue-50 text-blue-700"
            : "text-muted hover:bg-surface-muted hover:text-foreground"
        }`}
      >
        My Ticket
      </button>
    </div>
  );
}

function TicketCountLabel({
  scope,
  count,
  isLoading,
}: {
  scope: TicketScope;
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
      {scope === "mine" ? `${count} tiket saya` : `${count} tiket tersisa`}
    </p>
  );
}

export function TicketFiltersNavSection({
  buckets,
  selectedBucket,
  onSelectBucket,
  scope,
  onScopeChange,
  isLoading = false,
  ticketCount = null,
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
      ticketCount != null
        ? scope === "mine"
          ? `${ticketCount} tiket saya`
          : `${ticketCount} tiket tersisa`
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
          <span>{scope === "mine" ? "M" : "F"}</span>
          {ticketCount != null ? (
            <span className="mt-1 tabular-nums">{ticketCount}</span>
          ) : selectedBucketItem ? (
            <span className="mt-1 tabular-nums">{selectedBucketItem.count}</span>
          ) : null}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScopeTabs scope={scope} onScopeChange={onScopeChange} />

      <TicketCountLabel
        scope={scope}
        count={ticketCount}
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
