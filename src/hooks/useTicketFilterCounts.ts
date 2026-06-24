"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { TicketFilterCountsResponse } from "@/types/ticket-filter-count";
import type { TicketScope } from "@/types/ticket-list";

export type TicketFilterCountsQueryParams = {
  scope: TicketScope;
};

async function fetchTicketFilterCounts(
  params: TicketFilterCountsQueryParams,
): Promise<TicketFilterCountsResponse> {
  const { data } = await axios.get<TicketFilterCountsResponse>(
    "/api/deskpro/tickets/filter-counts",
    {
      params: {
        scope: params.scope === "mine" ? "mine" : undefined,
      },
    },
  );
  return data;
}

export function useTicketFilterCounts(params: TicketFilterCountsQueryParams) {
  return useQuery({
    queryKey: ["tickets", "filter-counts", params],
    queryFn: () => fetchTicketFilterCounts(params),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
