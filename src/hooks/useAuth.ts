"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { AuthMeResponse } from "@/types/auth";

async function fetchMe(): Promise<AuthMeResponse> {
  const { data } = await axios.get<AuthMeResponse>("/api/auth/me");
  return data;
}

export function useAuth() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
  });
}
