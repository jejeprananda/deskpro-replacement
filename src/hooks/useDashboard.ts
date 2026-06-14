"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { DashboardResponse } from "@/types/dashboard";

async function fetchDashboard(): Promise<DashboardResponse> {
  const { data } = await axios.get<DashboardResponse>("/api/deskpro/dashboard");
  return data;
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
