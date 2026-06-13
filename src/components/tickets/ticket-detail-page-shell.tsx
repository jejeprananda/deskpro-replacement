"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { TicketsFilterLayout } from "@/components/tickets/tickets-filter-layout";
import { TicketDetailView } from "@/components/tickets/ticket-detail-view";
import { useTicketDetail } from "@/hooks/useTicketDetail";
import { useTicketFilters } from "@/hooks/useTicketFilters";

function TicketDetailPageInner() {
  const params = useParams<{ ticketId: string }>();
  const searchParams = useSearchParams();
  const { buildTicketsListHref } = useTicketFilters();

  const ticketId = params.ticketId;
  const ownerId = searchParams.get("ownerId");
  const ticketRef = searchParams.get("ref");
  const ticketSubject = searchParams.get("subject");

  const detailQuery = useTicketDetail({
    ticketId,
    ownerId,
  });

  return (
    <TicketDetailView
      ticketId={ticketId}
      ownerId={ownerId}
      ticketRef={ticketRef}
      ticketSubject={ticketSubject}
      backHref={buildTicketsListHref()}
      detail={detailQuery.data}
      isLoading={detailQuery.isLoading}
      errorMessage={
        detailQuery.isError ? "Failed to load ticket detail." : null
      }
    />
  );
}

function TicketDetailPageFallback() {
  return (
    <TicketsFilterLayout title="Ticket Detail">
      <div className="h-80 animate-pulse rounded-xl bg-zinc-100" />
    </TicketsFilterLayout>
  );
}

export function TicketDetailPageShell() {
  return (
    <Suspense fallback={<TicketDetailPageFallback />}>
      <TicketsFilterLayout title="Ticket Detail">
        <TicketDetailPageInner />
      </TicketsFilterLayout>
    </Suspense>
  );
}
