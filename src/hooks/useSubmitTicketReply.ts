"use client";

import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ReplyAttachment,
  ReplyMessageType,
  ReplyStatusId,
  ReplySubmitProgress,
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
  onProgress?: (progress: ReplySubmitProgress) => void;
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
  const { onProgress } = params;
  const attachmentFiles = params.attachments ?? [];

  onProgress?.({ stage: "preparing" });

  const uploadedAttachments: ReplyAttachment[] = [];

  for (let index = 0; index < attachmentFiles.length; index++) {
    const item = attachmentFiles[index];
    onProgress?.({
      stage: "uploading",
      current: index + 1,
      total: attachmentFiles.length,
    });

    const uploaded = await uploadReplyFile(item.file);
    uploadedAttachments.push({
      uploadRequestId: uploaded.uploadRequestId,
      isInline: item.isInline,
      downloadUrl: item.isInline ? uploaded.downloadUrl : undefined,
    });
  }

  onProgress?.({ stage: "submitting" });

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
