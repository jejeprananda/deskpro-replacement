"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { TicketFilterCountsResponse } from "@/types/ticket-filter-count";

async function fetchTicketFilterCounts(): Promise<TicketFilterCountsResponse> {
  const { data } = await axios.get<TicketFilterCountsResponse>(
    "/api/deskpro/tickets/filter-counts",
  );
  return data;
}

export function useTicketFilterCounts() {
  return useQuery({
    queryKey: ["tickets", "filter-counts"],
    queryFn: fetchTicketFilterCounts,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
