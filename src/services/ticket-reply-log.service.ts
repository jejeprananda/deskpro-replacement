import {
  getSupabaseAdmin,
  isSupabaseConfigured,
} from "@/lib/supabase-server";
import {
  createTicketReplyLogInputSchema,
  mapTicketReplyLogRow,
  ticketReplyLogRowSchema,
  type CreateTicketReplyLogInput,
  type TicketReplyLog,
} from "@/types/ticket-reply-log";

export async function logTicketReplyToSupabase(
  input: CreateTicketReplyLogInput,
): Promise<TicketReplyLog | null> {
  if (!isSupabaseConfigured()) {
    console.warn("[TicketReplyLog] Supabase not configured, skipping log");
    return null;
  }

  const parsed = createTicketReplyLogInputSchema.parse(input);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("ticket_replies")
    .insert({
      ticket_id: parsed.ticketId,
      deskpro_message_id: parsed.deskproMessageId,
      message_number: parsed.messageNumber,
      agent_id: parsed.agentId,
      agent_team_id: parsed.agentTeamId ?? null,
      message_type: parsed.messageType,
      status_id: parsed.statusId,
      message_body: parsed.messageBody,
      attachments: parsed.attachments,
      deskpro_sent_at: parsed.deskproSentAt ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to log ticket reply: ${error.message}`);
  }

  return mapTicketReplyLogRow(ticketReplyLogRowSchema.parse(data));
}

export async function listTicketReplyLogs(
  ticketId: string,
): Promise<TicketReplyLog[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("ticket_replies")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list ticket reply logs: ${error.message}`);
  }

  return (data ?? []).map((row) =>
    mapTicketReplyLogRow(ticketReplyLogRowSchema.parse(row)),
  );
}
