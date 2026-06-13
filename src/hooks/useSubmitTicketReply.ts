"use client";

import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ReplyStatusId,
  SubmitTicketReplyResponse,
} from "@/types/ticket-reply";

export type SubmitTicketReplyParams = {
  ticketId: string;
  message: string;
  statusId: ReplyStatusId;
  ownerId?: string | null;
};

async function submitTicketReplyRequest(
  params: SubmitTicketReplyParams,
): Promise<SubmitTicketReplyResponse> {
  const { data } = await axios.post<SubmitTicketReplyResponse>(
    `/api/deskpro/tickets/${params.ticketId}/reply`,
    {
      message: params.message,
      statusId: params.statusId,
    },
  );

  return data;
}

export function useSubmitTicketReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitTicketReplyRequest,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["tickets", "detail", variables.ticketId, variables.ownerId],
      });
    },
  });
}
