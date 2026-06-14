import { z } from "zod";

const agentTeamSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
});

const agentTeamsResponseSchema = z.object({
  data: z.object({
    agentTeams: z.array(agentTeamSchema),
  }),
});

export type AgentTeamItem = {
  id: string;
  name: string;
};

export type AgentTeamsResponse = {
  teams: AgentTeamItem[];
};

export function normalizeAgentTeams(data: unknown): AgentTeamsResponse {
  const parsed = agentTeamsResponseSchema.parse(data);

  return {
    teams: parsed.data.agentTeams.map((team) => ({
      id: String(team.id),
      name: team.name,
    })),
  };
}
