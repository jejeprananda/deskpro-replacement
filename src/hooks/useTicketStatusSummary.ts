"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { TicketStatusSummaryResponse } from "@/types/ticket-status-summary";

export type TicketStatusSummaryQueryParams = {
  filterId: string;
  bucket: string | null;
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
      },
    },
  );
  return data;
}

export function useTicketStatusSummary(params: TicketStatusSummaryQueryParams) {
  return useQuery({
    queryKey: ["tickets", "status-summary", params],
    queryFn: () => fetchTicketStatusSummary(params),
    enabled: Boolean(params.bucket),
    retry: false,
  });
}
