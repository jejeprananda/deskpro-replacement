"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { MassActionsPanel } from "@/components/tickets/mass-actions-panel";
import { TicketListPanel } from "@/components/tickets/ticket-list-panel";
import { TicketSearchPanel } from "@/components/tickets/ticket-search-panel";
import { TicketSummaryCards } from "@/components/tickets/ticket-summary-cards";
import { TicketsFilterLayout } from "@/components/tickets/tickets-filter-layout";
import { TicketsPageHeader } from "@/components/tickets/tickets-page-header";
import { useAgentDirectory } from "@/hooks/useAgentDirectory";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMassActionSelection } from "@/hooks/useMassActionSelection";
import { useTicketFilters } from "@/hooks/useTicketFilters";
import { useTicketList } from "@/hooks/useTicketList";
import { useTicketListPrefetch } from "@/hooks/useTicketListPrefetch";
import { deriveStatusSummaryFromTickets } from "@/types/ticket-status-summary";

function TicketsPageInner() {
  const {
    filterId,
    bucket,
    scope,
    offset,
    limit,
    waitingSort,
    selectedBucketLabel,
    buildTicketDetailHref,
    handlePageChange,
    handleLimitChange,
    handleWaitingSortChange,
  } = useTicketFilters();

  const massActionSelection = useMassActionSelection();
  const prefetchTicketList = useTicketListPrefetch();

  useAgentDirectory(1);

  const ticketListQuery = useTicketList({
    filterId,
    bucket,
    scope,
    offset,
    limit,
    waitingSort,
  });

  const tickets = ticketListQuery.data?.tickets ?? [];
  const totalCount = ticketListQuery.data?.totalCount ?? 0;

  const summary = ticketListQuery.data?.statusSummary
    ? {
        ...ticketListQuery.data.statusSummary,
        total: totalCount || ticketListQuery.data.statusSummary.total,
      }
    : deriveStatusSummaryFromTickets(tickets, totalCount);

  useEffect(() => {
    if (!bucket || !ticketListQuery.isSuccess || !ticketListQuery.data) {
      return;
    }

    const nextOffset = offset + limit;
    if (nextOffset >= ticketListQuery.data.totalCount) {
      return;
    }

    prefetchTicketList({
      filterId,
      bucket,
      scope,
      offset: nextOffset,
      limit,
      waitingSort,
    });
  }, [
    bucket,
    filterId,
    limit,
    offset,
    prefetchTicketList,
    scope,
    ticketListQuery.data,
    ticketListQuery.isSuccess,
    waitingSort,
  ]);

  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1">
        <TicketsPageHeader subtitle={selectedBucketLabel} />

        {selectedBucketLabel ? (
          <TicketSummaryCards
            summary={summary}
            isLoading={ticketListQuery.isLoading}
          />
        ) : null}

        <TicketListPanel
          tickets={tickets}
          totalCount={totalCount}
          offset={ticketListQuery.data?.offset ?? offset}
          limit={limit}
          selectedBucketLabel={selectedBucketLabel}
          selectedIds={massActionSelection.selectedTicketIds}
          isLoading={ticketListQuery.isLoading}
          isFetching={ticketListQuery.isFetching}
          errorMessage={
            ticketListQuery.isError ? "Failed to load tickets." : null
          }
          buildTicketHref={buildTicketDetailHref}
          onToggleTicket={massActionSelection.toggleTicket}
          onToggleAll={massActionSelection.toggleAll}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          waitingSort={waitingSort}
          onWaitingSortChange={handleWaitingSortChange}
        />
      </div>

      {massActionSelection.panelOpen ? (
        <MassActionsPanel selection={massActionSelection} />
      ) : null}
    </div>
  );
}

function TicketsPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const { buildTicketDetailHref } = useTicketFilters();

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.trim().length > 0) {
      setSearchOpen(true);
    }
  }, []);

  const handleSearchFocus = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, []);

  return (
    <>
      <TicketsFilterLayout
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchFocus={handleSearchFocus}
      >
        <TicketsPageInner />
      </TicketsFilterLayout>

      <TicketSearchPanel
        open={searchOpen}
        searchTerm={searchQuery}
        debouncedTerm={debouncedSearch}
        onSearchChange={handleSearchChange}
        onClose={handleSearchClose}
        buildTicketHref={buildTicketDetailHref}
      />
    </>
  );
}

function TicketsPageFallback() {
  return (
    <TicketsFilterLayout>
      <div className="h-80 animate-pulse rounded-xl bg-surface-muted" />
    </TicketsFilterLayout>
  );
}

export function TicketsPageShell() {
  return (
    <Suspense fallback={<TicketsPageFallback />}>
      <TicketsPageContent />
    </Suspense>
  );
}
