import axios from "axios";
import { DeskproClient } from "@/lib/deskpro-client";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import {
  normalizeTicketDetail,
  type TicketDetailResponse,
} from "@/types/ticket-detail";

const LOAD_TICKET_FIELD_VALUES_HASH =
  "70becfbf81d32c6f48c842e690fb4648827bf79226f45e6e41d6dcfbce36a7ec";
const TICKET_MACROS_HASH =
  "6561bff29468fac0201b7fadf75d00ec12ee40101e04d56b11103e58dd29ca65";
const TICKET_MESSAGES_HASH =
  "cd104034891c651e88cc8062d6b8791f39b185b55e31f9e1ae1ead1e48b142b6";

export type FetchTicketDetailParams = {
  ticketId: string;
  ownerId?: string;
};

function buildTicketDetailPayload(params: FetchTicketDetailParams) {
  return [
    {
      operationName: "LoadTicketFieldValues",
      variables: {
        ticketId: params.ticketId,
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: LOAD_TICKET_FIELD_VALUES_HASH,
        },
      },
    },
    {
      operationName: "TicketMacros",
      variables: {
        ticketId: params.ticketId,
        ownerId: params.ownerId ?? "",
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: TICKET_MACROS_HASH,
        },
      },
    },
    {
      operationName: "TicketMessages",
      variables: {
        order: "DESC",
        ticketId: params.ticketId,
        first: 15,
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: TICKET_MESSAGES_HASH,
        },
      },
    },
  ];
}

export async function fetchTicketDetail(
  params: FetchTicketDetailParams,
): Promise<TicketDetailResponse> {
  try {
    const client = await DeskproClient.fromSession();
    const data = await client.post<unknown>(
      "/graphql/LoadTicketFieldValues,TicketMacros,TicketMessages",
      buildTicketDetailPayload(params),
    );

    return normalizeTicketDetail(data, params.ticketId);
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof DeskproTimeoutError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      console.error(
        "[TicketDetail] HTTP error:",
        error.response?.status,
        error.response?.data,
      );
      throw new Error("Failed to fetch ticket detail");
    }

    throw error;
  }
}
