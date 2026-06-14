"use client";

import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ReplyAttachment,
  ReplyMessageType,
  ReplyStatusId,
  SubmitTicketReplyResponse,
} from "@/types/ticket-reply";

export type SubmitTicketReplyFile = {
  file: File;
  isInline: boolean;
};

export type SubmitTicketReplyParams = {
  ticketId: string;
  message: string;
  statusId: ReplyStatusId;
  messageType: ReplyMessageType;
  attachments?: SubmitTicketReplyFile[];
  ownerId?: string | null;
};

type BlobUploadResponse = {
  uploadRequestId: string;
  downloadUrl: string;
  filename: string;
};

async function uploadReplyFile(file: File): Promise<BlobUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await axios.post<BlobUploadResponse>(
    "/api/deskpro/blobs/upload",
    formData,
  );

  return data;
}

async function submitTicketReplyRequest(
  params: SubmitTicketReplyParams,
): Promise<SubmitTicketReplyResponse> {
  const attachmentFiles = params.attachments ?? [];
  const uploadedAttachments: ReplyAttachment[] = await Promise.all(
    attachmentFiles.map(async (item) => {
      const uploaded = await uploadReplyFile(item.file);

      return {
        uploadRequestId: uploaded.uploadRequestId,
        isInline: item.isInline,
        downloadUrl: item.isInline ? uploaded.downloadUrl : undefined,
      };
    }),
  );

  const { data } = await axios.post<SubmitTicketReplyResponse>(
    `/api/deskpro/tickets/${params.ticketId}/reply`,
    {
      message: params.message,
      statusId: params.statusId,
      messageType: params.messageType,
      attachments: uploadedAttachments,
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
