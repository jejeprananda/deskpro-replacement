import { z } from "zod";
import {
  replyAttachmentSchema,
  replyMessageTypeSchema,
  replyStatusIdSchema,
} from "@/types/ticket-reply";

export const ticketReplyLogRowSchema = z.object({
  id: z.string().uuid(),
  ticket_id: z.string(),
  deskpro_message_id: z.string(),
  message_number: z.number().int(),
  agent_id: z.string(),
  agent_team_id: z.string().nullable(),
  message_type: replyMessageTypeSchema,
  status_id: replyStatusIdSchema,
  message_body: z.string(),
  attachments: z.array(replyAttachmentSchema),
  deskpro_sent_at: z.string().nullable(),
  created_at: z.string(),
});

export type TicketReplyLogRow = z.infer<typeof ticketReplyLogRowSchema>;

export type TicketReplyLog = {
  id: string;
  ticketId: string;
  deskproMessageId: string;
  messageNumber: number;
  agentId: string;
  agentTeamId: string | null;
  messageType: z.infer<typeof replyMessageTypeSchema>;
  statusId: z.infer<typeof replyStatusIdSchema>;
  messageBody: string;
  attachments: z.infer<typeof replyAttachmentSchema>[];
  deskproSentAt: string | null;
  createdAt: string;
};

export const createTicketReplyLogInputSchema = z.object({
  ticketId: z.string().min(1),
  deskproMessageId: z.string().min(1),
  messageNumber: z.number().int().positive(),
  agentId: z.string().min(1),
  agentTeamId: z.string().optional(),
  messageType: replyMessageTypeSchema,
  statusId: replyStatusIdSchema,
  messageBody: z.string().min(1),
  attachments: z.array(replyAttachmentSchema).default([]),
  deskproSentAt: z.string().optional(),
});

export type CreateTicketReplyLogInput = z.infer<
  typeof createTicketReplyLogInputSchema
>;

export function mapTicketReplyLogRow(row: TicketReplyLogRow): TicketReplyLog {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    deskproMessageId: row.deskpro_message_id,
    messageNumber: row.message_number,
    agentId: row.agent_id,
    agentTeamId: row.agent_team_id,
    messageType: row.message_type,
    statusId: row.status_id,
    messageBody: row.message_body,
    attachments: row.attachments,
    deskproSentAt: row.deskpro_sent_at,
    createdAt: row.created_at,
  };
}
