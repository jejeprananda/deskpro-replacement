import axios from "axios";
import { DeskproClient } from "@/lib/deskpro-client";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import {
  normalizeAgentTeams,
  type AgentTeamsResponse,
} from "@/types/agent-teams";

const AGENT_TEAMS_HASH =
  "7eb08b8276aa0fa1faea102f595df72fb511e752dd3ff1c527c12b1ba5197706";

const AGENT_TEAMS_PAYLOAD = {
  operationName: "AgentTeams",
  variables: {},
  extensions: {
    persistedQuery: {
      version: 1,
      sha256Hash: AGENT_TEAMS_HASH,
    },
  },
} as const;

export async function fetchAgentTeams(): Promise<AgentTeamsResponse> {
  try {
    const client = await DeskproClient.fromSession();
    const data = await client.post<unknown>(
      "/graphql/AgentTeams",
      AGENT_TEAMS_PAYLOAD,
    );

    return normalizeAgentTeams(data);
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof DeskproTimeoutError
    ) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      console.error(
        "[AgentTeams] HTTP error:",
        error.response?.status,
        error.response?.data,
      );
      throw new Error("Failed to load agent teams");
    }

    throw error;
  }
}
