import axios from "axios";
import { DeskproClient } from "@/lib/deskpro-client";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import {
  normalizeTicketSearchResponse,
  type TicketSearchQueryParams,
} from "@/types/ticket-search";
import type { TicketListResponse } from "@/types/ticket-list";

const SEARCH_APP_TICKETS_HASH =
  "7614d19a45ff83827b4fe666610ee897a8ab104399dad291de51674b04739a20";

function buildSearchAppTicketsPayload(params: TicketSearchQueryParams) {
  return {
    operationName: "SearchAppTickets",
    variables: {
      perPage: params.perPage,
      searchTerm: params.q,
      sort: "date_updated",
      labels: [],
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: SEARCH_APP_TICKETS_HASH,
      },
    },
  };
}

export async function fetchTicketSearch(
  params: TicketSearchQueryParams,
): Promise<TicketListResponse> {
  try {
    const client = await DeskproClient.fromSession();
    const data = await client.post<unknown>(
      "/graphql/SearchAppTickets",
      buildSearchAppTicketsPayload(params),
    );

    return normalizeTicketSearchResponse(data, params.perPage);
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof DeskproTimeoutError
    ) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      console.error(
        "[SearchAppTickets] HTTP error:",
        error.response?.status,
        error.response?.data,
      );
      throw new Error("Failed to search tickets");
    }

    throw error;
  }
}
