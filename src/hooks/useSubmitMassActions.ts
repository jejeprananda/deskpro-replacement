"use client";

import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  MassActionStep,
  SubmitTicketsMassActionsResponse,
} from "@/types/mass-action";

export type SubmitMassActionsParams = {
  ids: string[];
  steps: MassActionStep[];
};

async function submitMassActionsRequest(
  params: SubmitMassActionsParams,
): Promise<SubmitTicketsMassActionsResponse> {
  const { data } = await axios.post<SubmitTicketsMassActionsResponse>(
    "/api/deskpro/tickets/mass-actions",
    params,
  );

  return data;
}

export function useSubmitMassActions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitMassActionsRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tickets", "list"] });
      void queryClient.invalidateQueries({
        queryKey: ["tickets", "filter-counts"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["tickets", "status-summary"],
      });
    },
  });
}
