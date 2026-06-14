"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { AgentTeamsResponse } from "@/types/agent-teams";

async function fetchAgentTeams(): Promise<AgentTeamsResponse> {
  const { data } = await axios.get<AgentTeamsResponse>(
    "/api/deskpro/agent-teams",
  );
  return data;
}

export function useAgentTeams() {
  return useQuery({
    queryKey: ["agent-teams"],
    queryFn: fetchAgentTeams,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
}
