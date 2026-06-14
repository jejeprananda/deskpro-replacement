"use client";

import { Suspense, useMemo, useState } from "react";
import { MassActionsPanel } from "@/components/tickets/mass-actions-panel";
import { TicketsFilterLayout } from "@/components/tickets/tickets-filter-layout";
import { TicketListPanel } from "@/components/tickets/ticket-list-panel";
import { TicketSummaryCards } from "@/components/tickets/ticket-summary-cards";
import { TicketsPageHeader } from "@/components/tickets/tickets-page-header";
import { useMassActionSelection } from "@/hooks/useMassActionSelection";
import { useTicketFilters } from "@/hooks/useTicketFilters";
import { useTicketList } from "@/hooks/useTicketList";
import { useTicketStatusSummary } from "@/hooks/useTicketStatusSummary";
import { deriveStatusSummaryFromTickets } from "@/types/ticket-status-summary";
import type { TicketListItem } from "@/types/ticket-list";

function filterTicketsBySearch(
  tickets: TicketListItem[],
  query: string,
): TicketListItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return tickets;
  }

  return tickets.filter((ticket) => {
    const haystack = [
      ticket.ref,
      ticket.subject,
      ticket.assignedAgent,
      ticket.person?.name,
      ticket.person?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

function TicketsPageInner({ searchQuery }: { searchQuery: string }) {
  const {
    filterId,
    bucket,
    offset,
    limit,
    selectedBucketLabel,
    buildTicketDetailHref,
    handlePageChange,
    handleLimitChange,
  } = useTicketFilters();

  const massActionSelection = useMassActionSelection();

  const ticketListQuery = useTicketList({
    filterId,
    bucket,
    offset,
    limit,
  });

  const statusSummaryQuery = useTicketStatusSummary({
    filterId,
    bucket,
  });

  const tickets = useMemo(
    () => ticketListQuery.data?.tickets ?? [],
    [ticketListQuery.data?.tickets],
  );
  const totalCount = ticketListQuery.data?.totalCount ?? 0;
  const filteredTickets = useMemo(
    () => filterTicketsBySearch(tickets, searchQuery),
    [searchQuery, tickets],
  );

  const summary = useMemo(() => {
    if (statusSummaryQuery.data) {
      return {
        ...statusSummaryQuery.data,
        total: totalCount || statusSummaryQuery.data.total,
      };
    }

    return deriveStatusSummaryFromTickets(tickets, totalCount);
  }, [statusSummaryQuery.data, tickets, totalCount]);

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1">
        <TicketsPageHeader subtitle={selectedBucketLabel} />

        {selectedBucketLabel ? (
          <TicketSummaryCards
            summary={summary}
            isLoading={
              ticketListQuery.isFetching &&
              (statusSummaryQuery.isFetching || !statusSummaryQuery.data)
            }
          />
        ) : null}

        <TicketListPanel
          tickets={filteredTickets}
          totalCount={isSearchActive ? filteredTickets.length : totalCount}
          offset={isSearchActive ? 0 : (ticketListQuery.data?.offset ?? offset)}
          limit={isSearchActive ? Math.max(filteredTickets.length, 1) : limit}
          selectedBucketLabel={selectedBucketLabel}
          selectedIds={massActionSelection.selectedTicketIds}
          isFetching={ticketListQuery.isFetching}
          errorMessage={
            ticketListQuery.isError ? "Failed to load tickets." : null
          }
          buildTicketHref={buildTicketDetailHref}
          onToggleTicket={massActionSelection.toggleTicket}
          onToggleAll={massActionSelection.toggleAll}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
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

  return (
    <TicketsFilterLayout
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <TicketsPageInner searchQuery={searchQuery} />
    </TicketsFilterLayout>
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
