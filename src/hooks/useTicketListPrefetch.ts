"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  fetchTicketListClient,
  getTicketListQueryKey,
  TICKET_LIST_STALE_TIME_MS,
  type TicketListQueryParams,
} from "@/lib/ticket-list-client";

export function useTicketListPrefetch() {
  const queryClient = useQueryClient();

  return useCallback(
    (params: TicketListQueryParams) => {
      if (!params.bucket) {
        return;
      }

      void queryClient.prefetchQuery({
        queryKey: getTicketListQueryKey(params),
        queryFn: () => fetchTicketListClient(params),
        staleTime: TICKET_LIST_STALE_TIME_MS,
      });
    },
    [queryClient],
  );
}
