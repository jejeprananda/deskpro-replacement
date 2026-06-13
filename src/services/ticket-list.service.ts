import axios from "axios";
import { DeskproClient } from "@/lib/deskpro-client";
import { getBucketFql, isDateUserWaitingBucket } from "@/lib/ticket-filter-labels";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import {
  normalizeTicketListResponse,
  type TicketListResponse,
} from "@/types/ticket-list";

const TICKET_FQL_GROUPED_HASH =
  "11288e1444e6bf010469f31f709992d5feab70c550d51f3c0b8791b2e95b59cc";

export type FetchTicketListParams = {
  filterId: string;
  bucket: string;
  offset: number;
  limit: number;
};

export class InvalidTicketBucketError extends Error {
  constructor(bucket: string) {
    super(`Unknown ticket bucket: ${bucket}`);
    this.name = "InvalidTicketBucketError";
  }
}

function buildTicketFqlGroupedPayload(params: {
  filterId: string;
  fql: string;
  offset: number;
  limit: number;
}) {
  return {
    operationName: "TicketFqlGrouped",
    variables: {
      groupBy: { fieldId: "@none", order: "ASC" },
      orderBy: { fieldId: "ticket.id", order: "DESC" },
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
  if (!isDateUserWaitingBucket(params.bucket)) {
    throw new InvalidTicketBucketError(params.bucket);
  }

  const payload = buildTicketFqlGroupedPayload({
    filterId: params.filterId,
    fql: getBucketFql(params.bucket),
    offset: params.offset,
    limit: params.limit,
  });

  try {
    const client = await DeskproClient.fromSession();
    const data = await client.post<unknown>(
      "/graphql/TicketFqlGrouped",
      payload,
    );

    return normalizeTicketListResponse(data, params.offset, params.limit);
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
