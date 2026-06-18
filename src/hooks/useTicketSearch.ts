"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { TicketListResponse } from "@/types/ticket-list";

const MIN_SEARCH_LENGTH = 2;
const DEFAULT_PER_PAGE = 250;

export type TicketSearchParams = {
  searchTerm: string;
};

async function fetchTicketSearch(
  searchTerm: string,
): Promise<TicketListResponse> {
  const { data } = await axios.get<TicketListResponse>(
    "/api/deskpro/tickets/search",
    {
      params: {
        q: searchTerm,
        perPage: DEFAULT_PER_PAGE,
      },
    },
  );
  return data;
}

export function useTicketSearch({ searchTerm }: TicketSearchParams) {
  const normalizedTerm = searchTerm.trim();

  return useQuery({
    queryKey: ["tickets", "search", normalizedTerm],
    queryFn: () => fetchTicketSearch(normalizedTerm),
    enabled: normalizedTerm.length >= MIN_SEARCH_LENGTH,
    retry: false,
  });
}

export { MIN_SEARCH_LENGTH };
