import axios from "axios";
import {
  enrichTicketListAgents,
  resolveAgentNames,
} from "@/services/agent-directory.service";
import { DeskproClient } from "@/lib/deskpro-client";
import {
  buildMyTicketBucketFql,
  getBucketFql,
  isDateUserWaitingBucket,
} from "@/lib/ticket-filter-labels";
import { getSession } from "@/lib/session";
import {
  DeskproTimeoutError,
  InvalidTicketBucketError,
  UnauthorizedError,
} from "@/lib/errors";
import {
  normalizeTicketListResponse,
  shouldEnrichAssignedAgent,
  type TicketListResponse,
  type TicketScope,
} from "@/types/ticket-list";

const TICKET_FQL_GROUPED_HASH =
  "11288e1444e6bf010469f31f709992d5feab70c550d51f3c0b8791b2e95b59cc";

export type FetchTicketListParams = {
  filterId: string;
  bucket?: string;
  scope?: TicketScope;
  offset: number;
  limit: number;
  waitingSort?: "asc" | "desc";
};

export { InvalidTicketBucketError } from "@/lib/errors";

function buildTicketFqlGroupedPayload(params: {
  filterId: string;
  fql: string;
  offset: number;
  limit: number;
  waitingSort?: "asc" | "desc";
}) {
  const orderBy = params.waitingSort
    ? {
        fieldId: "ticket.date_user_waiting",
        order: params.waitingSort.toUpperCase() as "ASC" | "DESC",
      }
    : { fieldId: "ticket.id", order: "DESC" as const };

  return {
    operationName: "TicketFqlGrouped",
    variables: {
      groupBy: { fieldId: "@none", order: "ASC" },
      orderBy,
      limit: params.limit,
      offset: params.offset,
      fql: params.fql,
      filterId: params.filterId,
      enableArchiveMode: false,
      loadPersonData: false,
      loadOrganizationData: false,
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: TICKET_FQL_GROUPED_HASH,
      },
    },
  };
}

export async function fetchTicketList(
  params: FetchTicketListParams,
): Promise<TicketListResponse> {
  if (!params.bucket || !isDateUserWaitingBucket(params.bucket)) {
    throw new InvalidTicketBucketError(params.bucket ?? "");
  }

  let fql: string;

  if (params.scope === "mine") {
    const session = await getSession();
    if (!session.authenticated || !session.agentId) {
      throw new UnauthorizedError("Agent session required");
    }
    fql = buildMyTicketBucketFql(params.bucket, session.agentId);
  } else {
    fql = getBucketFql(params.bucket);
  }

  const payload = buildTicketFqlGroupedPayload({
    filterId: params.filterId,
    fql,
    offset: params.offset,
    limit: params.limit,
    waitingSort: params.waitingSort,
  });

  try {
    const client = await DeskproClient.fromSession();
    const data = await client.post<unknown>(
      "/graphql/TicketFqlGrouped",
      payload,
    );

    const response = normalizeTicketListResponse(
      data,
      params.offset,
      params.limit,
    );

    const agentIds = response.tickets
      .filter(shouldEnrichAssignedAgent)
      .map((ticket) => ticket.agentId)
      .filter((agentId): agentId is string => agentId != null);

    if (agentIds.length === 0) {
      return response;
    }

    const agentNames = await resolveAgentNames(agentIds);

    return {
      ...response,
      tickets: enrichTicketListAgents(response.tickets, agentNames),
    };
  } catch (error) {
    if (
      error instanceof InvalidTicketBucketError ||
      error instanceof UnauthorizedError ||
      error instanceof DeskproTimeoutError
    ) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      console.error(
        "[TicketFqlGrouped] HTTP error:",
        error.response?.status,
        error.response?.data,
      );
      throw new Error("Failed to fetch ticket list");
    }

    throw error;
  }
}
