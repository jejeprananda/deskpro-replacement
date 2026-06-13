"use client";

import { Suspense } from "react";
import { TicketsFilterLayout } from "@/components/tickets/tickets-filter-layout";
import { TicketListPanel } from "@/components/tickets/ticket-list-panel";
import { useTicketFilters } from "@/hooks/useTicketFilters";
import { useTicketList } from "@/hooks/useTicketList";

function TicketsPageInner() {
  const {
    filterId,
    bucket,
    offset,
    limit,
    selectedBucketLabel,
    buildTicketDetailHref,
    handlePreviousPage,
    handleNextPage,
  } = useTicketFilters();

  const ticketListQuery = useTicketList({
    filterId,
    bucket,
    offset,
    limit,
  });

  return (
    <TicketListPanel
      tickets={ticketListQuery.data?.tickets ?? []}
      totalCount={ticketListQuery.data?.totalCount ?? 0}
      offset={ticketListQuery.data?.offset ?? offset}
      limit={ticketListQuery.data?.limit ?? limit}
      selectedBucketLabel={selectedBucketLabel}
      isLoading={ticketListQuery.isLoading || ticketListQuery.isFetching}
      errorMessage={ticketListQuery.isError ? "Failed to load tickets." : null}
      buildTicketHref={buildTicketDetailHref}
      onPreviousPage={handlePreviousPage}
      onNextPage={handleNextPage}
    />
  );
}

function TicketsPageFallback() {
  return (
    <TicketsFilterLayout title="Tickets">
      <div className="h-80 animate-pulse rounded-xl bg-zinc-100" />
    </TicketsFilterLayout>
  );
}

export function TicketsPageShell() {
  return (
    <Suspense fallback={<TicketsPageFallback />}>
      <TicketsFilterLayout title="Tickets">
        <TicketsPageInner />
      </TicketsFilterLayout>
    </Suspense>
  );
}
