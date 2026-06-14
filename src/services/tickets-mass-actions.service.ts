import axios from "axios";
import { DeskproClient } from "@/lib/deskpro-client";
import { getDeskproTicketsMassActionsGraphqlPath } from "@/lib/deskpro-endpoints";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import {
  buildTicketsMassActionParams,
  type MassActionStep,
  type SubmitTicketsMassActionsResponse,
} from "@/types/mass-action";

const TICKETS_MASS_ACTIONS_HASH =
  "6cd8ea1be10ba3e6e8f7c0d64e2ed1a5685a74c404df04746f26fe9d65298964";

export type SubmitTicketsMassActionsParams = {
  ids: string[];
  steps: MassActionStep[];
};

function collectGraphqlErrors(data: unknown): unknown[] {
  const errors: unknown[] = [];

  function walk(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    if (typeof value !== "object" || value == null) {
      return;
    }

    if (Array.isArray((value as { errors?: unknown[] }).errors)) {
      errors.push(...((value as { errors: unknown[] }).errors ?? []));
    }

    if ("data" in value && typeof value.data === "object") {
      walk(value.data);
    }
  }

  walk(data);
  return errors;
}

function formatGraphqlErrors(errors: unknown[]): string {
  const messages = errors
    .map((error) => {
      if (typeof error === "object" && error != null && "message" in error) {
        return String((error as { message: unknown }).message);
      }

      return null;
    })
    .filter((message): message is string => Boolean(message));

  return messages.length > 0 ? messages.join("; ") : "Unknown GraphQL error";
}

function summarizeResponse(data: unknown): string {
  try {
    return JSON.stringify(data).slice(0, 300);
  } catch {
    return String(data);
  }
}

function buildTicketsMassActionsPayload(params: SubmitTicketsMassActionsParams) {
  return {
    operationName: "TicketsMassActions",
    variables: {
      ids: params.ids,
      params: buildTicketsMassActionParams(params.steps),
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: TICKETS_MASS_ACTIONS_HASH,
      },
    },
  };
}

export async function submitTicketsMassActions(
  params: SubmitTicketsMassActionsParams,
): Promise<SubmitTicketsMassActionsResponse> {
  const payload = buildTicketsMassActionsPayload(params);

  console.info("[TicketsMassActions] Submitting mass actions:", {
    ticketCount: params.ids.length,
    stepCount: params.steps.length,
    path: getDeskproTicketsMassActionsGraphqlPath(),
    params: payload.variables.params,
  });

  try {
    const client = await DeskproClient.fromSession();
    const data = await client.post<unknown>(
      getDeskproTicketsMassActionsGraphqlPath(),
      payload,
    );

    const graphqlErrors = collectGraphqlErrors(data);
    if (graphqlErrors.length > 0) {
      const message = formatGraphqlErrors(graphqlErrors);
      console.error("[TicketsMassActions] GraphQL errors:", graphqlErrors);
      throw new Error(`Failed to submit mass actions: ${message}`);
    }

    return { success: true };
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof DeskproTimeoutError
    ) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? "unknown";
      const preview = summarizeResponse(error.response?.data);
      console.error(
        "[TicketsMassActions] HTTP error:",
        status,
        error.response?.data,
      );
      throw new Error(
        `Failed to submit mass actions (HTTP ${status}): ${preview}`,
      );
    }

    throw error;
  }
}
