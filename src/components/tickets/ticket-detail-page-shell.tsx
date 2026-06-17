"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { TicketsFilterLayout } from "@/components/tickets/tickets-filter-layout";
import { TicketDetailView } from "@/components/tickets/ticket-detail-view";
import { useTicketDetail } from "@/hooks/useTicketDetail";
import { useTicketFilters } from "@/hooks/useTicketFilters";
import {
  buildTicketDetailHeaderMeta,
  mergeTicketDetailHeaderMeta,
  parseUrgencyParam,
  type TicketDetailHeaderPatch,
} from "@/lib/ticket-detail-header";

function TicketDetailPageInner() {
  const params = useParams<{ ticketId: string }>();
  const searchParams = useSearchParams();
  const { buildTicketsListHref } = useTicketFilters();
  const [headerPatches, setHeaderPatches] = useState<
    Record<string, TicketDetailHeaderPatch>
  >({});

  const ticketId = params.ticketId;
  const ownerId = searchParams.get("ownerId");
  const headerPatch = headerPatches[ticketId] ?? null;

  const detailQuery = useTicketDetail({
    ticketId,
    ownerId,
  });

  const headerMeta = useMemo(() => {
    const baseMeta = buildTicketDetailHeaderMeta({
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
    });

    return mergeTicketDetailHeaderMeta(baseMeta, headerPatch);
  }, [detailQuery.data?.summary, headerPatch, searchParams, ticketId]);

  const handleTicketActionsApplied = useCallback(
    (patch: TicketDetailHeaderPatch) => {
      setHeaderPatches((current) => ({
        ...current,
        [ticketId]: { ...current[ticketId], ...patch },
      }));
    },
    [ticketId],
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
      onTicketActionsApplied={handleTicketActionsApplied}
    />
  );
}

function TicketDetailPageFallback() {
  return (
    <TicketsFilterLayout>
      <div className="h-80 animate-pulse rounded-xl bg-surface-muted" />
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
