import axios from "axios";
import { DeskproClient } from "@/lib/deskpro-client";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import {
  normalizeTicketFilterCounts,
  type TicketFilterCountsResponse,
} from "@/types/ticket-filter-count";

const TICKET_FILTER_COUNT_PAYLOAD = [
  {
    operationName: "TicketFilterCount",
    variables: {
      filterId: "4",
      groupBy: [{ enum: "date_user_waiting" }],
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash:
          "3703cb91e14aaae5341e5ebb9aa09f95706a456a61e406b4528d3299ca04c71b",
      },
    },
  },
  {
    operationName: "TicketFilterCount",
    variables: {
      filterId: "13",
      groupBy: [{ enum: "sla_severity" }],
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash:
          "3703cb91e14aaae5341e5ebb9aa09f95706a456a61e406b4528d3299ca04c71b",
      },
    },
  },
] as const;

export async function fetchTicketFilterCounts(): Promise<TicketFilterCountsResponse> {
  try {
    const client = await DeskproClient.fromSession();
    const data = await client.post<unknown>(
      "/graphql/TicketFilterCount,TicketFilterCount",
      TICKET_FILTER_COUNT_PAYLOAD,
    );

    return normalizeTicketFilterCounts(data);
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof DeskproTimeoutError
    ) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      console.error(
        "[TicketFilterCount] HTTP error:",
        error.response?.status,
        error.response?.data,
      );
      throw new Error("Failed to fetch ticket filter counts");
    }

    throw error;
  }
}
