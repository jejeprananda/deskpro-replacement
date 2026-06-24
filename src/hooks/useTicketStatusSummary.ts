"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { TicketStatusSummaryResponse } from "@/types/ticket-status-summary";

import type { TicketScope } from "@/types/ticket-list";

export type TicketStatusSummaryQueryParams = {
  filterId: string;
  bucket: string | null;
  scope: TicketScope;
  enabled?: boolean;
};

async function fetchTicketStatusSummary(
  params: TicketStatusSummaryQueryParams,
): Promise<TicketStatusSummaryResponse> {
  const { data } = await axios.get<TicketStatusSummaryResponse>(
    "/api/deskpro/tickets/status-summary",
    {
      params: {
        filterId: params.filterId,
        bucket: params.bucket,
        scope: params.scope === "mine" ? "mine" : undefined,
      },
    },
  );
  return data;
}

export function useTicketStatusSummary(params: TicketStatusSummaryQueryParams) {
  return useQuery({
    queryKey: ["tickets", "status-summary", params],
    queryFn: () => fetchTicketStatusSummary(params),
    enabled: (params.enabled ?? true) && Boolean(params.bucket),
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
