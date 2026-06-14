import axios from "axios";
import { DeskproClient } from "@/lib/deskpro-client";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import {
  normalizeAgentDirectoryPage,
  type AgentDirectoryResponse,
} from "@/types/agent-directory";
import {
  shouldEnrichAssignedAgent,
  type TicketListItem,
} from "@/types/ticket-list";

const AGENT_FOR_CLIENT_SEARCH_HASH =
  "e96325f8df0fb84ea4a6a6d7acb3bcdbdad01258b8ea8e3f4ff3eebf562b4059";

const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_VERSION = 2;

type AgentDirectoryCache = {
  version: number;
  expiresAt: number;
  agents: Map<string, string>;
};

let agentDirectoryCache: AgentDirectoryCache | null = null;

function getActiveAgentDirectory(): Map<string, string> | null {
  if (
    !agentDirectoryCache ||
    agentDirectoryCache.version !== CACHE_VERSION ||
    agentDirectoryCache.expiresAt <= Date.now()
  ) {
    return null;
  }

  return agentDirectoryCache.agents;
}

function buildAgentForClientSearchPayload(page: number) {
  return [
    {
      operationName: "AgentForClientSearch",
      variables: { page },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: AGENT_FOR_CLIENT_SEARCH_HASH,
        },
      },
    },
  ];
}

async function fetchAgentDirectoryPageRaw(page: number): Promise<unknown> {
  const client = await DeskproClient.fromSession();
  return client.post<unknown>(
    "/graphql/AgentForClientSearch",
    buildAgentForClientSearchPayload(page),
  );
}

export async function fetchAgentDirectory(
  page: number,
): Promise<AgentDirectoryResponse> {
  try {
    const data = await fetchAgentDirectoryPageRaw(page);
    return normalizeAgentDirectoryPage(data);
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof DeskproTimeoutError
    ) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      console.error(
        "[AgentDirectory] HTTP error:",
        error.response?.status,
        error.response?.data,
      );
      throw new Error("Failed to load agent directory");
    }

    throw error;
  }
}

export async function resolveAgentNames(
  agentIds: string[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(agentIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const resolved = new Map<string, string>();
  const pending = new Set(uniqueIds);
  const directory = getActiveAgentDirectory() ?? new Map<string, string>();

  for (const agentId of uniqueIds) {
    const cachedName = directory.get(agentId);
    if (cachedName) {
      resolved.set(agentId, cachedName);
      pending.delete(agentId);
    }
  }

  if (pending.size === 0) {
    return resolved;
  }

  let page = 1;
  let lastPage = 1;

  try {
    while (pending.size > 0 && page <= lastPage) {
      const response = await fetchAgentDirectory(page);
      lastPage = response.lastPage;

      for (const agent of response.agents) {
        directory.set(agent.id, agent.label);

        if (pending.has(agent.id)) {
          resolved.set(agent.id, agent.label);
          pending.delete(agent.id);
        }
      }

      page += 1;
    }

    agentDirectoryCache = {
      version: CACHE_VERSION,
      expiresAt: Date.now() + CACHE_TTL_MS,
      agents: directory,
    };

    return resolved;
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof DeskproTimeoutError
    ) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      console.error(
        "[AgentDirectory] HTTP error:",
        error.response?.status,
        error.response?.data,
      );
      throw new Error("Failed to load agent directory");
    }

    throw error;
  }
}

export function enrichTicketListAgents(
  tickets: TicketListItem[],
  agentNames: Map<string, string>,
): TicketListItem[] {
  return tickets.map((ticket) => {
    if (!ticket.agentId) {
      return ticket;
    }

    const resolvedName = agentNames.get(ticket.agentId);
    if (!resolvedName) {
      return ticket;
    }

    if (
      !shouldEnrichAssignedAgent(ticket) ||
      ticket.assignedAgent === resolvedName
    ) {
      return ticket;
    }

    return {
      ...ticket,
      assignedAgent: resolvedName,
    };
  });
}
