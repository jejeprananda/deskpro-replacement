"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { TopLevelSnippetsResponse } from "@/types/top-level-snippets";

async function fetchTopLevelSnippets(): Promise<TopLevelSnippetsResponse> {
  const { data } = await axios.get<TopLevelSnippetsResponse>(
    "/api/deskpro/snippets",
  );
  return data;
}

export function useTopLevelSnippets() {
  return useQuery({
    queryKey: ["snippets"],
    queryFn: fetchTopLevelSnippets,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
}
