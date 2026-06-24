"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchTicketListClient,
  getTicketListQueryKey,
  TICKET_LIST_GC_TIME_MS,
  TICKET_LIST_STALE_TIME_MS,
  type TicketListQueryParams,
} from "@/lib/ticket-list-client";

export type { TicketListQueryParams } from "@/lib/ticket-list-client";
export { fetchTicketListClient } from "@/lib/ticket-list-client";

export function useTicketList(params: TicketListQueryParams) {
  return useQuery({
    queryKey: getTicketListQueryKey(params),
    queryFn: () => fetchTicketListClient(params),
    enabled: (params.enabled ?? true) && Boolean(params.bucket),
    staleTime: TICKET_LIST_STALE_TIME_MS,
    gcTime: TICKET_LIST_GC_TIME_MS,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}
