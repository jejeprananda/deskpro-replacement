"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { TicketDetailResponse } from "@/types/ticket-detail";

export type TicketDetailQueryParams = {
  ticketId: string;
  ownerId?: string | null;
};

async function fetchTicketDetail(
  params: TicketDetailQueryParams,
): Promise<TicketDetailResponse> {
  const { data } = await axios.get<TicketDetailResponse>(
    `/api/deskpro/tickets/${params.ticketId}`,
    {
      params: {
        ownerId: params.ownerId ?? undefined,
      },
    },
  );
  return data;
}

export function useTicketDetail(params: TicketDetailQueryParams) {
  return useQuery({
    queryKey: ["tickets", "detail", params.ticketId, params.ownerId],
    queryFn: () => fetchTicketDetail(params),
    enabled: Boolean(params.ticketId),
  });
}
