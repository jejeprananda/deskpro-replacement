import { z } from "zod";
import { formatAgentLabel } from "@/types/ticket-list";

const agentForClientSearchResponseSchema = z.object({
  data: z.object({
    users: z.object({
      users: z.array(
        z.object({
          id: z.union([z.string(), z.number()]),
          name: z.string().nullable().optional(),
          display_name: z.string().nullable().optional(),
          primary_email: z.string().nullable().optional(),
        }),
      ),
      totalCount: z.number().optional(),
      pageInfo: z.object({
        currentPage: z.number(),
        lastPage: z.number(),
      }),
    }),
  }),
});

export type AgentDirectoryItem = {
  id: string;
  label: string;
  displayName: string | null;
  email: string | null;
};

export type AgentDirectoryResponse = {
  agents: AgentDirectoryItem[];
  page: number;
  lastPage: number;
  totalCount: number;
};

export function normalizeAgentDirectoryPage(
  data: unknown,
): AgentDirectoryResponse {
  const entry = Array.isArray(data) ? data[0] : data;
  const parsed = agentForClientSearchResponseSchema.parse(entry);
  const users = parsed.data.users;

  return {
    agents: users.users.map((agent) => {
      const label = formatAgentLabel(agent) ?? String(agent.id);
      return {
        id: String(agent.id),
        label,
        displayName: agent.display_name?.trim() ?? agent.name?.trim() ?? null,
        email: agent.primary_email?.trim() ?? null,
      };
    }),
    page: users.pageInfo.currentPage,
    lastPage: users.pageInfo.lastPage,
    totalCount: users.totalCount ?? users.users.length,
  };
}

export const agentDirectoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});
