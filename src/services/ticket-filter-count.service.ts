import axios from "axios";
import { DeskproClient } from "@/lib/deskpro-client";
import { buildAssignedAgentFql } from "@/lib/ticket-filter-labels";
import { getSession } from "@/lib/session";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import {
  normalizeTicketFilterCounts,
  type TicketFilterCountsResponse,
} from "@/types/ticket-filter-count";
import type { TicketScope } from "@/types/ticket-list";

const TICKET_FILTER_COUNT_HASH =
  "3703cb91e14aaae5341e5ebb9aa09f95706a456a61e406b4528d3299ca04c71b";

export type FetchTicketFilterCountsParams = {
  scope?: TicketScope;
};

function buildFilterCountPayload(params: { agentFql?: string }) {
  return [
    {
      operationName: "TicketFilterCount",
      variables: {
        filterId: "4",
        groupBy: [{ enum: "date_user_waiting" }],
        ...(params.agentFql ? { fql: params.agentFql } : {}),
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: TICKET_FILTER_COUNT_HASH,
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
          sha256Hash: TICKET_FILTER_COUNT_HASH,
        },
      },
    },
  ] as const;
}

export async function fetchTicketFilterCounts(
  params: FetchTicketFilterCountsParams = {},
): Promise<TicketFilterCountsResponse> {
  let agentFql: string | undefined;

  if (params.scope === "mine") {
    const session = await getSession();
    if (!session.authenticated || !session.agentId) {
      throw new UnauthorizedError("Agent session required");
    }
    agentFql = buildAssignedAgentFql(session.agentId);
  }

  try {
    const client = await DeskproClient.fromSession();
    const data = await client.post<unknown>(
      "/graphql/TicketFilterCount,TicketFilterCount",
      buildFilterCountPayload({ agentFql }),
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
