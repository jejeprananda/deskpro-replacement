"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { AgentDirectoryResponse } from "@/types/agent-directory";

async function fetchAgentDirectory(
  page: number,
): Promise<AgentDirectoryResponse> {
  const { data } = await axios.get<AgentDirectoryResponse>(
    "/api/deskpro/agents",
    { params: { page } },
  );
  return data;
}

export function useAgentDirectory(page: number) {
  return useQuery({
    queryKey: ["agents", page],
    queryFn: () => fetchAgentDirectory(page),
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
}
