"use client";

import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  MassActionStep,
  MassActionSubmitProgress,
  SubmitTicketsMassActionsResponse,
} from "@/types/mass-action";

export type SubmitMassActionsParams = {
  ids: string[];
  steps: MassActionStep[];
  onProgress?: (progress: MassActionSubmitProgress) => void;
};

async function submitMassActionsRequest(
  params: SubmitMassActionsParams,
): Promise<SubmitTicketsMassActionsResponse> {
  const { onProgress } = params;

  onProgress?.({ stage: "preparing" });
  onProgress?.({ stage: "submitting" });

  const { data } = await axios.post<SubmitTicketsMassActionsResponse>(
    "/api/deskpro/tickets/mass-actions",
    {
      ids: params.ids,
      steps: params.steps,
    },
  );

  return data;
}

export function useSubmitMassActions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitMassActionsRequest,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["tickets", "list"] });
      void queryClient.invalidateQueries({
        queryKey: ["tickets", "filter-counts"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["tickets", "status-summary"],
      });

      if (variables.ids.length === 1) {
        void queryClient.invalidateQueries({
          queryKey: ["tickets", "detail", variables.ids[0]],
        });
      }
    },
  });
}
