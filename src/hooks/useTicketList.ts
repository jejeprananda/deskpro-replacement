"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { TicketListResponse, TicketScope, WaitingSort } from "@/types/ticket-list";

export type TicketListQueryParams = {
  filterId: string;
  bucket: string | null;
  scope: TicketScope;
  offset: number;
  limit: number;
  waitingSort: WaitingSort | null;
  enabled?: boolean;
};

async function fetchTicketList(
  params: TicketListQueryParams,
): Promise<TicketListResponse> {
  const { data } = await axios.get<TicketListResponse>("/api/deskpro/tickets", {
    params: {
      filterId: params.filterId,
      bucket: params.bucket,
      scope: params.scope === "mine" ? "mine" : undefined,
      offset: params.offset,
      limit: params.limit,
      ...(params.waitingSort ? { waitingSort: params.waitingSort } : {}),
    },
  });
  return data;
}

export function useTicketList(params: TicketListQueryParams) {
  return useQuery({
    queryKey: ["tickets", "list", params],
    queryFn: () => fetchTicketList(params),
    enabled: (params.enabled ?? true) && Boolean(params.bucket),
    placeholderData: (previousData, previousQuery) => {
      const prev = previousQuery?.queryKey[2] as
        | TicketListQueryParams
        | undefined;
      if (
        prev &&
        prev.filterId === params.filterId &&
        prev.bucket === params.bucket &&
        prev.scope === params.scope
      ) {
        return previousData;
      }
      return undefined;
    },
  });
}
