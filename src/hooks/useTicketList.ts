"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { TicketListResponse } from "@/types/ticket-list";

export type TicketListQueryParams = {
  filterId: string;
  bucket: string | null;
  offset: number;
  limit: number;
};

async function fetchTicketList(
  params: TicketListQueryParams,
): Promise<TicketListResponse> {
  const { data } = await axios.get<TicketListResponse>("/api/deskpro/tickets", {
    params: {
      filterId: params.filterId,
      bucket: params.bucket,
      offset: params.offset,
      limit: params.limit,
    },
  });
  return data;
}

export function useTicketList(params: TicketListQueryParams) {
  return useQuery({
    queryKey: ["tickets", "list", params],
    queryFn: () => fetchTicketList(params),
    enabled: Boolean(params.bucket),
    placeholderData: (previousData, previousQuery) => {
      const prev = previousQuery?.queryKey[2] as
        | TicketListQueryParams
        | undefined;
      if (
        prev &&
        prev.filterId === params.filterId &&
        prev.bucket === params.bucket
      ) {
        return previousData;
      }
      return undefined;
    },
  });
}
