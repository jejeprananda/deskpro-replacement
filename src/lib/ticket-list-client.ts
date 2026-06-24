import axios from "axios";
import type { TicketListResponse, TicketScope, WaitingSort } from "@/types/ticket-list";

export const TICKET_LIST_STALE_TIME_MS = 3 * 60 * 1000;
export const TICKET_LIST_GC_TIME_MS = 10 * 60 * 1000;

export type TicketListQueryParams = {
  filterId: string;
  bucket: string | null;
  scope: TicketScope;
  offset: number;
  limit: number;
  waitingSort: WaitingSort | null;
  enabled?: boolean;
};

export function getTicketListQueryKey(params: TicketListQueryParams) {
  return ["tickets", "list", params] as const;
}

export async function fetchTicketListClient(
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
