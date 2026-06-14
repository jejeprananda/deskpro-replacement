"use client";

import { Suspense, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { TicketsFilterLayout } from "@/components/tickets/tickets-filter-layout";
import { TicketDetailView } from "@/components/tickets/ticket-detail-view";
import { useTicketDetail } from "@/hooks/useTicketDetail";
import { useTicketFilters } from "@/hooks/useTicketFilters";
import {
  buildTicketDetailHeaderMeta,
  parseUrgencyParam,
} from "@/lib/ticket-detail-header";

function TicketDetailPageInner() {
  const params = useParams<{ ticketId: string }>();
  const searchParams = useSearchParams();
  const { buildTicketsListHref } = useTicketFilters();

  const ticketId = params.ticketId;
  const ownerId = searchParams.get("ownerId");

  const detailQuery = useTicketDetail({
    ticketId,
    ownerId,
  });

  const headerMeta = useMemo(
    () =>
      buildTicketDetailHeaderMeta({
        urlParams: {
          ref: searchParams.get("ref"),
          subject: searchParams.get("subject"),
          status: searchParams.get("status"),
          urgency: parseUrgencyParam(searchParams.get("urgency")),
          dateCreated: searchParams.get("dateCreated"),
          requester: searchParams.get("requester"),
          assignedAgent: searchParams.get("assignedAgent"),
        },
        summary: detailQuery.data?.summary,
        fallbackRef: ticketId,
        fallbackSubject: "Loading ticket...",
      }),
    [detailQuery.data?.summary, searchParams, ticketId],
  );

  return (
    <TicketDetailView
      ticketId={ticketId}
      ownerId={ownerId}
      headerMeta={headerMeta}
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
    <TicketsFilterLayout>
      <div className="h-80 animate-pulse rounded-xl bg-zinc-100" />
    </TicketsFilterLayout>
  );
}

export function TicketDetailPageShell() {
  return (
    <Suspense fallback={<TicketDetailPageFallback />}>
      <TicketsFilterLayout>
        <TicketDetailPageInner />
      </TicketsFilterLayout>
    </Suspense>
  );
}
