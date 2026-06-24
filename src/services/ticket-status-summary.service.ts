import axios from "axios";
import { DeskproClient } from "@/lib/deskpro-client";
import {
  buildMyTicketBucketFql,
  getBucketFql,
  isDateUserWaitingBucket,
} from "@/lib/ticket-filter-labels";
import { getSession } from "@/lib/session";
import { DeskproTimeoutError, InvalidTicketBucketError, UnauthorizedError } from "@/lib/errors";
import {
  normalizeTicketStatusSummary,
  type TicketStatusSummary,
} from "@/types/ticket-status-summary";
import type { TicketScope } from "@/types/ticket-list";

const TICKET_FILTER_COUNT_HASH =
  "3703cb91e14aaae5341e5ebb9aa09f95706a456a61e406b4528d3299ca04c71b";

export type FetchTicketStatusSummaryParams = {
  filterId: string;
  bucket?: string;
  scope?: TicketScope;
};

export function buildStatusSummaryPayload(params: {
  filterId: string;
  fql: string;
}) {
  return {
    operationName: "TicketFilterCount",
    variables: {
      filterId: params.filterId,
      groupBy: [{ enum: "status" }],
      fql: params.fql,
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: TICKET_FILTER_COUNT_HASH,
      },
    },
  };
}

export async function fetchTicketStatusSummary(
  params: FetchTicketStatusSummaryParams,
): Promise<TicketStatusSummary> {
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

  try {
    const client = await DeskproClient.fromSession();
    const payload = buildStatusSummaryPayload({
      filterId: params.filterId,
      fql,
    });
    const data = await client.post<unknown>("/graphql/TicketFilterCount", payload);

    return normalizeTicketStatusSummary(data);
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
        "[TicketStatusSummary] HTTP error:",
        error.response?.status,
        error.response?.data,
      );
      throw new Error("Failed to fetch ticket status summary");
    }

    throw error;
  }
}
