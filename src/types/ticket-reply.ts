import { z } from "zod";

export const replyStatusIdSchema = z.enum(["awaiting_agent", "awaiting_user"]);

export type ReplyStatusId = z.infer<typeof replyStatusIdSchema>;

export const replyMessageTypeSchema = z.enum(["email", "note"]);

export type ReplyMessageType = z.infer<typeof replyMessageTypeSchema>;

export const replyAttachmentSchema = z.object({
  uploadRequestId: z.string().min(1),
  isInline: z.boolean(),
  downloadUrl: z.string().url().optional(),
});

export type ReplyAttachment = z.infer<typeof replyAttachmentSchema>;

export const submitTicketReplyBodySchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
  statusId: replyStatusIdSchema,
  messageType: replyMessageTypeSchema.default("email"),
  attachments: z.array(replyAttachmentSchema).default([]),
});

export type SubmitTicketReplyBody = z.infer<typeof submitTicketReplyBodySchema>;

export type SubmitTicketReplyResponse = {
  messageId: string;
  messageNumber: number;
  dateCreated: string;
  statusId: ReplyStatusId;
  messageType: ReplyMessageType;
};

const ticketReplySchema = z.object({
  id: z.union([z.string(), z.number()]),
  messageNumber: z.number(),
  date_created: z.string(),
});

type TicketReplyRaw = z.infer<typeof ticketReplySchema>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findTicketReplyInObject(
  value: unknown,
  depth = 0,
  visited = new Set<unknown>(),
): TicketReplyRaw | null {
  if (depth > 12 || value == null || visited.has(value)) {
    return null;
  }

  visited.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findTicketReplyInObject(item, depth + 1, visited);
      if (found) {
        return found;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const ticketReply = value.ticketReply;
  if (isRecord(ticketReply)) {
    const parsed = ticketReplySchema.safeParse(ticketReply);
    if (parsed.success) {
      return parsed.data;
    }
  }

  for (const nestedValue of Object.values(value)) {
    const found = findTicketReplyInObject(nestedValue, depth + 1, visited);
    if (found) {
      return found;
    }
  }

  return null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildInlineImageHtml(downloadUrl: string): string {
  return `<p><img src="${downloadUrl}" alt="" title="" class="inline" data-blob-version="1" width="auto" height=""></p>`;
}

export function buildReplyHtml(
  text: string,
  inlineDownloadUrls: string[] = [],
): string {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const escaped = escapeHtml(normalized);
  const textHtml = `<p>${escaped.replace(/\n/g, "<br>")}</p>`;
  const inlineHtml = inlineDownloadUrls.map(buildInlineImageHtml).join("");

  return `${textHtml}${inlineHtml}`;
}

export function textToReplyHtml(text: string): string {
  return buildReplyHtml(text);
}

export function normalizeSubmitTicketReplyResponse(
  data: unknown,
  statusId: ReplyStatusId,
  messageType: ReplyMessageType,
): SubmitTicketReplyResponse {
  const ticketReply = findTicketReplyInObject(data);

  if (!ticketReply) {
    throw new Error("ticketReply not found in SubmitReply response");
  }

  return {
    messageId: String(ticketReply.id),
    messageNumber: ticketReply.messageNumber,
    dateCreated: ticketReply.date_created,
    statusId,
    messageType,
  };
}
