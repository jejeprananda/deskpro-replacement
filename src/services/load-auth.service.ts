import axios from "axios";
import { formatCookieHeader } from "@/lib/cookies";
import { getDeskproLoadAuthUrl } from "@/lib/deskpro-endpoints";
import { AuthError } from "@/lib/errors";
import type { DeskproUserRaw } from "@/types/user";

export type LoadAuthResult = {
  user: DeskproUserRaw;
  agentId: string;
  agentTeamId: string;
};

const LOAD_AUTH_PAYLOAD = [
  {
    operationName: "LoadAuth",
    variables: {
      usersourceId: null,
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash:
          "9bb10030317c93dcf1f31a68dcb60f48dbb2c3452542dbf581779786cc4b7ca9",
      },
    },
  },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectGraphqlErrors(data: unknown): unknown[] {
  const errors: unknown[] = [];

  function walk(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    if (!isRecord(value)) {
      return;
    }

    if (Array.isArray(value.errors)) {
      errors.push(...value.errors);
    }

    if (isRecord(value.data)) {
      walk(value.data);
    }
  }

  walk(data);
  return errors;
}

function normalizeUser(raw: Record<string, unknown>): DeskproUserRaw | null {
  const id = raw.id ?? raw.user_id ?? raw.agent_id;
  const name = raw.name;
  const displayName = raw.display_name ?? raw.displayName ?? raw.name;
  const email = raw.primary_email ?? raw.primaryEmail ?? raw.email;

  if (id == null || name == null || displayName == null || email == null) {
    return null;
  }

  const avatar = raw.avatar;
  const timezone = raw.timezone;

  return {
    id: String(id),
    name: String(name),
    display_name: String(displayName),
    primary_email: String(email),
    avatar:
      typeof avatar === "string" && avatar.length > 0 ? avatar : undefined,
    timezone:
      typeof timezone === "string" && timezone.length > 0 ? timezone : undefined,
  };
}

function findUserInObject(
  value: unknown,
  depth = 0,
  visited = new Set<unknown>(),
): DeskproUserRaw | null {
  if (depth > 12 || value == null || visited.has(value)) {
    return null;
  }

  visited.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findUserInObject(item, depth + 1, visited);
      if (found) {
        return found;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const normalized = normalizeUser(value);
  if (normalized) {
    return normalized;
  }

  for (const nestedValue of Object.values(value)) {
    const found = findUserInObject(nestedValue, depth + 1, visited);
    if (found) {
      return found;
    }
  }

  return null;
}

function summarizeResponse(data: unknown): string {
  try {
    return JSON.stringify(data).slice(0, 500);
  } catch {
    return String(data);
  }
}

function extractAgentContext(data: unknown): {
  agentId: string;
  agentTeamId: string;
} {
  function walk(value: unknown, depth = 0, visited = new Set<unknown>()): {
    agentId: string;
    agentTeamId: string;
  } {
    if (depth > 12 || value == null || visited.has(value)) {
      return { agentId: "", agentTeamId: "" };
    }

    visited.add(value);

    if (Array.isArray(value)) {
      let foundAgentId = "";
      let foundTeamId = "";

      for (const item of value) {
        const result = walk(item, depth + 1, visited);
        foundAgentId = foundAgentId || result.agentId;
        foundTeamId = foundTeamId || result.agentTeamId;

        if (foundAgentId && foundTeamId) {
          break;
        }
      }

      return { agentId: foundAgentId, agentTeamId: foundTeamId };
    }

    if (!isRecord(value)) {
      return { agentId: "", agentTeamId: "" };
    }

    const nestedAgentInfo = value.agentInfo;
    const nestedPrimaryTeam = value.primaryTeam;
    let foundAgentId = "";
    let foundTeamId = "";

    if (isRecord(nestedAgentInfo) && nestedAgentInfo.id != null) {
      foundAgentId = String(nestedAgentInfo.id);
    }

    if (isRecord(nestedPrimaryTeam) && nestedPrimaryTeam.id != null) {
      foundTeamId = String(nestedPrimaryTeam.id);
    }

    if (foundAgentId && foundTeamId) {
      return { agentId: foundAgentId, agentTeamId: foundTeamId };
    }

    for (const nestedValue of Object.values(value)) {
      const result = walk(nestedValue, depth + 1, visited);
      foundAgentId = foundAgentId || result.agentId;
      foundTeamId = foundTeamId || result.agentTeamId;

      if (foundAgentId && foundTeamId) {
        break;
      }
    }

    return { agentId: foundAgentId, agentTeamId: foundTeamId };
  }

  if (isRecord(data)) {
    const agentInfo = data.agentInfo;
    const primaryTeam = data.primaryTeam;

    const agentId =
      isRecord(agentInfo) && agentInfo.id != null ? String(agentInfo.id) : "";
    const agentTeamId =
      isRecord(primaryTeam) && primaryTeam.id != null
        ? String(primaryTeam.id)
        : "";

    if (agentId && agentTeamId) {
      return { agentId, agentTeamId };
    }
  }

  return walk(data);
}

function extractLoadAuthResult(data: unknown): LoadAuthResult {
  const graphqlErrors = collectGraphqlErrors(data);

  if (graphqlErrors.length > 0) {
    console.error("[LoadAuth] GraphQL errors:", graphqlErrors);
    throw new AuthError("Failed to load user profile", 401);
  }

  const user = findUserInObject(data);

  if (!user) {
    console.error(
      "[LoadAuth] User not found. Response preview:",
      summarizeResponse(data),
    );
    throw new AuthError("User profile not found in LoadAuth response", 500);
  }

  const { agentId, agentTeamId } = extractAgentContext(data);

  return {
    user,
    agentId,
    agentTeamId,
  };
}

function getRequestTimeout(): number {
  return Number(process.env.DESKPRO_REQUEST_TIMEOUT_MS ?? 30000);
}

export async function loadAuth(
  deskproCookies: string[],
  accessToken: string,
): Promise<LoadAuthResult> {
  if (deskproCookies.length === 0) {
    console.warn("[LoadAuth] No Deskpro session cookies captured from login");
  }

  try {
    const response = await axios.post(
      getDeskproLoadAuthUrl(),
      LOAD_AUTH_PAYLOAD,
      {
        timeout: getRequestTimeout(),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Cookie: formatCookieHeader(deskproCookies),
          "Content-Type": "application/json",
        },
      },
    );

    return extractLoadAuthResult(response.data);
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      console.error(
        "[LoadAuth] HTTP error:",
        error.response?.status,
        summarizeResponse(error.response?.data),
      );
      const status = error.response?.status ?? 500;
      throw new AuthError("Failed to load user profile", status);
    }

    throw error;
  }
}
